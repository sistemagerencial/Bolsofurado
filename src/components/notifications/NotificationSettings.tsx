import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

interface NotificationSettingsProps {
  onClose?: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const {
    isSupported,
    permission,
    settings,
    loading,
    updateSettings,
    requestPermission,
    subscribeToPush,
    sendTestNotification
  } = useNotifications();

  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));

    // Se está habilitando notificações push, solicitar permissão primeiro
    if (key === 'push_notifications' && value) {
      if (!permission.granted) {
        const granted = await requestPermission();
        if (!granted) {
          setLocalSettings(prev => ({ ...prev, push_notifications: false }));
          showMessage('error', 'Permissão para notificações negada');
          return;
        }
      }
      
      // Subscrever a notificações push
      const subscription = await subscribeToPush();
      if (!subscription) {
        setLocalSettings(prev => ({ ...prev, push_notifications: false }));
        showMessage('error', 'Erro ao configurar notificações push');
        return;
      }
    }

    // Salvar configuração
    try {
      setSaving(true);
      await updateSettings({ [key]: value });
      showMessage('success', 'Configuração atualizada com sucesso!');
    } catch (error) {
      setLocalSettings(prev => ({ ...prev, [key]: !value }));
      showMessage('error', 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      if (!permission.granted) {
        const granted = await requestPermission();
        if (!granted) {
          showMessage('error', 'Permissão necessária para teste de notificação');
          return;
        }
      }

      await sendTestNotification();
      showMessage('success', 'Notificação de teste enviada!');
    } catch (error) {
      showMessage('error', 'Erro ao enviar notificação de teste');
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-notification-off-line text-2xl text-yellow-600"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Notificações não suportadas
          </h3>
          <p className="text-gray-600 mb-4">
            Seu navegador não suporta notificações push. Atualize para a versão mais recente ou use um navegador compatível.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Configurações de Notificação
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <i className="ri-close-line text-xl text-gray-500"></i>
          </button>
        )}
      </div>

      {/* Mensagem de status */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            <i className={`${
              message.type === 'success' ? 'ri-check-circle-line' : 'ri-error-warning-line'
            } text-lg mr-2`}></i>
            {message.text}
          </div>
        </div>
      )}

      {/* Status das permissões */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Status das Permissões</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Navegador compatível:</span>
            <span className={`text-sm font-medium ${isSupported ? 'text-green-600' : 'text-red-600'}`}>
              {isSupported ? '✓ Suportado' : '✗ Não suportado'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Permissão de notificação:</span>
            <span className={`text-sm font-medium ${
              permission.granted ? 'text-green-600' : 
              permission.denied ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {permission.granted ? '✓ Concedida' : 
               permission.denied ? '✗ Negada' : '⏳ Pendente'}
            </span>
          </div>
        </div>

        {permission.default && (
          <button
            onClick={requestPermission}
            className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
          >
            <i className="ri-notification-line mr-2"></i>
            Solicitar Permissão
          </button>
        )}
      </div>

      {/* Configurações de notificação */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 mb-3">Tipos de Notificação</h3>

        {/* Notificações de pagamento */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Pagamentos</h4>
            <p className="text-sm text-gray-600">
              Notificações sobre pagamentos aprovados, recusados e pendentes
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={localSettings.payment_notifications}
              onChange={(e) => handleToggle('payment_notifications', e.target.checked)}
              disabled={saving}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
        </div>

        {/* Lembretes */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Lembretes</h4>
            <p className="text-sm text-gray-600">
              Lembretes de vencimentos de contas e metas financeiras
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={localSettings.reminder_notifications}
              onChange={(e) => handleToggle('reminder_notifications', e.target.checked)}
              disabled={saving}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
        </div>

        {/* Notificações do sistema */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Sistema</h4>
            <p className="text-sm text-gray-600">
              Atualizações do sistema, manutenções e novidades
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={localSettings.system_notifications}
              onChange={(e) => handleToggle('system_notifications', e.target.checked)}
              disabled={saving}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
        </div>

        {/* Notificações por email */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Email</h4>
            <p className="text-sm text-gray-600">
              Receber notificações por email além das notificações push
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={localSettings.email_notifications}
              onChange={(e) => handleToggle('email_notifications', e.target.checked)}
              disabled={saving}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
        </div>

        {/* Notificações push */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Notificações Push</h4>
            <p className="text-sm text-gray-600">
              Notificações diretas no navegador (requer permissão)
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={localSettings.push_notifications}
              onChange={(e) => handleToggle('push_notifications', e.target.checked)}
              disabled={saving || permission.denied}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 peer-disabled:opacity-50"></div>
          </label>
        </div>
      </div>

      {/* Botão de teste */}
      {permission.granted && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleTestNotification}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            disabled={saving}
          >
            <i className="ri-notification-3-line mr-2"></i>
            Enviar Notificação de Teste
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {(loading || saving) && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center space-x-2 text-teal-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
            <span>Salvando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;