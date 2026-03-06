import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Profile {
  id: string;
  email: string;
  full_name: string;
  subscription_status: string;
  subscription_expires_at: string | null;
  trial_end_date: string | null;
  plan_type: string;
  is_lifetime: boolean;
  is_admin_override: boolean;
  last_notification_sent: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar service role key para segurança
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!authHeader || !authHeader.includes(serviceRoleKey || '')) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado - apenas service role' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar todos os usuários ativos ou em trial que NÃO sejam vitalícios
    const { data: profiles, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .in('subscription_status', ['active', 'trial'])
      .eq('is_lifetime', false)
      .eq('is_admin_override', false);

    if (fetchError) {
      throw new Error(`Erro ao buscar perfis: ${fetchError.message}`);
    }

    const now = new Date();
    const results = {
      notified_7_days: 0,
      notified_3_days: 0,
      notified_1_day: 0,
      expired_blocked: 0,
      errors: [] as string[],
    };

    for (const profile of profiles || []) {
      try {
        // Determinar data de expiração
        let expiresAt: Date | null = null;
        if (profile.subscription_status === 'trial' && profile.trial_end_date) {
          expiresAt = new Date(profile.trial_end_date);
        } else if (profile.subscription_expires_at) {
          expiresAt = new Date(profile.subscription_expires_at);
        }

        if (!expiresAt) continue;

        // Calcular dias restantes
        const diffTime = expiresAt.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Verificar se já enviou notificação recentemente (últimas 12 horas)
        const lastNotification = profile.last_notification_sent 
          ? new Date(profile.last_notification_sent) 
          : null;
        const hoursSinceLastNotification = lastNotification
          ? (now.getTime() - lastNotification.getTime()) / (1000 * 60 * 60)
          : 999;

        // CASO 1: Plano expirado - bloquear usuário
        if (daysRemaining <= 0) {
          await supabaseAdmin
            .from('profiles')
            .update({ 
              subscription_status: 'expired',
              last_notification_sent: now.toISOString()
            })
            .eq('id', profile.id);

          await sendExpirationEmail(profile, supabaseAdmin);
          results.expired_blocked++;
          continue;
        }

        // CASO 2: Faltam 7 dias
        if (daysRemaining === 7 && hoursSinceLastNotification > 12) {
          await sendWarningEmail(profile, 7, supabaseAdmin);
          await supabaseAdmin
            .from('profiles')
            .update({ last_notification_sent: now.toISOString() })
            .eq('id', profile.id);
          results.notified_7_days++;
        }

        // CASO 3: Faltam 3 dias
        if (daysRemaining === 3 && hoursSinceLastNotification > 12) {
          await sendWarningEmail(profile, 3, supabaseAdmin);
          await supabaseAdmin
            .from('profiles')
            .update({ last_notification_sent: now.toISOString() })
            .eq('id', profile.id);
          results.notified_3_days++;
        }

        // CASO 4: Falta 1 dia
        if (daysRemaining === 1 && hoursSinceLastNotification > 12) {
          await sendWarningEmail(profile, 1, supabaseAdmin);
          await supabaseAdmin
            .from('profiles')
            .update({ last_notification_sent: now.toISOString() })
            .eq('id', profile.id);
          results.notified_1_day++;
        }

      } catch (error) {
        results.errors.push(`Erro ao processar ${profile.email}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Processamento concluído',
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Função para enviar e-mail de aviso (7, 3 ou 1 dia)
async function sendWarningEmail(profile: Profile, daysRemaining: number, supabase: any) {
  const baseUrl = Deno.env.get('SITE_URL') || 'https://seu-dominio.com';
  const planName = profile.plan_type === 'monthly' ? 'Mensal' : 'Anual';
  
  let urgencyLevel = 'atenção';
  let urgencyColor = '#F59E0B';
  
  if (daysRemaining === 1) {
    urgencyLevel = 'urgente';
    urgencyColor = '#EF4444';
  } else if (daysRemaining === 3) {
    urgencyLevel = 'importante';
    urgencyColor = '#F97316';
  }

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu plano está expirando</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0E0B16;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0E0B16; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1A1625; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
          
          <!-- Header com Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                💰 Controle Financeiro
              </h1>
            </td>
          </tr>

          <!-- Badge de Urgência -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center;">
              <div style="display: inline-block; background-color: ${urgencyColor}; color: #FFFFFF; padding: 8px 20px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                ⚠️ ${urgencyLevel.toUpperCase()}
              </div>
            </td>
          </tr>

          <!-- Conteúdo Principal -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #FFFFFF; font-size: 24px; font-weight: 600; text-align: center;">
                Olá, ${profile.full_name || 'Usuário'}!
              </h2>
              <p style="margin: 0 0 20px; color: #9CA3AF; font-size: 16px; line-height: 1.6; text-align: center;">
                Seu <strong style="color: #7C3AED;">Plano Pro ${planName}</strong> está próximo de vencer.
              </p>
              
              <!-- Contador de Dias -->
              <div style="background: linear-gradient(135deg, #7C3AED15 0%, #5B21B615 100%); border: 2px solid ${urgencyColor}; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
                <div style="font-size: 48px; font-weight: 700; color: ${urgencyColor}; margin-bottom: 10px;">
                  ${daysRemaining}
                </div>
                <div style="font-size: 18px; color: #D1D5DB; font-weight: 500;">
                  ${daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
                </div>
              </div>

              <p style="margin: 0 0 30px; color: #9CA3AF; font-size: 15px; line-height: 1.6; text-align: center;">
                ${daysRemaining === 1 
                  ? '🚨 <strong style="color: #EF4444;">Última chance!</strong> Renove hoje para não perder o acesso.'
                  : daysRemaining === 3
                  ? '⏰ Renove agora e mantenha todos os seus dados e recursos ativos.'
                  : '📅 Não perca o acesso! Renove seu plano e continue aproveitando todos os recursos.'}
              </p>

              <!-- Botão CTA -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/checkout?reason=expiring" style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);">
                  🔄 Renovar Agora
                </a>
              </div>

              <!-- Benefícios -->
              <div style="background-color: #0E0B16; border-radius: 8px; padding: 20px; margin-top: 30px;">
                <p style="margin: 0 0 15px; color: #D1D5DB; font-size: 14px; font-weight: 600;">
                  ✨ O que você mantém ao renovar:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #9CA3AF; font-size: 14px; line-height: 1.8;">
                  <li>Controle completo de receitas e despesas</li>
                  <li>Gestão de investimentos e patrimônio</li>
                  <li>Relatórios e análises detalhadas</li>
                  <li>Planejamento financeiro avançado</li>
                  <li>Todos os seus dados salvos</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0E0B16; padding: 30px 40px; text-align: center; border-top: 1px solid #1A1625;">
              <p style="margin: 0 0 10px; color: #6B7280; font-size: 13px;">
                Precisa de ajuda? <a href="mailto:suporte@seudominio.com" style="color: #7C3AED; text-decoration: none;">Entre em contato</a>
              </p>
              <p style="margin: 0; color: #4B5563; font-size: 12px;">
                © 2025 Controle Financeiro. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await supabase.auth.admin.sendEmail({
    email: profile.email,
    subject: `⚠️ Seu plano expira em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}!`,
    html: emailHtml,
  });
}

// Função para enviar e-mail de bloqueio (plano expirado)
async function sendExpirationEmail(profile: Profile, supabase: any) {
  const baseUrl = Deno.env.get('SITE_URL') || 'https://seu-dominio.com';
  const planName = profile.plan_type === 'monthly' ? 'Mensal' : 'Anual';

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu plano expirou</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0E0B16;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0E0B16; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1A1625; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                💰 Controle Financeiro
              </h1>
            </td>
          </tr>

          <!-- Badge de Status -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center;">
              <div style="display: inline-block; background-color: #EF4444; color: #FFFFFF; padding: 8px 20px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                🔒 PLANO EXPIRADO
              </div>
            </td>
          </tr>

          <!-- Conteúdo Principal -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #FFFFFF; font-size: 24px; font-weight: 600; text-align: center;">
                Olá, ${profile.full_name || 'Usuário'}
              </h2>
              <p style="margin: 0 0 20px; color: #9CA3AF; font-size: 16px; line-height: 1.6; text-align: center;">
                Seu <strong style="color: #EF4444;">Plano Pro ${planName}</strong> expirou e o acesso foi bloqueado.
              </p>
              
              <!-- Ícone de Bloqueio -->
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #EF444415 0%, #DC262615 100%); border: 3px solid #EF4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px;">
                  🔒
                </div>
              </div>

              <p style="margin: 0 0 30px; color: #9CA3AF; font-size: 15px; line-height: 1.6; text-align: center;">
                <strong style="color: #FFFFFF;">Não se preocupe!</strong> Todos os seus dados estão seguros. Renove agora para recuperar o acesso completo.
              </p>

              <!-- Botão CTA Principal -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/checkout?reason=expired" style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); color: #FFFFFF; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);">
                  🔓 Renovar e Desbloquear
                </a>
              </div>

              <!-- Informações Importantes -->
              <div style="background-color: #0E0B16; border-left: 4px solid #7C3AED; border-radius: 8px; padding: 20px; margin-top: 30px;">
                <p style="margin: 0 0 15px; color: #D1D5DB; font-size: 14px; font-weight: 600;">
                  📌 Importante saber:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #9CA3AF; font-size: 14px; line-height: 1.8;">
                  <li><strong style="color: #10B981;">Seus dados estão seguros</strong> e serão restaurados ao renovar</li>
                  <li>Acesso bloqueado até a renovação do plano</li>
                  <li>Renove agora e volte a usar imediatamente</li>
                  <li>Escolha entre plano mensal ou anual</li>
                </ul>
              </div>

              <!-- Planos Disponíveis -->
              <div style="margin-top: 30px;">
                <p style="margin: 0 0 15px; color: #D1D5DB; font-size: 14px; font-weight: 600; text-align: center;">
                  💎 Escolha seu plano:
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="48%" style="background: linear-gradient(135deg, #7C3AED15 0%, #5B21B615 100%); border: 1px solid #7C3AED; border-radius: 8px; padding: 15px; text-align: center;">
                      <div style="color: #7C3AED; font-size: 12px; font-weight: 600; margin-bottom: 5px;">MENSAL</div>
                      <div style="color: #FFFFFF; font-size: 24px; font-weight: 700;">R$ 19,90</div>
                      <div style="color: #9CA3AF; font-size: 12px;">por mês</div>
                    </td>
                    <td width="4%"></td>
                    <td width="48%" style="background: linear-gradient(135deg, #10B98115 0%, #059F6615 100%); border: 2px solid #10B981; border-radius: 8px; padding: 15px; text-align: center;">
                      <div style="color: #10B981; font-size: 12px; font-weight: 600; margin-bottom: 5px;">ANUAL 🔥</div>
                      <div style="color: #FFFFFF; font-size: 24px; font-weight: 700;">R$ 199,00</div>
                      <div style="color: #10B981; font-size: 12px; font-weight: 600;">Economize R$ 39,80</div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0E0B16; padding: 30px 40px; text-align: center; border-top: 1px solid #1A1625;">
              <p style="margin: 0 0 10px; color: #6B7280; font-size: 13px;">
                Dúvidas? <a href="mailto:suporte@seudominio.com" style="color: #7C3AED; text-decoration: none;">Fale conosco</a>
              </p>
              <p style="margin: 0; color: #4B5563; font-size: 12px;">
                © 2025 Controle Financeiro. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await supabase.auth.admin.sendEmail({
    email: profile.email,
    subject: '🔒 Seu plano expirou - Renove para recuperar o acesso',
    html: emailHtml,
  });
}
