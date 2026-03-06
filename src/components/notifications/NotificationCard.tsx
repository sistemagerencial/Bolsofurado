import React, { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationSettings from './NotificationSettings';

const NotificationCard: React.FC = () => {
  const {
    isSupported,
    permission,
    settings,
    subscribeToPush,
    sendTestNotification
  } = useNotifications();

  const [showSettings, setShowSettings] = useState(false);

  const getStatusColor = () => {
    if (!isSupported) return 'text-gray-500';
    if (permission.granted && settings.push_notifications) return 'text-green-600';
    if (permission.denied) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusText = () => {
    if (!isSupported) return 'Não suportado';
    if (permission.granted && settings.push_notifications) return 'Ativas';
    if (permission.denied) return 'Bloqueadas';
    if (permission.default) return 'Não configuradas';
    return 'Inativas';
  };

  const handleQuickEnable = async () => {
    try {
      await subscribeToPush();
      // Enviar notificação de teste
      setTimeout(() => {
        sendTestNotification();
      }, 1000);
    } catch (error) {
      console.error('Erro ao ativar notificações:', error);
    }
  };

  if (showSettings) {
    return <NotificationSettings onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
            <i className="ri-notification-3-line text-2xl text-teal-600"></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Notificações Push
            </h3>
            <p className="text-sm text-gray-600">
              Receba alertas importantes instantaneamente
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          getStatusColor() === 'text-green-600' 
            ? 'bg-green-100 text-green-800' 
            : getStatusColor() === 'text-red-600'
            ? 'bg-red-100 text-red-800'
            : getStatusColor() === 'text-yellow-600'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {getStatusText()}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <i className="ri-check-circle-line text-green-500"></i>
          <span>Pagamentos aprovados e recusados</span>
        </div>
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <i className="ri-check-circle-line text-green-500"></i>
          <span>Lembretes de vencimento</span>
        </div>
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <i className="ri-check-circle-line text-green-500"></i>
          <span>Atualizações importantes do sistema</span>
        </div>
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <i className="ri-check-circle-line text-green-500"></i>
          <span>Alertas de segurança</span>
        </div>
      </div>

      <div className="flex space-x-3">
        {!permission.granted && isSupported && (
          <button
            onClick={handleQuickEnable}
            className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
          >
            <i className="ri-notification-line mr-2"></i>
            Ativar Notificações
          </button>
        )}
        
        <button
          onClick={() => setShowSettings(true)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <i className="ri-settings-3-line mr-2"></i>
          Configurar
        </button>
      </div>

      {/* Informações adicionais */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <i className="ri-information-line text-blue-600 mt-0.5"></i>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Como funciona?</p>
            <p>
              As notificações push funcionam mesmo quando você não está no site. 
              Você será alertado instantaneamente sobre eventos importantes em suas finanças.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;