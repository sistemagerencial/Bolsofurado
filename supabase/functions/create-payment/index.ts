import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Token de autorização não fornecido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { plan, payment_method, installments, payer } = body;

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return new Response(JSON.stringify({ error: 'Plano inválido. Use "monthly" ou "yearly".' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      console.error('MERCADOPAGO_ACCESS_TOKEN não configurado');
      return new Response(JSON.stringify({
        error: 'Chave do Mercado Pago não configurada. Configure a secret MERCADOPAGO_ACCESS_TOKEN no Supabase.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isMonthly = plan === 'monthly';
    const title = isMonthly ? 'Plano Pro Mensal - Bolso Furado' : 'Plano Pro Anual - Bolso Furado';
    const price = isMonthly ? 19.9 : 199.0;
    const description = isMonthly
      ? 'Assinatura mensal do Plano Pro - Acesso completo a todos os recursos'
      : 'Assinatura anual do Plano Pro - Acesso completo (economize R$ 39,80)';

    // ============================================
    // FLUXO 1: PAGAMENTO PIX
    // ============================================
    if (payment_method === 'pix') {
      console.log('Criando pagamento PIX para usuário:', user.id, 'plano:', plan);

      // Monta o objeto payer com CPF obrigatório para PIX
      const payerObj: Record<string, unknown> = {
        email: payer?.email || user.email,
        first_name: payer?.first_name || user.user_metadata?.name?.split(' ')[0] || 'Cliente',
        last_name: payer?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
      };

      // Adiciona identificação (CPF) se fornecida — obrigatório para PIX no Brasil
      if (payer?.identification?.number) {
        payerObj.identification = {
          type: payer.identification.type || 'CPF',
          number: String(payer.identification.number).replace(/\D/g, ''),
        };
      }

      const pixPayment = {
        transaction_amount: price,
        description: description,
        payment_method_id: 'pix',
        payer: payerObj,
        external_reference: `${user.id}|${plan}`,
        metadata: {
          plan_type: plan,
          user_id: user.id,
        },
        notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      };

      console.log('Payload PIX (sem dados sensíveis):', JSON.stringify({
        ...pixPayment,
        payer: { ...payerObj, identification: payerObj.identification ? { type: 'CPF', number: '***' } : undefined },
      }));

      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${user.id}-${plan}-pix-${Date.now()}`,
        },
        body: JSON.stringify(pixPayment),
      });

      const mpText = await mpResponse.text();
      console.log('Resposta Mercado Pago PIX status:', mpResponse.status);
      console.log('Resposta Mercado Pago PIX body:', mpText.slice(0, 500));

      if (!mpResponse.ok) {
        let mpError: { message?: string; error?: string; cause?: { code?: string; description?: string }[] } = {};
        try { mpError = JSON.parse(mpText); } catch { /* ignore */ }

        let detail = mpError.message || mpError.error || mpText.slice(0, 200);
        if (mpError.cause && mpError.cause.length > 0) {
          detail = mpError.cause[0].description || detail;
        }

        return new Response(
          JSON.stringify({ error: `Erro ao criar pagamento PIX: ${detail}` }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const mpData = JSON.parse(mpText);

      if (!mpData.point_of_interaction?.transaction_data) {
        return new Response(
          JSON.stringify({ error: 'Dados do PIX não retornados pelo Mercado Pago' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          payment_id: mpData.id,
          status: mpData.status,
          qr_code: mpData.point_of_interaction.transaction_data.qr_code,
          qr_code_base64: mpData.point_of_interaction.transaction_data.qr_code_base64,
          ticket_url: mpData.point_of_interaction.transaction_data.ticket_url,
          expiration_date: mpData.date_of_expiration,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ============================================
    // FLUXO 2: PAGAMENTO COM CARTÃO
    // ============================================
    if (payment_method === 'credit_card' || payment_method === 'card') {
      const tokenToUse = body.token || body.card_token;

      if (!tokenToUse) {
        return new Response(JSON.stringify({ error: 'Token do cartão não fornecido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const payerEmail = payer?.email || user.email || '';
      if (!payerEmail) {
        return new Response(JSON.stringify({ error: 'Email do pagador não encontrado' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Criando pagamento com cartão para usuário:', user.id, 'plano:', plan, 'token:', tokenToUse.slice(0, 8) + '...');

      const cardPaymentBody: Record<string, unknown> = {
        transaction_amount: price,
        token: tokenToUse,
        description: description,
        installments: installments || 1,
        payer: {
          email: payerEmail,
          identification: payer?.identification
            ? {
                type: payer.identification.type,
                number: String(payer.identification.number).replace(/\D/g, ''),
              }
            : undefined,
        },
        external_reference: `${user.id}|${plan}`,
        metadata: {
          plan_type: plan,
          user_id: user.id,
        },
        notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
        statement_descriptor: 'BOLSO FURADO',
      };

      const pmId = body.payment_method_id;
      if (pmId && pmId !== 'visa' && pmId !== 'master' && pmId !== 'credit_card') {
        cardPaymentBody.payment_method_id = pmId;
      }

      console.log('Payload cartão (sem dados sensíveis):', JSON.stringify({
        ...cardPaymentBody,
        token: '***',
      }));

      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${user.id}-${plan}-card-${Date.now()}`,
        },
        body: JSON.stringify(cardPaymentBody),
      });

      const mpText = await mpResponse.text();
      console.log('Resposta Mercado Pago Cartão status:', mpResponse.status);
      console.log('Resposta Mercado Pago Cartão body:', mpText.slice(0, 800));

      if (!mpResponse.ok) {
        let mpError: {
          message?: string;
          error?: string;
          cause?: { code?: string; description?: string }[];
        } = {};
        try { mpError = JSON.parse(mpText); } catch { /* ignore */ }

        let errorMessage = 'Erro ao processar pagamento com cartão';

        if (mpError.cause && mpError.cause.length > 0) {
          const cause = mpError.cause[0];
          switch (cause.code) {
            case 'E301': errorMessage = 'Número do cartão inválido'; break;
            case 'E302': errorMessage = 'Código de segurança (CVV) inválido'; break;
            case '205': errorMessage = 'Digite o número do seu cartão'; break;
            case '208': errorMessage = 'Escolha um mês de validade'; break;
            case '209': errorMessage = 'Escolha um ano de validade'; break;
            case '212': case '213': errorMessage = 'Digite o código de segurança (CVV)'; break;
            case '214': errorMessage = 'Digite o CPF do titular'; break;
            case '221': errorMessage = 'Digite o nome do titular do cartão'; break;
            case '316': errorMessage = 'Digite um nome válido'; break;
            case '322': errorMessage = 'Tipo de documento inválido'; break;
            case '323': case '324': errorMessage = 'CPF inválido'; break;
            case '325': errorMessage = 'Mês de validade inválido'; break;
            case '326': errorMessage = 'Ano de validade inválido'; break;
            default: errorMessage = cause.description || mpError.message || errorMessage;
          }
        } else {
          errorMessage = mpError.message || mpError.error || mpText.slice(0, 200);
        }

        return new Response(
          JSON.stringify({ error: errorMessage }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const mpData = JSON.parse(mpText);
      console.log('Status do pagamento com cartão:', mpData.status, mpData.status_detail);

      if (mpData.status === 'approved') {
        const now = new Date();
        const expiresAt = new Date(now);

        if (plan === 'yearly') {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_expires_at: expiresAt.toISOString(),
            plan_type: plan,
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Erro ao atualizar perfil após aprovação:', updateError);
        } else {
          console.log(`Plano PRO ativado imediatamente para usuário ${user.id}`);
        }

        const { error: histError } = await supabaseAdmin.from('payment_history').insert({
          user_id: user.id,
          payment_id: String(mpData.id),
          amount: mpData.transaction_amount,
          currency: 'BRL',
          status: mpData.status,
          payment_method: mpData.payment_method_id || 'credit_card',
          plan_type: plan,
          external_reference: `${user.id}|${plan}`,
          paid_at: now.toISOString(),
        });

        if (histError) {
          console.error('Erro ao registrar histórico:', histError);
        }
      }

      return new Response(
        JSON.stringify({
          payment_id: mpData.id,
          status: mpData.status,
          status_detail: mpData.status_detail,
          transaction_amount: mpData.transaction_amount,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ============================================
    // FLUXO 3: PREFERÊNCIA (REDIRECT) - FALLBACK
    // ============================================
    console.log('Criando preferência de pagamento (redirect) para usuário:', user.id, 'plano:', plan);

    const origin = req.headers.get('origin') || 'https://bolsofurado.readdy.co';

    const preference = {
      items: [
        {
          id: `bolsofurado-${plan}`,
          title,
          description,
          quantity: 1,
          unit_price: price,
          currency_id: 'BRL',
        },
      ],
      payer: {
        email: user.email,
      },
      external_reference: `${user.id}|${plan}`,
      metadata: {
        plan_type: plan,
        user_id: user.id,
      },
      back_urls: {
        success: `${origin}/checkout/status?status=approved`,
        failure: `${origin}/checkout/status?status=failure`,
        pending: `${origin}/checkout/status?status=pending`,
      },
      auto_return: 'approved',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      statement_descriptor: 'BOLSO FURADO',
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    const mpText = await mpResponse.text();
    console.log('Resposta Mercado Pago Preferência status:', mpResponse.status);

    if (!mpResponse.ok) {
      let mpError: { message?: string; error?: string } = {};
      try { mpError = JSON.parse(mpText); } catch { /* ignore */ }
      const detail = mpError.message || mpError.error || mpText.slice(0, 200);
      return new Response(
        JSON.stringify({ error: `Erro ao criar preferência de pagamento: ${detail}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const mpData = JSON.parse(mpText);

    return new Response(
      JSON.stringify({
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
        preference_id: mpData.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro interno:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
