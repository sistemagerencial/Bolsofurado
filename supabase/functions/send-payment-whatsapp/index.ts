import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentWhatsAppData {
  user_id: string;
  phone: string;
  name: string;
  plan_type: 'monthly' | 'yearly';
  amount: number;
  payment_id: string;
  expires_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, phone, name, plan_type, amount, payment_id, expires_at }: PaymentWhatsAppData = await req.json();

    if (!phone || !user_id || !plan_type) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios não fornecidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar configurações da API de WhatsApp nos secrets
    const whatsappApiUrl = Deno.env.get('WHATSAPP_API_URL');
    const whatsappApiKey = Deno.env.get('WHATSAPP_API_KEY');
    const whatsappInstance = Deno.env.get('WHATSAPP_INSTANCE');

    if (!whatsappApiUrl || !whatsappApiKey) {
      console.warn('⚠️ WhatsApp API não configurada. Notificação não enviada.');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'WhatsApp API não configurada. Email enviado.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Formatar número de telefone: remover máscara e adicionar DDI +55
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const userName = name || 'Usuário';
    const planName = plan_type === 'yearly' ? 'Anual' : 'Mensal';
    
    // Formatação de valores
    const formattedAmount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100); // Mercado Pago envia em centavos
    
    const expirationDate = new Date(expires_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    // Montar mensagem de confirmação de pagamento personalizada
    const message = `🎉 *Pagamento Confirmado!*\n\n` +
      `Olá, ${userName}! Seu pagamento foi processado com sucesso!\n\n` +
      `📋 *Detalhes da Assinatura:*\n` +
      `• Plano: ${planName}\n` +
      `• Valor: ${formattedAmount}\n` +
      `• Válido até: ${expirationDate}\n` +
      `• ID Pagamento: #${payment_id}\n\n` +
      `🚀 *Seus benefícios PRO estão ativos:*\n` +
      `✅ Controle ilimitado de transações\n` +
      `✅ Relatórios avançados e análises\n` +
      `✅ Gestão completa de investimentos\n` +
      `✅ Todas as calculadoras premium\n` +
      `✅ Backup automático na nuvem\n\n` +
      `Agora você pode acessar todos os recursos PRO do Bolso Furado! 💰\n\n` +
      `Obrigado por escolher nossa plataforma! 😊`;

    // Enviar mensagem via API de WhatsApp
    const whatsappPayload = {
      number: formattedPhone,
      text: message,
      ...(whatsappInstance && { instance: whatsappInstance })
    };

    const whatsappResponse = await fetch(`${whatsappApiUrl}/message/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': whatsappApiKey,
      },
      body: JSON.stringify(whatsappPayload),
    });

    if (!whatsappResponse.ok) {
      const errorText = await whatsappResponse.text();
      console.error('❌ Erro ao enviar WhatsApp:', errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao enviar WhatsApp de confirmação',
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const whatsappResult = await whatsappResponse.json();
    console.log('✅ WhatsApp de confirmação enviado:', whatsappResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'WhatsApp de confirmação enviado com sucesso!',
        data: whatsappResult,
        phone: formattedPhone,
        payment_id,
        plan_type
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na função send-payment-whatsapp:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});