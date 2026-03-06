import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  phone: string;
  name: string;
  email: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, name, email }: RequestBody = await req.json();

    if (!phone || !name) {
      return new Response(
        JSON.stringify({ error: 'Telefone e nome são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Formatar número de telefone: remover máscara e adicionar DDI +55
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    // Buscar configurações da API de WhatsApp nos secrets
    const whatsappApiUrl = Deno.env.get('WHATSAPP_API_URL');
    const whatsappApiKey = Deno.env.get('WHATSAPP_API_KEY');
    const whatsappInstance = Deno.env.get('WHATSAPP_INSTANCE');

    if (!whatsappApiUrl || !whatsappApiKey) {
      console.warn('⚠️ WhatsApp API não configurada. Notificação não enviada.');
      // Retornar sucesso mesmo sem configuração para não bloquear o cadastro
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Cadastro realizado. WhatsApp API não configurada.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Montar mensagem de boas-vindas personalizada
    const message = `🎉 *Bem-vindo(a) ao sistema, ${name}!*\n\n` +
      `Seu cadastro foi realizado com sucesso!\n\n` +
      `📧 E-mail: ${email}\n\n` +
      `Agora você pode acessar todas as funcionalidades da plataforma.\n\n` +
      `Se precisar de ajuda, estamos à disposição! 😊`;

    // Enviar mensagem via API de WhatsApp
    // Formato compatível com Evolution API, Z-API e similares
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
      
      // Retornar sucesso mesmo com falha para não bloquear o cadastro
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Cadastro realizado. Erro ao enviar WhatsApp.',
          warning: errorText
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const whatsappResult = await whatsappResponse.json();
    console.log('✅ WhatsApp enviado com sucesso:', whatsappResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notificação enviada com sucesso!',
        data: whatsappResult
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na função send-whatsapp-notification:', error);
    
    // Retornar sucesso mesmo com erro para não bloquear o cadastro
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cadastro realizado. Erro ao processar notificação.',
        error: error.message
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});