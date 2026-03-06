import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mercadoPagoToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Recebe a notificação do Mercado Pago
    const body = await req.json();
    console.log('Webhook recebido:', JSON.stringify(body, null, 2));

    const { type, data } = body;

    // Processa notificações de assinatura
    if (type === 'subscription_preapproval' || 
        type === 'subscription_authorized_payment' ||
        type === 'subscription_preapproval_plan') {
      
      const resourceId = data?.id;
      if (!resourceId) {
        console.error('ID do recurso não encontrado');
        return new Response(JSON.stringify({ error: 'ID não encontrado' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Busca detalhes da assinatura no Mercado Pago
      const preapprovalResponse = await fetch(
        `https://api.mercadopago.com/preapproval/${resourceId}`,
        {
          headers: {
            'Authorization': `Bearer ${mercadoPagoToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!preapprovalResponse.ok) {
        console.error('Erro ao buscar assinatura:', await preapprovalResponse.text());
        return new Response(JSON.stringify({ error: 'Erro ao buscar assinatura' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const preapproval = await preapprovalResponse.json();
      console.log('Detalhes da assinatura:', JSON.stringify(preapproval, null, 2));

      const { status, payer_email, auto_recurring, next_payment_date, id: preapprovalId } = preapproval;

      // Busca o usuário pelo preapproval_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('preapproval_id', preapprovalId)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('Usuário não encontrado:', profileError);
        return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Atualiza o status da assinatura
      let subscriptionStatus = 'inactive';
      let subscriptionExpiresAt = null;

      if (status === 'authorized') {
        subscriptionStatus = 'active';
        // Define a data de expiração baseada na próxima cobrança
        if (next_payment_date) {
          subscriptionExpiresAt = next_payment_date;
        } else {
          // Se não houver próxima data, calcula baseado no tipo
          const frequency = auto_recurring?.frequency;
          const frequencyType = auto_recurring?.frequency_type;
          
          if (frequencyType === 'months' && frequency === 1) {
            // Mensal
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            subscriptionExpiresAt = nextMonth.toISOString();
          } else if (frequencyType === 'months' && frequency === 12) {
            // Anual
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            subscriptionExpiresAt = nextYear.toISOString();
          }
        }
      } else if (status === 'paused') {
        subscriptionStatus = 'paused';
      } else if (status === 'cancelled') {
        subscriptionStatus = 'cancelled';
      }

      // Atualiza o perfil do usuário
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: subscriptionStatus,
          subscription_expires_at: subscriptionExpiresAt,
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError);
        return new Response(JSON.stringify({ error: 'Erro ao atualizar perfil' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Assinatura atualizada: ${subscriptionStatus}, expira em: ${subscriptionExpiresAt}`);

      // Se for uma notificação de pagamento autorizado, registra no histórico
      if (type === 'subscription_authorized_payment') {
        // Busca o último pagamento da assinatura
        const paymentsResponse = await fetch(
          `https://api.mercadopago.com/preapproval/${preapprovalId}/authorized_payments`,
          {
            headers: {
              'Authorization': `Bearer ${mercadoPagoToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (paymentsResponse.ok) {
          const payments = await paymentsResponse.json();
          console.log('Pagamentos da assinatura:', JSON.stringify(payments, null, 2));

          // Pega o último pagamento aprovado
          const lastPayment = payments.results?.[0];
          
          if (lastPayment && lastPayment.status === 'approved') {
            // Verifica se já existe esse pagamento no histórico
            const { data: existingPayment } = await supabase
              .from('payment_history')
              .select('id')
              .eq('payment_id', lastPayment.id.toString())
              .maybeSingle();

            if (!existingPayment) {
              // Registra o pagamento recorrente no histórico
              const { error: paymentError } = await supabase
                .from('payment_history')
                .insert({
                  user_id: profile.id,
                  payment_id: lastPayment.id.toString(),
                  amount: lastPayment.transaction_amount,
                  currency: lastPayment.currency_id || 'BRL',
                  status: lastPayment.status,
                  payment_method: lastPayment.payment_method_id || 'credit_card',
                  is_recurring: true,
                  preapproval_id: preapprovalId,
                });

              if (paymentError) {
                console.error('Erro ao registrar pagamento:', paymentError);
              } else {
                console.log('Pagamento recorrente registrado com sucesso');
              }
            } else {
              console.log('Pagamento já registrado anteriormente');
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Tipo de notificação não suportado
    console.log('Tipo de notificação não processado:', type);
    return new Response(JSON.stringify({ message: 'Tipo não processado' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});