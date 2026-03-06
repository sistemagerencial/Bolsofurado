import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface NotificationSettings {
  payment_notifications: boolean;
  reminder_notifications: boolean;
  system_notifications: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true
  });
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>({
    payment_notifications: true,
    reminder_notifications: true,
    system_notifications: true,
    email_notifications: true,
    push_notifications: false
  });
  const [loading, setLoading] = useState(false);

  // Verificar suporte a notificações
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'Notification' in window && 
                       'serviceWorker' in navigator && 
                       'PushManager' in window;
      setIsSupported(supported);
      
      if (supported) {
        updatePermissionState();
      }
    };

    checkSupport();
  }, []);

  // Atualizar estado das permissões
  const updatePermissionState = useCallback(() => {
    if (!isSupported) return;

    const currentPermission = Notification.permission;
    setPermission({
      granted: currentPermission === 'granted',
      denied: currentPermission === 'denied',
      default: currentPermission === 'default'
    });
  }, [isSupported]);

  // Carregar configurações do usuário
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('notification_settings')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data?.notification_settings) {
          setSettings({ ...settings, ...data.notification_settings });
        }
      } catch (error) {
        console.error('Erro ao carregar configurações de notificação:', error);
      }
    };

    loadSettings();
  }, [user]);

  // Registrar Service Worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker não é suportado');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado com sucesso:', registration);
      
      // Aguardar ativação
      await navigator.serviceWorker.ready;
      
      return registration;
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
      return null;
    }
  }, []);

  // Solicitar permissão para notificações
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.log('Notificações não são suportadas');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      updatePermissionState();
      
      if (permission === 'granted') {
        console.log('Permissão para notificações concedida');
        return true;
      } else {
        console.log('Permissão para notificações negada');
        return false;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  }, [isSupported, updatePermissionState]);

  // Subscrever a notificações push
  const subscribeToPush = useCallback(async (): Promise<PushSubscription | null> => {
    if (!permission.granted) {
      const granted = await requestPermission();
      if (!granted) return null;
    }

    try {
      const registration = await registerServiceWorker();
      if (!registration) return null;

      // Verificar se já existe uma subscrição
      let existingSubscription = await registration.pushManager.getSubscription();
      
      if (!existingSubscription) {
        // Criar nova subscrição
        const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLJrD9V3wGOUJKg7VX8_QOTASX8LR1FBEOq8A3Xb3fZ8F0EoGDdAjU'; // Chave pública VAPID
        
        existingSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      setSubscription(existingSubscription);

      // Salvar subscrição no backend
      if (user && existingSubscription) {
        await savePushSubscription(existingSubscription);
      }

      return existingSubscription;
    } catch (error) {
      console.error('Erro ao subscrever a push notifications:', error);
      return null;
    }
  }, [permission.granted, requestPermission, registerServiceWorker, user]);

  // Salvar subscrição no banco de dados
  const savePushSubscription = async (subscription: PushSubscription) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          push_subscription: JSON.stringify(subscription),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      console.log('Subscrição push salva com sucesso');
    } catch (error) {
      console.error('Erro ao salvar subscrição push:', error);
    }
  };

  // Atualizar configurações de notificação
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!user) return;

    setLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setSettings(updatedSettings);

      // Se habilitou notificações push, subscrever
      if (newSettings.push_notifications && !subscription) {
        await subscribeToPush();
      }

      console.log('Configurações de notificação atualizadas');
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Enviar notificação de teste
  const sendTestNotification = useCallback(async () => {
    if (!permission.granted) {
      console.log('Permissão necessária para enviar notificação');
      return;
    }

    try {
      const notification = new Notification('Teste - Bolso Furado', {
        body: 'Esta é uma notificação de teste do seu sistema financeiro!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        tag: 'test-notification',
        requireInteraction: false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-fechar após 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
    }
  }, [permission.granted]);

  // Desinscrever de notificações push
  const unsubscribeFromPush = async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Remover do banco de dados
      if (user) {
        await supabase
          .from('profiles')
          .update({
            push_subscription: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      console.log('Desinscrição de push notifications realizada');
    } catch (error) {
      console.error('Erro ao desinscrever:', error);
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    settings,
    loading,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    updateSettings,
    sendTestNotification,
    registerServiceWorker
  };
};

// Função auxiliar para converter chave VAPID
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}