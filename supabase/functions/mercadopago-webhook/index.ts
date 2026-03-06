import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== WEBHOOK MERCADO PAGO INICIADO ===');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar assinatura do webhook
    const signature = req.headers.get('x-signature');
    const requestId = req.headers.get('x-request-id');
    
    if (!signature) {
      console.log('❌ Assinatura ausente');
      return new Response('Assinatura ausente', { status: 401 });
    }

    const body = await req.text();
    console.log('📦 Body recebido:', body);

    // Validar assinatura
    const webhookSecret = Deno.env.get('MP_WEBHOOK_SECRET');
    if (webhookSecret) {
      const expectedSignature = await createHmac('sha256', webhookSecret)
        .update(requestId + body)
        .digest('hex');
      
      if (`sha256=${expectedSignature}` !== signature) {
        console.log('❌ Assinatura inválida');
        return new Response('Assinatura inválida', { status: 401 });
      }
    }

    const notification = JSON.parse(body);
    console.log('🔔 Notificação:', JSON.stringify(notification, null, 2));

    // Processar apenas notificações de pagamento
    if (notification.type === 'payment') {
      const paymentId = notification.data?.id;
      
      if (!paymentId) {
        console.log('❌ ID do pagamento ausente');
        return new Response('ID do pagamento ausente', { status: 400 });
      }

      console.log(`💳 Processando pagamento ID: ${paymentId}`);

      // Buscar informações do pagamento no MP
      const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${mpAccessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!paymentResponse.ok) {
        console.log('❌ Erro ao buscar pagamento no MP:', paymentResponse.status);
        return new Response('Erro ao buscar pagamento', { status: 500 });
      }

      const paymentData = await paymentResponse.json();
      console.log('💰 Dados do pagamento:', JSON.stringify(paymentData, null, 2));

      // Buscar registro na tabela payment_history
      const { data: existingPayment, error: searchError } = await supabaseClient
        .from('payment_history')
        .select('*')
        .eq('mp_payment_id', paymentId)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar pagamento:', searchError);
        return new Response('Erro interno', { status: 500 });
      }

      if (!existingPayment) {
        console.log('⚠️ Pagamento não encontrado no sistema');
        return new Response('Pagamento não encontrado', { status: 404 });
      }

      console.log('📋 Pagamento encontrado:', existingPayment);

      // Atualizar status do pagamento
      const newStatus = paymentData.status;
      console.log(`🔄 Atualizando status: ${existingPayment.status} → ${newStatus}`);

      const { error: updateError } = await supabaseClient
        .from('payment_history')
        .update({
          status: newStatus,
          mp_status_detail: paymentData.status_detail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPayment.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar pagamento:', updateError);
        return new Response('Erro ao atualizar', { status: 500 });
      }

      // Se pagamento foi aprovado, ativar assinatura
      if (newStatus === 'approved' && existingPayment.status !== 'approved') {
        console.log('✅ Pagamento aprovado! Ativando assinatura...');

        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        const { error: profileError } = await supabaseClient
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_expires_at: expirationDate.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPayment.user_id);

        if (profileError) {
          console.error('❌ Erro ao ativar assinatura:', profileError);
        } else {
          console.log('🎉 Assinatura ativada com sucesso!');

          // 🔔 ENVIAR NOTIFICAÇÃO PUSH
          try {
            console.log('📱 Enviando notificação push...');
            
            const notificationResponse = await fetch(
              `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_id: existingPayment.user_id,
                  title: '🎉 Pagamento Aprovado!',
                  body: 'Sua assinatura PRO foi ativada com sucesso. Aproveite todos os recursos!',
                  icon: '/favicon.ico',
                  url: '/',
                  type: 'payment',
                  requireInteraction: true
                })
              }
            );

            if (notificationResponse.ok) {
              console.log('✅ Notificação push enviada com sucesso');
            } else {
              console.log('⚠️ Erro ao enviar notificação push:', await notificationResponse.text());
            }
          } catch (notificationError) {
            console.error('❌ Erro na notificação push:', notificationError);
          }

          // Buscar dados do usuário para notificações
          const { data: userProfile } = await supabaseClient
            .from('profiles')
            .select('email, full_name, phone')
            .eq('id', existingPayment.user_id)
            .single();

          // Enviar email de confirmação (não bloquear)
          if (userProfile?.email) {
            try {
              console.log('📧 Enviando email de confirmação...');
              
              fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-payment-confirmation-email`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: userProfile.email,
                  name: userProfile.full_name,
                  amount: existingPayment.amount,
                  payment_id: paymentId,
                  expires_at: expirationDate.toISOString()
                })
              }).catch(err => console.log('⚠️ Erro no email:', err));

            } catch (emailError) {
              console.log('⚠️ Erro ao processar email:', emailError);
            }
          }

          // Enviar WhatsApp (não bloquear)
          if (userProfile?.phone) {
            try {
              console.log('📱 Enviando WhatsApp...');
              
              fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-payment-whatsapp`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  phone: userProfile.phone,
                  name: userProfile.full_name,
                  amount: existingPayment.amount,
                  payment_id: paymentId,
                  expires_at: expirationDate.toISOString()
                })
              }).catch(err => console.log('⚠️ Erro no WhatsApp:', err));

            } catch (whatsappError) {
              console.log('⚠️ Erro ao processar WhatsApp:', whatsappError);
            }
          }
        }
      }

      // 📱 ENVIAR NOTIFICAÇÕES PARA OUTROS STATUS
      if (existingPayment.status !== newStatus) {
        try {
          let notificationTitle = '';
          let notificationBody = '';
          
          switch (newStatus) {
            case 'pending':
              notificationTitle = '⏳ Pagamento Pendente';
              notificationBody = 'Seu pagamento está sendo processado. Aguarde a confirmação.';
              break;
            case 'rejected':
              notificationTitle = '❌ Pagamento Recusado';
              notificationBody = 'Seu pagamento foi recusado. Verifique os dados e tente novamente.';
              break;
            case 'cancelled':
              notificationTitle = '🚫 Pagamento Cancelado';
              notificationBody = 'Seu pagamento foi cancelado.';
              break;
            case 'refunded':
              notificationTitle = '💸 Pagamento Reembolsado';
              notificationBody = 'Seu pagamento foi reembolsado com sucesso.';
              break;
          }
          
          if (notificationTitle && newStatus !== 'approved') {
            await fetch(
              `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_id: existingPayment.user_id,
                  title: notificationTitle,
                  body: notificationBody,
                  icon: '/favicon.ico',
                  url: '/assinatura',
                  type: 'payment'
                })
              }
            ).catch(err => console.log('⚠️ Erro na notificação:', err));
          }
        } catch (notificationError) {
          console.error('❌ Erro ao enviar notificação de status:', notificationError);
        }
      }

      console.log('✅ Webhook processado com sucesso');
    }

    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('💥 Erro no webhook:', error);
    return new Response('Erro interno', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});