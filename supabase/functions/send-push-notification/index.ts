import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  user_id?: string;
  user_ids?: string[];
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  type: 'payment' | 'reminder' | 'system' | 'general';
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização necessário' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter dados do request
    const payload: NotificationPayload = await req.json();

    // Validar payload
    if (!payload.title || !payload.body || !payload.type) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios: title, body, type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processando notificação:', {
      type: payload.type,
      title: payload.title,
      users: payload.user_id ? 1 : (payload.user_ids?.length || 0)
    });

    // Determinar usuários alvo
    let targetUsers: string[] = [];
    
    if (payload.user_id) {
      targetUsers = [payload.user_id];
    } else if (payload.user_ids) {
      targetUsers = payload.user_ids;
    } else {
      // Buscar todos os usuários com notificações habilitadas
      const { data: users, error: usersError } = await supabaseClient
        .from('profiles')
        .select('id')
        .not('push_subscription', 'is', null)
        .eq('notification_settings->push_notifications', true)
        .eq(`notification_settings->${payload.type}_notifications`, true);

      if (usersError) throw usersError;
      targetUsers = users?.map(u => u.id) || [];
    }

    if (targetUsers.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum usuário encontrado para envio de notificações',
          sent: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar subscrições dos usuários
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, push_subscription, notification_settings')
      .in('id', targetUsers)
      .not('push_subscription', 'is', null);

    if (profilesError) throw profilesError;

    // Filtrar usuários com notificações habilitadas
    const validProfiles = profiles?.filter(profile => {
      const settings = profile.notification_settings;
      return settings?.push_notifications && settings?.[`${payload.type}_notifications`];
    }) || [];

    console.log(`Enviando notificações para ${validProfiles.length} usuários`);

    // Chaves VAPID
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLJrD9V3wGOUJKg7VX8_QOTASX8LR1FBEOq8A3Xb3fZ8F0EoGDdAjU';
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || 'YOUR_VAPID_PRIVATE_KEY';

    // Preparar payload da notificação
    const notificationData = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: '/favicon.ico',
      url: payload.url || '/',
      tag: payload.tag || `notification-${Date.now()}`,
      requireInteraction: payload.requireInteraction || false,
      id: `${payload.type}-${Date.now()}`
    };

    // Enviar notificações
    const results = await Promise.allSettled(
      validProfiles.map(async (profile) => {
        try {
          const subscription: PushSubscription = JSON.parse(profile.push_subscription);
          
          // Criar JWT para autenticação VAPID
          const vapidHeader = {
            "typ": "JWT",
            "alg": "ES256"
          };

          const vapidPayload = {
            "aud": new URL(subscription.endpoint).origin,
            "exp": Math.floor(Date.now() / 1000) + (12 * 60 * 60), // 12 horas
            "sub": "mailto:contato@bolsofurado.com"
          };

          // Para simplicidade, vamos usar web-push via fetch
          const response = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Encoding': 'aesgcm',
              'Authorization': `vapid t=${VAPID_PUBLIC_KEY}, k=${VAPID_PUBLIC_KEY}`,
              'Crypto-Key': `p256ecdsa=${VAPID_PUBLIC_KEY}`,
              'TTL': '86400'
            },
            body: JSON.stringify(notificationData)
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return { userId: profile.id, success: true };

        } catch (error) {
          console.error(`Erro ao enviar notificação para usuário ${profile.id}:`, error);
          
          // Se a subscrição é inválida, remover do banco
          if (error.message?.includes('410') || error.message?.includes('invalid')) {
            await supabaseClient
              .from('profiles')
              .update({ push_subscription: null })
              .eq('id', profile.id);
          }

          return { userId: profile.id, success: false, error: error.message };
        }
      })
    );

    // Contar sucessos e falhas
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    // Log dos resultados
    console.log(`Notificações enviadas: ${successful} sucessos, ${failed} falhas`);

    // Registrar histórico de notificações
    try {
      await supabaseClient
        .from('admin_logs')
        .insert({
          action: 'push_notification_sent',
          details: {
            type: payload.type,
            title: payload.title,
            target_users: targetUsers.length,
            sent_successful: successful,
            sent_failed: failed,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Erro ao registrar log:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notificações processadas com sucesso`,
        sent: successful,
        failed: failed,
        total: validProfiles.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro no envio de notificações push:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});