import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Token de autorização não fornecido");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const { token, planType, email, payer } = await req.json();

    if (!token || !planType || !email) {
      throw new Error("Dados incompletos: token, planType e email são obrigatórios");
    }

    // Configuração dos planos
    const plans = {
      monthly: {
        amount: 19.90,
        frequency: 1,
        frequency_type: "months",
        reason: "Assinatura Mensal - Plano PRO"
      },
      annual: {
        amount: 199.00,
        frequency: 1,
        frequency_type: "months",
        reason: "Assinatura Anual - Plano PRO"
      }
    };

    const selectedPlan = plans[planType as keyof typeof plans];
    if (!selectedPlan) {
      throw new Error("Tipo de plano inválido");
    }

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("Token do Mercado Pago não configurado");
    }

    // Criar assinatura recorrente no Mercado Pago
    const subscriptionData = {
      reason: selectedPlan.reason,
      auto_recurring: {
        frequency: selectedPlan.frequency,
        frequency_type: selectedPlan.frequency_type,
        transaction_amount: selectedPlan.amount,
        currency_id: "BRL",
        start_date: new Date().toISOString(),
      },
      back_url: `${req.headers.get("origin")}/checkout/status`,
      payer_email: email,
      card_token_id: token,
      status: "authorized",
    };

    // Se houver informações do pagador, adicionar
    if (payer) {
      subscriptionData.payer = {
        email: email,
        identification: payer.identification ? {
          type: payer.identification.type || "CPF",
          number: payer.identification.number.replace(/\D/g, "")
        } : undefined,
        first_name: payer.first_name,
        last_name: payer.last_name,
      };
    }

    console.log("Criando assinatura no Mercado Pago:", JSON.stringify(subscriptionData, null, 2));

    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscriptionData),
    });

    const mpData = await mpResponse.json();

    console.log("Resposta do Mercado Pago:", JSON.stringify(mpData, null, 2));

    if (!mpResponse.ok) {
      console.error("Erro do Mercado Pago:", mpData);
      throw new Error(mpData.message || `Erro ${mpResponse.status} ao criar assinatura`);
    }

    // Calcular data de expiração baseada no tipo de plano
    const expiresAt = new Date();
    if (planType === "monthly") {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (planType === "annual") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    // Atualizar perfil do usuário com informações da assinatura
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        preapproval_id: mpData.id,
        subscription_id: mpData.id,
        subscription_type: planType,
        subscription_status: mpData.status,
        subscription_expires_at: expiresAt.toISOString(),
        plan_type: "PRO",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Erro ao atualizar perfil:", updateError);
      throw new Error("Erro ao atualizar perfil do usuário");
    }

    // Registrar pagamento inicial no histórico
    const { error: paymentError } = await supabaseClient
      .from("payment_history")
      .insert({
        user_id: user.id,
        payment_id: mpData.id,
        amount: selectedPlan.amount,
        currency: "BRL",
        status: mpData.status,
        payment_method: "credit_card",
        plan_type: planType,
        is_recurring: true,
        created_at: new Date().toISOString(),
      });

    if (paymentError) {
      console.error("Erro ao registrar pagamento:", paymentError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: mpData.id,
          status: mpData.status,
          init_point: mpData.init_point,
          preapproval_id: mpData.id,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro na função create-subscription:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro ao criar assinatura",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});