/* eslint-disable @typescript-eslint/no-explicit-any */
// The function runs on Deno edge runtime; TS in the editor may not resolve ESM imports.
// @ts-ignore: Deno import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Declare Deno for editor TypeScript to avoid "Cannot find name 'Deno'" diagnostics
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReconciliationResult {
  total_checked: number;
  discrepancies_found: number;
  resolved_discrepancies: number;
  alerts_created: number;
  execution_time_ms: number;
}

interface PaymentDiscrepancy {
  type: 'missing_history' | 'status_mismatch' | 'duplicate_payment' | 'orphaned_subscription';
  payment_id?: string;
  user_id: string;
  details: any;
  severity: 'low' | 'medium' | 'high';
}

// Função para criar alerta de discrepância
async function createAlert(supabase: any, discrepancy: PaymentDiscrepancy, requestId: string) {
  try {
    await supabase.from('admin_logs').insert({
      action: `reconciliation_alert_${discrepancy.type}`,
      details: {
        request_id: requestId,
        discrepancy,
        timestamp: new Date().toISOString(),
        severity: discrepancy.severity,
        requires_attention: discrepancy.severity !== 'low'
      }
    });
  } catch (error) {
    console.error('Erro ao criar alerta:', formatError(error));
  }
}

// Função para buscar todos os pagamentos aprovados no Mercado Pago
async function getMercadoPagoPayments(accessToken: string, dateFrom: string) {
  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/search?external_reference=finapp_&sort=date_created&criteria=desc&range=date_created&begin_date=${dateFrom}T00:00:00.000-04:00&end_date=${new Date().toISOString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`MP API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos no MP:', formatError(error));
    throw error;
  }
}

// Função para verificar consistência de dados
async function checkDataConsistency(supabase: any): Promise<PaymentDiscrepancy[]> {
  const discrepancies: PaymentDiscrepancy[] = [];
  
  // 1. Verificar usuários com assinatura ativa mas sem histórico de pagamento aprovado
  const { data: activeUsers, error: activeError } = await supabase
    .from('profiles')
    .select('id, subscription_status, plan_type, subscription_expires_at')
    .eq('subscription_status', 'active');

  if (activeError) throw activeError;

  for (const user of activeUsers || []) {
    const { data: payments, error: paymentError } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1);

    if (paymentError) continue;

    if (!payments || payments.length === 0) {
      discrepancies.push({
        type: 'missing_history',
        user_id: user.id,
        details: {
          subscription_status: user.subscription_status,
          plan_type: user.plan_type,
          expires_at: user.subscription_expires_at
        },
        severity: 'high'
      });
    }
  }

  // 2. Verificar pagamentos duplicados
  const { data: duplicates, error: duplicatesError } = await supabase
    .from('payment_history')
    .select('payment_id, user_id, count(*)')
    .eq('status', 'approved')
    .group('payment_id, user_id')
    .having('count(*) > 1');

  if (!duplicatesError && duplicates) {
    for (const duplicate of duplicates) {
      discrepancies.push({
        type: 'duplicate_payment',
        payment_id: duplicate.payment_id,
        user_id: duplicate.user_id,
        details: { count: duplicate.count },
        severity: 'medium'
      });
    }
  }

  // 3. Verificar inconsistências de status
  const { data: statusMismatches, error: statusError } = await supabase
    .from('profiles')
    .select(`
      id, 
      subscription_status, 
      subscription_expires_at,
      payment_history!inner(id, status, created_at)
    `)
    .neq('subscription_status', 'payment_history.status');

  if (!statusError && statusMismatches) {
    for (const mismatch of statusMismatches) {
      discrepancies.push({
        type: 'status_mismatch',
        user_id: mismatch.id,
        details: {
          profile_status: mismatch.subscription_status,
          payment_status: mismatch.payment_history?.status,
          expires_at: mismatch.subscription_expires_at
        },
        severity: 'medium'
      });
    }
  }

  return discrepancies;
}

// Função para resolver discrepâncias automaticamente
async function resolveDiscrepancy(supabase: any, discrepancy: PaymentDiscrepancy): Promise<boolean> {
  try {
    switch (discrepancy.type) {
      case 'missing_history': {
        // Para usuários com assinatura ativa mas sem histórico, criar entrada de reconciliação
        const { error: historyError } = await supabase
          .from('payment_history')
          .insert({
            user_id: discrepancy.user_id,
            payment_id: `reconciliation_${Date.now()}`,
            amount: discrepancy.details.plan_type === 'yearly' ? 59.9 : 9.9,
            plan_type: discrepancy.details.plan_type || 'monthly',
            status: 'approved',
            paid_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        return !historyError;
      }

      case 'duplicate_payment': {
        // Remover pagamentos duplicados mantendo o mais recente
        const { data: duplicatePayments, error: fetchError } = await supabase
          .from('payment_history')
          .select('id, created_at')
          .eq('payment_id', discrepancy.payment_id)
          .eq('user_id', discrepancy.user_id)
          .order('created_at', { ascending: false });

        if (fetchError || !duplicatePayments || duplicatePayments.length <= 1) return false;

        // Manter o primeiro (mais recente) e remover os outros
        const toDelete = duplicatePayments.slice(1).map((p: any) => p.id);
        const { error: deleteError } = await supabase
          .from('payment_history')
          .delete()
          .in('id', toDelete);

        return !deleteError;
      }

      default:
        return false;
    }
  } catch (error) {
    console.error(`Erro ao resolver discrepância ${discrepancy.type}:`, formatError(error));
    return false;
  }
}

// Função principal de reconciliação
Deno.serve(async (req: any) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  console.log(`🔄 [${requestId}] Iniciando reconciliação de pagamentos`);

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY as string);
    
    // Log início da reconciliação
    await supabase.from('admin_logs').insert({
      action: 'reconciliation_started',
      details: {
        request_id: requestId,
        timestamp: new Date().toISOString()
      }
    });

    let totalChecked = 0;
    let discrepanciesFound = 0;
    let resolvedDiscrepancies = 0;
    let alertsCreated = 0;

    // 1. Verificar consistência dos dados internos
    console.log(`📊 [${requestId}] Verificando consistência de dados...`);
    const discrepancies = await checkDataConsistency(supabase);
    discrepanciesFound = discrepancies.length;
    totalChecked = discrepancies.length;

    console.log(`🔍 [${requestId}] Encontradas ${discrepanciesFound} discrepâncias`);

    // 2. Tentar resolver discrepâncias automaticamente
    for (const discrepancy of discrepancies) {
      const resolved = await resolveDiscrepancy(supabase, discrepancy);
      
      if (resolved) {
        resolvedDiscrepancies++;
        console.log(`✅ [${requestId}] Discrepância resolvida: ${discrepancy.type} para usuário ${discrepancy.user_id}`);
      } else {
        // Criar alerta para discrepâncias não resolvidas
        await createAlert(supabase, discrepancy, requestId);
        alertsCreated++;
        console.log(`⚠️ [${requestId}] Alerta criado para: ${discrepancy.type} (${discrepancy.severity})`);
      }
    }

    // 3. Verificar pagamentos órfãos no Mercado Pago (últimos 7 dias)
    console.log(`🔍 [${requestId}] Verificando pagamentos órfãos no Mercado Pago...`);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    try {
      const mpPayments = await getMercadoPagoPayments(
        MERCADOPAGO_ACCESS_TOKEN, 
        sevenDaysAgo.toISOString().split('T')[0]
      );

      console.log(`💳 [${requestId}] Encontrados ${mpPayments.length} pagamentos no MP`);

      for (const mpPayment of mpPayments) {
        totalChecked++;
        
        if (mpPayment.status === 'approved' && mpPayment.external_reference?.startsWith('finapp_')) {
          // Verificar se existe no nosso banco
          const { data: localPayment, error } = await supabase
            .from('payment_history')
            .select('*')
            .eq('payment_id', mpPayment.id.toString())
            .single();

          if (error || !localPayment) {
            // Pagamento órfão encontrado - tentar extrair user_id da external_reference
            const userId = mpPayment.external_reference.replace('finapp_', '');
            
            discrepanciesFound++;
            
            const orphanDiscrepancy: PaymentDiscrepancy = {
              type: 'missing_history',
              payment_id: mpPayment.id.toString(),
              user_id: userId,
              details: {
                amount: mpPayment.transaction_amount,
                date_approved: mpPayment.date_approved,
                external_reference: mpPayment.external_reference,
                source: 'mercadopago_orphan'
              },
              severity: 'high'
            };

            await createAlert(supabase, orphanDiscrepancy, requestId);
            alertsCreated++;
            
            console.log(`🚨 [${requestId}] Pagamento órfão detectado: ${mpPayment.id} para usuário ${userId}`);
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ [${requestId}] Erro ao verificar MP (continuando): ${formatError(error)}`);
    }

    // 4. Verificar assinaturas que devem ter expirado
    console.log(`📅 [${requestId}] Verificando assinaturas expiradas...`);
    const now = new Date();
    const { data: shouldBeExpired, error: expiredError } = await supabase
      .from('profiles')
      .select('id, subscription_expires_at')
      .eq('subscription_status', 'active')
      .lt('subscription_expires_at', now.toISOString());

    if (!expiredError && shouldBeExpired && shouldBeExpired.length > 0) {
      totalChecked += shouldBeExpired.length;
      discrepanciesFound += shouldBeExpired.length;

      // Atualizar status das assinaturas expiradas
      const expiredIds = shouldBeExpired.map((sub: any) => sub.id);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ subscription_status: 'expired' })
        .in('id', expiredIds);

      if (!updateError) {
        resolvedDiscrepancies += shouldBeExpired.length;
        console.log(`✅ [${requestId}] ${shouldBeExpired.length} assinaturas expiradas atualizadas`);
      }
    }

    const executionTime = Date.now() - startTime;
    
    // Log final
    const result: ReconciliationResult = {
      total_checked: totalChecked,
      discrepancies_found: discrepanciesFound,
      resolved_discrepancies: resolvedDiscrepancies,
      alerts_created: alertsCreated,
      execution_time_ms: executionTime
    };

    console.log(`🎉 [${requestId}] Reconciliação concluída:`, result);
    
    await supabase.from('admin_logs').insert({
      action: 'reconciliation_completed',
      details: {
        request_id: requestId,
        result,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        result,
        message: `Reconciliação concluída. ${discrepanciesFound} discrepâncias encontradas, ${resolvedDiscrepancies} resolvidas automaticamente, ${alertsCreated} alertas criados.`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

    } catch (error) {
      console.error(`❌ [${requestId}] Erro na reconciliação:`, formatError(error));

      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : String(error),
          request_id: requestId
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
});

// Utility to format unknown errors
function formatError(e: unknown) {
  if (e instanceof Error) return e.message;
  try { return JSON.stringify(e); } catch { return String(e); }
}