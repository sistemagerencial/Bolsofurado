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
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'MERCADOPAGO_ACCESS_TOKEN não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { payment_id } = body;

    if (!payment_id) {
      return new Response(
        JSON.stringify({ error: 'payment_id não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${payment_id}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!mpResponse.ok) {
      const errText = await mpResponse.text();
      console.error('Erro ao consultar pagamento MP:', errText);
      return new Response(
        JSON.stringify({ error: 'Erro ao consultar pagamento', status: 'unknown' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payment = await mpResponse.json();
    console.log(`Status do pagamento ${payment_id}:`, payment.status);

    return new Response(
      JSON.stringify({
        payment_id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro interno:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno', status: 'unknown' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
