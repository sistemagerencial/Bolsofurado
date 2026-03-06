import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentConfirmationData {
  user_id: string;
  email: string;
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
    const { user_id, email, name, plan_type, amount, payment_id, expires_at }: PaymentConfirmationData = await req.json();

    if (!email || !user_id || !plan_type) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios não fornecidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userName = name || 'Usuário';
    const appUrl = req.headers.get('origin') || 'https://bolsofurado.readdy.co';
    
    // Formatação de valores
    const planName = plan_type === 'yearly' ? 'Anual' : 'Mensal';
    const formattedAmount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100); // Mercado Pago envia em centavos
    
    const expirationDate = new Date(expires_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagamento Confirmado - Bolso Furado</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background-color:#0E0B16;">
  <table role="presentation" style="width:100%;background-color:#0E0B16;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width:600px;width:100%;background-color:#16122A;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#10B981 0%,#059669 100%);padding:48px 40px;text-align:center;">
              <table role="presentation" style="margin:0 auto 20px;">
                <tr>
                  <td style="background:rgba(255,255,255,0.2);width:80px;height:80px;border-radius:20px;text-align:center;vertical-align:middle;backdrop-filter:blur(10px);">
                    <span style="font-size:40px;line-height:80px;display:block;">✅</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:700;letter-spacing:-0.5px;">Pagamento Confirmado!</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:16px;font-weight:500;">Sua assinatura está ativa</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:48px 40px;">
              <h2 style="margin:0 0 16px;color:#F9FAFB;font-size:28px;font-weight:700;text-align:center;">
                🎉 Obrigado, ${userName}!
              </h2>
              <p style="margin:0 0 32px;color:#9CA3AF;font-size:16px;line-height:1.6;text-align:center;">
                Seu pagamento foi processado com sucesso! Agora você tem acesso completo a todos os recursos <strong style="color:#10B981;">PRO</strong> do Bolso Furado.
              </p>

              <!-- Resumo do Pagamento -->
              <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:12px;padding:32px;margin:0 0 32px;">
                <h3 style="margin:0 0 20px;color:#10B981;font-size:20px;font-weight:600;text-align:center;">📋 Detalhes da Assinatura</h3>
                
                <table role="presentation" style="width:100%;">
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                      <table role="presentation" style="width:100%;">
                        <tr>
                          <td style="color:#9CA3AF;font-size:14px;font-weight:500;">Plano:</td>
                          <td style="text-align:right;color:#F9FAFB;font-size:14px;font-weight:600;">${planName}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                      <table role="presentation" style="width:100%;">
                        <tr>
                          <td style="color:#9CA3AF;font-size:14px;font-weight:500;">Valor:</td>
                          <td style="text-align:right;color:#10B981;font-size:16px;font-weight:700;">${formattedAmount}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                      <table role="presentation" style="width:100%;">
                        <tr>
                          <td style="color:#9CA3AF;font-size:14px;font-weight:500;">ID do Pagamento:</td>
                          <td style="text-align:right;color:#F9FAFB;font-size:12px;font-family:monospace;">#${payment_id}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;">
                      <table role="presentation" style="width:100%;">
                        <tr>
                          <td style="color:#9CA3AF;font-size:14px;font-weight:500;">Válido até:</td>
                          <td style="text-align:right;color:#F9FAFB;font-size:14px;font-weight:600;">${expirationDate}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Recursos PRO -->
              <p style="margin:0 0 20px;color:#F9FAFB;font-size:18px;font-weight:600;text-align:center;">🚀 Seus benefícios PRO:</p>
              <table role="presentation" style="width:100%;margin:0 0 32px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <table role="presentation"><tr>
                      <td style="padding-right:16px;vertical-align:middle;width:40px;">
                        <div style="background:rgba(16,185,129,0.2);width:40px;height:40px;border-radius:10px;text-align:center;line-height:40px;font-size:20px;">
                          💰
                        </div>
                      </td>
                      <td style="vertical-align:middle;">
                        <p style="margin:0;color:#F9FAFB;font-size:15px;font-weight:500;">Controle ilimitado de transações</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <table role="presentation"><tr>
                      <td style="padding-right:16px;vertical-align:middle;width:40px;">
                        <div style="background:rgba(16,185,129,0.2);width:40px;height:40px;border-radius:10px;text-align:center;line-height:40px;font-size:20px;">
                          📊
                        </div>
                      </td>
                      <td style="vertical-align:middle;">
                        <p style="margin:0;color:#F9FAFB;font-size:15px;font-weight:500;">Relatórios avançados e análises</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <table role="presentation"><tr>
                      <td style="padding-right:16px;vertical-align:middle;width:40px;">
                        <div style="background:rgba(16,185,129,0.2);width:40px;height:40px;border-radius:10px;text-align:center;line-height:40px;font-size:20px;">
                          📈
                        </div>
                      </td>
                      <td style="vertical-align:middle;">
                        <p style="margin:0;color:#F9FAFB;font-size:15px;font-weight:500;">Gestão completa de investimentos</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <table role="presentation"><tr>
                      <td style="padding-right:16px;vertical-align:middle;width:40px;">
                        <div style="background:rgba(16,185,129,0.2);width:40px;height:40px;border-radius:10px;text-align:center;line-height:40px;font-size:20px;">
                          🧮
                        </div>
                      </td>
                      <td style="vertical-align:middle;">
                        <p style="margin:0;color:#F9FAFB;font-size:15px;font-weight:500;">Todas as calculadoras premium</p>
                      </td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <table role="presentation"><tr>
                      <td style="padding-right:16px;vertical-align:middle;width:40px;">
                        <div style="background:rgba(16,185,129,0.2);width:40px;height:40px;border-radius:10px;text-align:center;line-height:40px;font-size:20px;">
                          ☁️
                        </div>
                      </td>
                      <td style="vertical-align:middle;">
                        <p style="margin:0;color:#F9FAFB;font-size:15px;font-weight:500;">Backup automático na nuvem</p>
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
                      style="display:inline-block;background:linear-gradient(135deg,#10B981 0%,#059669 100%);color:#ffffff;text-decoration:none;padding:18px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 8px 24px rgba(16,185,129,0.4);transition:all 0.3s;">
                      🚀 Acessar Minha Conta PRO
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:16px;margin:0 0 24px;">
                <p style="margin:0;color:#93C5FD;font-size:14px;text-align:center;line-height:1.6;">
                  💡 <strong>Dica:</strong> Você pode acessar suas faturas e gerenciar sua assinatura na seção "Minha Conta" do aplicativo.
                </p>
              </div>

              <p style="margin:0;color:#9CA3AF;font-size:14px;text-align:center;line-height:1.6;">
                Obrigado por escolher o Bolso Furado! Estamos aqui para ajudar você a alcançar seus objetivos financeiros.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#0E0B16;padding:32px 40px;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0 0 12px;color:#9CA3AF;font-size:13px;text-align:center;line-height:1.6;">
                Guarde este e-mail como comprovante do seu pagamento.
              </p>
              <p style="margin:0 0 16px;color:#6B7280;font-size:12px;text-align:center;">
                © ${new Date().getFullYear()} Bolso Furado. Todos os direitos reservados.
              </p>
              <table role="presentation" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="${appUrl}" style="color:#10B981;text-decoration:none;font-size:12px;">Acessar App</a>
                  </td>
                  <td style="color:#6B7280;font-size:12px;">•</td>
                  <td style="padding:0 8px;">
                    <a href="${appUrl}/perfil" style="color:#10B981;text-decoration:none;font-size:12px;">Minha Conta</a>
                  </td>
                  <td style="color:#6B7280;font-size:12px;">•</td>
                  <td style="padding:0 8px;">
                    <a href="${appUrl}/assinatura" style="color:#10B981;text-decoration:none;font-size:12px;">Assinatura</a>
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
      console.error('RESEND_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Configuração de email não disponível' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        subject: '✅ Pagamento Confirmado - Sua assinatura PRO está ativa!',
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Erro ao enviar email via Resend:', errorData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao enviar email de confirmação',
          details: errorData
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailResult = await emailResponse.json();
    console.log('✅ Email de confirmação de pagamento enviado:', emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de confirmação enviado com sucesso', 
        email, 
        userName,
        emailId: emailResult.id,
        payment_id,
        plan_type
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na função send-payment-confirmation-email:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});