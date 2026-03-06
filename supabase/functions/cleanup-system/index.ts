import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit: armazena último acesso por admin_id
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto em ms

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar se é admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile || !profile.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem executar limpeza do sistema.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ⚡ RATE LIMIT: Verificar se admin já executou nos últimos 60 segundos
    const now = Date.now();
    const lastExecution = rateLimitMap.get(user.id);
    
    if (lastExecution && (now - lastExecution) < RATE_LIMIT_WINDOW) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_WINDOW - (now - lastExecution)) / 1000);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit excedido',
          message: `Aguarde ${remainingSeconds} segundos antes de executar novamente.`,
          retry_after: remainingSeconds
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': remainingSeconds.toString()
          },
        }
      );
    }

    // Atualizar rate limit
    rateLimitMap.set(user.id, now);

    // Criar cliente com service_role para operações de limpeza
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = {
      logsDeleted: 0,
      sessionsDeleted: 0,
      orphanedRecordsDeleted: 0,
      errors: [] as string[],
    };

    const startTime = new Date();

    // 1. Deletar logs com mais de 90 dias
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: oldLogs, error: logsError } = await supabaseAdmin
        .from('admin_logs')
        .delete()
        .lt('created_at', ninetyDaysAgo.toISOString())
        .select('id');

      if (logsError) {
        results.errors.push(`Erro ao deletar logs: ${logsError.message}`);
      } else {
        results.logsDeleted = oldLogs?.length || 0;
      }
    } catch (error) {
      results.errors.push(`Erro ao processar logs: ${error.message}`);
    }

    // 2. Deletar sessões expiradas (via SQL direto)
    try {
      const { data: sessionsData, error: sessionsError } = await supabaseAdmin.rpc(
        'delete_expired_sessions'
      );

      if (sessionsError) {
        // Se a função RPC não existir, tentar via query direta
        // Nota: auth.sessions não é acessível diretamente via API, apenas via SQL
        results.errors.push(`Aviso: Limpeza de sessões requer função SQL customizada`);
        results.sessionsDeleted = 0;
      } else {
        results.sessionsDeleted = sessionsData || 0;
      }
    } catch (error) {
      results.errors.push(`Aviso: ${error.message}`);
    }

    // 3. Deletar registros órfãos (investimentos sem usuário)
    try {
      const { data: orphanedInvestments, error: investmentsError } = await supabaseAdmin
        .from('investments')
        .delete()
        .not('user_id', 'in', `(SELECT id FROM profiles)`)
        .select('id');

      if (investmentsError) {
        results.errors.push(`Erro ao deletar investimentos órfãos: ${investmentsError.message}`);
      } else {
        results.orphanedRecordsDeleted += orphanedInvestments?.length || 0;
      }
    } catch (error) {
      results.errors.push(`Erro ao processar investimentos órfãos: ${error.message}`);
    }

    // 4. Deletar patrimônios órfãos
    try {
      const { data: orphanedPatrimonios, error: patrimoniosError } = await supabaseAdmin
        .from('patrimonios')
        .delete()
        .not('user_id', 'in', `(SELECT id FROM profiles)`)
        .select('id');

      if (patrimoniosError) {
        results.errors.push(`Erro ao deletar patrimônios órfãos: ${patrimoniosError.message}`);
      } else {
        results.orphanedRecordsDeleted += orphanedPatrimonios?.length || 0;
      }
    } catch (error) {
      results.errors.push(`Erro ao processar patrimônios órfãos: ${error.message}`);
    }

    // 5. Deletar despesas órfãs
    try {
      const { data: orphanedExpenses, error: expensesError } = await supabaseAdmin
        .from('expenses')
        .delete()
        .not('user_id', 'in', `(SELECT id FROM profiles)`)
        .select('id');

      if (expensesError) {
        results.errors.push(`Erro ao deletar despesas órfãs: ${expensesError.message}`);
      } else {
        results.orphanedRecordsDeleted += orphanedExpenses?.length || 0;
      }
    } catch (error) {
      results.errors.push(`Erro ao processar despesas órfãs: ${error.message}`);
    }

    // 6. Deletar receitas órfãs
    try {
      const { data: orphanedRevenues, error: revenuesError } = await supabaseAdmin
        .from('revenues')
        .delete()
        .not('user_id', 'in', `(SELECT id FROM profiles)`)
        .select('id');

      if (revenuesError) {
        results.errors.push(`Erro ao deletar receitas órfãs: ${revenuesError.message}`);
      } else {
        results.orphanedRecordsDeleted += orphanedRevenues?.length || 0;
      }
    } catch (error) {
      results.errors.push(`Erro ao processar receitas órfãs: ${error.message}`);
    }

    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();

    // 📋 Registrar a execução da limpeza no log de admin com detalhes completos
    try {
      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action: 'system_cleanup',
        details: {
          logsDeleted: results.logsDeleted,
          sessionsDeleted: results.sessionsDeleted,
          orphanedRecordsDeleted: results.orphanedRecordsDeleted,
          totalDeleted: results.logsDeleted + results.sessionsDeleted + results.orphanedRecordsDeleted,
          errors: results.errors,
          executedAt: startTime.toISOString(),
          completedAt: endTime.toISOString(),
          executionTimeMs: executionTime,
          success: results.errors.length === 0,
        },
      });
    } catch (error) {
      console.error('Erro ao registrar log de limpeza:', error);
    }

    // Retornar resultados
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Limpeza do sistema executada com sucesso',
        results: {
          logsDeleted: results.logsDeleted,
          sessionsDeleted: results.sessionsDeleted,
          orphanedRecordsDeleted: results.orphanedRecordsDeleted,
          totalDeleted: results.logsDeleted + results.sessionsDeleted + results.orphanedRecordsDeleted,
          executionTimeMs: executionTime,
        },
        warnings: results.errors.length > 0 ? results.errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro na função cleanup-system:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro ao executar limpeza do sistema',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});