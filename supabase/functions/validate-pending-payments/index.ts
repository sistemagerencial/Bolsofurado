import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações do job de validação
const VALIDATION_CONFIG = {
  batchSize: 10,           // Processar 10 pagamentos por vez
  maxAge: 48,              // Verificar pagamentos até 48 horas
  timeoutMinutes: 15,      // Timeout para pagamentos PIX
  reconciliationHours: 24  // Reconciliação a cada 24 horas
};

interface PendingPayment {
  id: string;
  payment_id: string;
  user_id: string;
  amount: number;
  plan_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PaymentValidationResult {
  payment_id: string;
  previous_status: string;
  current_status: string;
  action_taken: 'activated' | 'expired' | 'no_change' | 'error';
  details?: string;
}

// Função para consultar status no Mercado Pago
async function checkPaymentInMercadoPago(paymentId: string, accessToken: string) {
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`MP API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro ao consultar pagamento ${paymentId}:`, error);
    throw error;
  }
}

// Função para ativar assinatura
async function activateSubscription(supabase: any, userId: string, planType: string, paymentData: any) {
  const now = new Date();
  const expiresAt = new Date(now);
  
  if (planType === 'yearly') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  // Atualizar perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      subscription_expires_at: expiresAt.toISOString(),
      plan_type: planType,
    })
    .eq('id', userId);

  if (profileError) throw profileError;

  // Atualizar histórico de pagamento
  const { error: historyError } = await supabase
    .from('payment_history')
    .update({
      status: 'approved',
      paid_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('payment_id', paymentData.id.toString());

  if (historyError) throw historyError;

  return expiresAt;
}

// Função para marcar pagamento como expirado
async function expirePayment(supabase: any, paymentId: string) {
  const { error } = await supabase
    .from('payment_history')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('payment_id', paymentId);

  if (error) throw error;
}

// Função para registrar log de validação
async function logValidation(supabase: any, action: string, details: any) {
  try {
    await supabase.from('admin_logs').insert({
      action: `payment_validation_${action}`,
      details: {
        timestamp: new Date().toISOString(),
        ...details
      }
    });
  } catch (error) {
    console.error('Erro ao salvar log:', error);
  }
}

// Função para buscar pagamentos pendentes
async function getPendingPayments(supabase: any): Promise<PendingPayment[]> {
  const hoursAgo = new Date();
  hoursAgo.setHours(hoursAgo.getHours() - VALIDATION_CONFIG.maxAge);

  const { data, error } = await supabase
    .from('payment_history')
    .select('*')
    .in('status', ['pending', 'in_process'])
    .gte('created_at', hoursAgo.toISOString())
    .order('created_at', { ascending: true })
    .limit(VALIDATION_CONFIG.batchSize);

  if (error) throw error;
  return data || [];
}

// Função para buscar pagamentos órfãos (sem histórico mas com status ativo)
async function getOrphanedPayments(supabase: any) {
  const { data: activeProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, subscription_status, subscription_expires_at, plan_type')
    .eq('subscription_status', 'active');

  if (profilesError) throw profilesError;

  const orphans = [];
  
  for (const profile of activeProfiles || []) {
    const { data: history, error: historyError } = await supabase
      .from('payment_history')
      .select('id')
      .eq('user_id', profile.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1);

    if (historyError) continue;

    if (!history || history.length === 0) {
      orphans.push(profile);
    }
  }

  return orphans;
}

// Função principal de validação
Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`🔍 [${requestId}] Iniciando validação de pagamentos pendentes`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar variáveis de ambiente
    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!MERCADOPAGO_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variáveis de ambiente não configuradas');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Log início da validação
    await logValidation(supabase, 'started', {
      request_id: requestId,
      config: VALIDATION_CONFIG
    });

    const results: PaymentValidationResult[] = [];
    let processedCount = 0;
    let activatedCount = 0;
    let expiredCount = 0;
    let errorCount = 0;

    // 1. Validar pagamentos pendentes
    console.log(`📋 [${requestId}] Buscando pagamentos pendentes...`);
    const pendingPayments = await getPendingPayments(supabase);
    
    console.log(`📊 [${requestId}] Encontrados ${pendingPayments.length} pagamentos pendentes`);

    for (const payment of pendingPayments) {
      try {
        processedCount++;
        console.log(`🔄 [${requestId}] Processando pagamento ${payment.payment_id} (${processedCount}/${pendingPayments.length})`);

        // Verificar se o pagamento já expirou (PIX tem 15 minutos)
        const paymentAge = Date.now() - new Date(payment.created_at).getTime();
        const ageMinutes = paymentAge / (1000 * 60);

        if (ageMinutes > VALIDATION_CONFIG.timeoutMinutes) {
          console.log(`⏰ [${requestId}] Pagamento ${payment.payment_id} expirado (${Math.round(ageMinutes)} min)`);
          
          await expirePayment(supabase, payment.payment_id);
          expiredCount++;
          
          results.push({
            payment_id: payment.payment_id,
            previous_status: payment.status,
            current_status: 'expired',
            action_taken: 'expired',
            details: `Expirado após ${Math.round(ageMinutes)} minutos`
          });
          continue;
        }

        // Consultar status no Mercado Pago
        const mpPayment = await checkPaymentInMercadoPago(payment.payment_id, MERCADOPAGO_ACCESS_TOKEN);
        
        console.log(`💳 [${requestId}] Status MP para ${payment.payment_id}: ${mpPayment.status}`);

        if (mpPayment.status === 'approved') {
          console.log(`✅ [${requestId}] Ativando assinatura para pagamento ${payment.payment_id}`);
          
          const expiresAt = await activateSubscription(
            supabase, 
            payment.user_id, 
            payment.plan_type, 
            mpPayment
          );
          
          activatedCount++;
          
          results.push({
            payment_id: payment.payment_id,
            previous_status: payment.status,
            current_status: 'approved',
            action_taken: 'activated',
            details: `Assinatura ativa até ${expiresAt.toLocaleDateString()}`
          });

        } else if (['cancelled', 'rejected'].includes(mpPayment.status)) {
          console.log(`❌ [${requestId}] Pagamento ${payment.payment_id} cancelado/rejeitado`);
          
          await expirePayment(supabase, payment.payment_id);
          expiredCount++;
          
          results.push({
            payment_id: payment.payment_id,
            previous_status: payment.status,
            current_status: mpPayment.status,
            action_taken: 'expired',
            details: `Status final: ${mpPayment.status}`
          });

        } else {
          console.log(`⏳ [${requestId}] Pagamento ${payment.payment_id} ainda pendente: ${mpPayment.status}`);
          
          results.push({
            payment_id: payment.payment_id,
            previous_status: payment.status,
            current_status: mpPayment.status,
            action_taken: 'no_change',
            details: `Aguardando confirmação`
          });
        }

      } catch (error) {
        console.error(`❌ [${requestId}] Erro ao processar pagamento ${payment.payment_id}:`, error);
        errorCount++;
        
        results.push({
          payment_id: payment.payment_id,
          previous_status: payment.status,
          current_status: 'error',
          action_taken: 'error',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    // 2. Verificar pagamentos órfãos
    console.log(`🔍 [${requestId}] Verificando pagamentos órfãos...`);
    const orphanedPayments = await getOrphanedPayments(supabase);
    
    if (orphanedPayments.length > 0) {
      console.log(`⚠️ [${requestId}] Encontrados ${orphanedPayments.length} pagamentos órfãos`);
      
      await logValidation(supabase, 'orphans_detected', {
        request_id: requestId,
        count: orphanedPayments.length,
        profiles: orphanedPayments.map(p => ({ id: p.id, plan_type: p.plan_type }))
      });
    }

    // 3. Verificar assinaturas expiradas
    const now = new Date();
    const { data: expiredSubscriptions, error: expiredError } = await supabase
      .from('profiles')
      .select('id, subscription_expires_at, plan_type')
      .eq('subscription_status', 'active')
      .lt('subscription_expires_at', now.toISOString());

    if (!expiredError && expiredSubscriptions && expiredSubscriptions.length > 0) {
      console.log(`📅 [${requestId}] Desativando ${expiredSubscriptions.length} assinaturas expiradas`);
      
      const expiredIds = expiredSubscriptions.map(sub => sub.id);
      await supabase
        .from('profiles')
        .update({ subscription_status: 'expired' })
        .in('id', expiredIds);
      
      await logValidation(supabase, 'subscriptions_expired', {
        request_id: requestId,
        count: expiredSubscriptions.length,
        expired_profiles: expiredIds
      });
    }

    // Log final
    const summary = {
      request_id: requestId,
      processed: processedCount,
      activated: activatedCount,
      expired: expiredCount,
      errors: errorCount,
      orphaned: orphanedPayments.length,
      expired_subscriptions: expiredSubscriptions?.length || 0,
      execution_time: Date.now()
    };

    console.log(`🎉 [${requestId}] Validação concluída:`, summary);
    
    await logValidation(supabase, 'completed', summary);

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        results,
        message: `Processados ${processedCount} pagamentos. ${activatedCount} ativados, ${expiredCount} expirados.`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error(`❌ [${requestId}] Erro na validação:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        request_id: requestId
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});