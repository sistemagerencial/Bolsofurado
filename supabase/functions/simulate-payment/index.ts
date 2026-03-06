import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Token de autorização não fornecido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { payment_id, plan_type } = body;

    if (!payment_id || !plan_type) {
      return new Response(JSON.stringify({ error: 'Payment ID e plan_type são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🧪 SIMULAÇÃO: Aprovando pagamento ${payment_id} para usuário ${user.id} - plano: ${plan_type}`);

    // Simular aprovação do pagamento
    const now = new Date();
    const expiresAt = new Date(now);

    if (plan_type === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // Atualizar perfil do usuário
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_expires_at: expiresAt.toISOString(),
        plan_type: plan_type,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError);
      throw new Error('Erro ao atualizar perfil: ' + updateError.message);
    }

    // Verificar se já existe registro deste pagamento para evitar duplicatas
    const { data: existingPayment } = await supabaseAdmin
      .from('payment_history')
      .select('id')
      .eq('payment_id', payment_id)
      .maybeSingle();

    if (!existingPayment) {
      // Registrar no histórico de pagamentos
      const amount = plan_type === 'yearly' ? 199.00 : 19.90;
      
      const { error: insertError } = await supabaseAdmin.from('payment_history').insert({
        user_id: user.id,
        payment_id: payment_id,
        amount: amount,
        currency: 'BRL',
        status: 'approved',
        payment_method: 'pix',
        plan_type: plan_type,
        external_reference: `${user.id}|${plan_type}`,
        paid_at: now.toISOString(),
      });

      if (insertError) {
        console.error('Erro ao inserir histórico:', insertError);
      } else {
        console.log('✅ Histórico de pagamento registrado com sucesso');
      }
    } else {
      console.log('Pagamento já registrado anteriormente, pulando inserção duplicada');
    }

    console.log(`✅ SIMULAÇÃO COMPLETA: Plano ${plan_type} ativado para usuário ${user.id} até ${expiresAt.toISOString()}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pagamento simulado com sucesso!',
        user_id: user.id,
        plan_type: plan_type,
        expires_at: expiresAt.toISOString(),
        simulation: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro na simulação:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});