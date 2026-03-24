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
    const { email, name } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userName = name || 'Usuário';
    const appUrl = req.headers.get('origin') || 'https://bolsofurado.readdy.co';

    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Bolso Furado</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background-color:#0E0B16;">
  <table role="presentation" style="width:100%;background-color:#0E0B16;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width:600px;width:100%;background-color:#16122A;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#7C3AED 0%,#EC4899 100%);padding:48px 40px;text-align:center;">
              <table role="presentation" style="margin:0 auto 20px;">
                <tr>
                  <td style="background:rgba(255,255,255,0.2);width:80px;height:80px;border-radius:20px;text-align:center;vertical-align:middle;backdrop-filter:blur(10px);">
                    <span style="font-size:40px;line-height:80px;display:block;">💰</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:700;letter-spacing:-0.5px;">Bolso Furado</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:16px;font-weight:500;">Gestão Financeira Pessoal</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:48px 40px;">
              <h2 style="margin:0 0 16px;color:#F9FAFB;font-size:28px;font-weight:700;text-align:center;">
                🎉 Parabéns, ${userName}!
              </h2>
              <p style="margin:0 0 24px;color:#9CA3AF;font-size:16px;line-height:1.6;text-align:center;">
                Sua conta foi criada com sucesso! Seja bem-vindo ao <strong style="color:#7C3AED;">Bolso Furado</strong>, sua plataforma completa de gestão financeira pessoal.
              </p>

              <!-- Destaque Trial -->
              <div style="background:linear-gradient(135deg,#7C3AED 0%,#EC4899 100%);border-radius:12px;padding:32px;margin:0 0 32px;text-align:center;box-shadow:0 8px 24px rgba(124,58,237,0.3);">
                <p style="margin:0 0 8px;color:rgba(255,255,255,0.9);font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;">Período Trial</p>
                <h3 style="margin:0 0 8px;color:#ffffff;font-size:48px;font-weight:800;line-height:1;">30 Dias</h3>
                <p style="margin:0;color:rgba(255,255,255,0.95);font-size:16px;font-weight:500;">Acesso completo a todos os recursos premium!</p>
              </div>

              <!-- Recursos -->
              <p style="margin:0 0 20px;color:#F9FAFB;font-size:18px;font-weight:600;text-align:center;">O que você tem acesso:</p>
              <table role="presentation" style="width:100%;margin:0 0 32px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <table role="presentation"><tr>
                      <td style="padding-right:16px;vertical-align:middle;width:40px;">
                        <div style="background:rgba(124,58,237,0.2);width:40px;height:40px;border-radius:10px;text-align:center;line-height:40px;font-size:20px;">
                          💰
                        </div>
                      </td>
                      <td style="vertical-align:middle;">
                        <p style="margin:0;color:#F9FAFB;font-size:15px;font-weight:500;">Controle completo de receitas e despesas</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <table role="presentation"><tr>
                      <td style="padding-right:16px;vertical-align:middle;width:40px;">
                        <div style="background:rgba(124,58,237,0.2);width:40px;height:40px;border-radius:10px;text-align:center;line-height:40px;font-size:20px;">
                          📊
                        </div>
                      </td>
                      <td style="vertical-align:middle;">
                        <p style="margin:0;color:#F9FAFB;font-size:15px;font-weight:500;">Gestão de investimentos e patrimônio</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <table role="presentation"><tr>
                      <td style="padding-right:16px;vertical-align:middle;width:40px;">
                        <div style="background:rgba(124,58,237,0.2);width:40px;height:40px;border-radius:10px;text-align:center;line-height:40px;font-size:20px;">
                          📈
                        </div>
                      </td>
                      <td style="vertical-align:middle;">
                        <p style="margin:0;color:#F9FAFB;font-size:15px;font-weight:500;">Relatórios detalhados e análises</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <table role="presentation"><tr>
                      <td style="padding-right:16px;vertical-align:middle;width:40px;">
                        <div style="background:rgba(124,58,237,0.2);width:40px;height:40px;border-radius:10px;text-align:center;line-height:40px;font-size:20px;">
                          🎯
                        </div>
                      </td>
                      <td style="vertical-align:middle;">
                        <p style="margin:0;color:#F9FAFB;font-size:15px;font-weight:500;">Planejamento financeiro inteligente</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <table role="presentation"><tr>
                      <td style="padding-right:16px;vertical-align:middle;width:40px;">
                        <div style="background:rgba(124,58,237,0.2);width:40px;height:40px;border-radius:10px;text-align:center;line-height:40px;font-size:20px;">
                          🧮
                        </div>
                      </td>
                      <td style="vertical-align:middle;">
                        <p style="margin:0;color:#F9FAFB;font-size:15px;font-weight:500;">Calculadoras financeiras avançadas</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
              </table>

              <!-- Botão CTA -->
              <table role="presentation" style="width:100%;margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#7C3AED 0%,#EC4899 100%);color:#ffffff;text-decoration:none;padding:18px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 8px 24px rgba(124,58,237,0.4);transition:all 0.3s;">
                      🚀 Acessar o Bolso Furado
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#9CA3AF;font-size:14px;text-align:center;line-height:1.6;">
                Comece agora mesmo a organizar suas finanças e alcançar seus objetivos financeiros!
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#0E0B16;padding:32px 40px;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0 0 12px;color:#9CA3AF;font-size:13px;text-align:center;line-height:1.6;">
                Você está recebendo este e-mail porque criou uma conta no Bolso Furado.
              </p>
              <p style="margin:0 0 16px;color:#6B7280;font-size:12px;text-align:center;">
                © ${new Date().getFullYear()} Bolso Furado. Todos os direitos reservados.
              </p>
              <table role="presentation" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="${appUrl}" style="color:#7C3AED;text-decoration:none;font-size:12px;">Acessar App</a>
                  </td>
                  <td style="color:#6B7280;font-size:12px;">•</td>
                  <td style="padding:0 8px;">
                    <a href="${appUrl}/assinatura" style="color:#7C3AED;text-decoration:none;font-size:12px;">Planos</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY não configurada — pulando envio de email');
      // Não bloquear o fluxo de cadastro apenas por falta de chave de email
      return new Response(
        JSON.stringify({ success: false, message: 'Configuração de email não disponível, email não enviado', email, userName }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enviar email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Bolso Furado <noreply@bolsofurado.com>',
        to: [email],
        subject: '🎉 Bem-vindo ao Bolso Furado - Sua conta foi criada!',
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Erro ao enviar email via Resend:', errorData);
      // Não bloquear o cadastro se o email falhar
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Email não pôde ser enviado, mas o cadastro foi concluído',
          email, 
          userName 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailResult = await emailResponse.json();
    console.log('E-mail de boas-vindas enviado com sucesso:', emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'E-mail de boas-vindas enviado com sucesso', 
        email, 
        userName,
        emailId: emailResult.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função send-welcome-email:', error);
    // Não bloquear o cadastro se houver erro
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
        message: 'Cadastro concluído, mas email não foi enviado'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});