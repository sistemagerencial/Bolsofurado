import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, name, resetLink } = body;

    if (!email || !resetLink) {
      return new Response(
        JSON.stringify({ error: 'Email e resetLink são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userName = name || 'Usuário';

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Gerar link de recuperação (admin) para obter o link seguro
    const sendRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'recovery',
        email,
      }),
    });

    let actionLink = resetLink;
    try {
      const json = await sendRes.json();
      actionLink = json?.action_link || json?.actionLink || json?.link || json?.access_url || resetLink;
    } catch (e) {
      console.warn('Não foi possível ler resposta de generate_link, usando resetLink enviado pelo cliente', e);
    }

    // Montar HTML do e-mail usando o link gerado
    const emailHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinição de Senha - Bolso Furado</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #0E0B16 0%, #1a1625 100%); padding: 48px 40px; text-align: center;">
              <img src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/329df8a96fbfb4f61300025c05375e5e.png" alt="Bolso Furado" width="80" height="80" style="display: block; margin: 0 auto 20px; filter: brightness(0) invert(1); object-fit: contain;" />
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Bolso Furado</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.7); font-size: 14px;">Gestão Financeira Pessoal</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 48px 40px;">
              <div style="text-align: center; margin-bottom: 32px;"><div style="display: inline-block; background: linear-gradient(135deg, #7C3AED20, #EC489920); border: 2px solid #7C3AED40; width: 72px; height: 72px; border-radius: 50%; text-align: center; line-height: 72px;"><span style="font-size: 32px;">🔐</span></div></div>
              <h2 style="margin: 0 0 16px; color: #0E0B16; font-size: 26px; font-weight: 700; line-height: 1.3; text-align: center;">Redefinição de Senha</h2>
              <p style="margin: 0 0 24px; color: #4B5563; font-size: 16px; line-height: 1.6; text-align: center;">Olá, <strong>${userName}</strong>! Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Bolso Furado</strong>.</p>
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 16px 20px; margin: 0 0 32px;"><p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.5;">⚠️ <strong>Atenção:</strong> Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanecerá a mesma.</p></div>
              <table role="presentation" style="width: 100%; margin: 0 0 32px;"><tr><td align="center"><a href="${actionLink}" style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%); color: #ffffff; text-decoration: none; padding: 18px 56px; border-radius: 12px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(124,58,237,0.4);">🔑 Redefinir Minha Senha</a></td></tr></table>
              <div style="background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%); border-radius: 12px; padding: 24px 32px; margin: 0 0 32px; text-align: center;"><p style="margin: 0 0 4px; color: rgba(255,255,255,0.85); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Validade do link</p><h3 style="margin: 0 0 4px; color: #ffffff; font-size: 28px; font-weight: 800;">1 hora</h3><p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">O link expira em 1 hora após o envio</p></div>
              <p style="margin: 0 0 16px; color: #4B5563; font-size: 15px; font-weight: 600;">Como redefinir sua senha:</p>
              <table role="presentation" style="width: 100%; margin: 0 0 32px;">
                ${[
                  'Clique no botão "Redefinir Minha Senha" acima',
                  'Você será redirecionado para uma página segura',
                  'Digite e confirme sua nova senha',
                  'Faça login com a nova senha',
                ].map((item, i) => `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                    <table role="presentation"><tr>
                      <td style="padding-right: 14px; vertical-align: middle;">
                        <div style="background: linear-gradient(135deg, #7C3AED, #EC4899); width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; flex-shrink: 0;"><span style="color: #ffffff; font-size: 13px; font-weight: 700;">${i + 1}</span></div>
                      </td>
                      <td style="vertical-align: middle;"><p style="margin: 0; color: #1F2937; font-size: 14px;">${item}</p></td>
                    </tr></table>
                  </td>
                </tr>`).join('')}
              </table>
              <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px 20px; margin: 0 0 8px;"><p style="margin: 0 0 8px; color: #6B7280; font-size: 13px;">Se o botão não funcionar, copie e cole este link no seu navegador:</p><p style="margin: 0; word-break: break-all; color: #7C3AED; font-size: 12px; font-family: monospace;">${actionLink}</p></div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F9FAFB; padding: 32px 40px; border-top: 1px solid #E5E7EB;"><p style="margin: 0 0 8px; color: #6B7280; font-size: 13px; text-align: center;">Você está recebendo este e-mail porque solicitou a redefinição de senha no Bolso Furado.</p><p style="margin: 0; color: #9CA3AF; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Bolso Furado. Todos os direitos reservados.</p></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Se houver RESEND_API_KEY, enviar via Resend (mais confiável/rápido)
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
    if (resendApiKey) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Bolso Furado <no-reply@bolsofurado.com>',
            to: email,
            subject: 'Redefinição de senha - Bolso Furado',
            html: emailHtml,
          }),
        });

        if (!resendRes.ok) {
          const txt = await resendRes.text();
          console.error('Falha ao enviar e-mail via Resend:', resendRes.status, txt);
        } else {
          console.log('E-mail enviado via Resend para:', email);
        }
      } catch (e) {
        console.error('Erro ao chamar Resend API:', e);
      }
    } else {
      // Sem Resend: apenas registra que o link foi gerado (o envio pode estar sendo feito pelo Supabase Auth)
      console.log('RESEND_API_KEY não configurado — apenas gerou link de recuperação para:', email);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'E-mail de redefinição processado', email, userName, actionLink }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função send-reset-password-email:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
