
import React, { useState, useEffect } from 'react';
import { useBackups } from '../../hooks/useBackups';

interface BackupManagerProps {
  className?: string;
}

function BackupManager({ className = '' }: BackupManagerProps) {
  const { loading, backups, createBackup, listBackups, downloadBackup, restoreBackup, deleteBackup } = useBackups();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'restore' | 'delete'; backupId: string } | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      await listBackups();
    } catch (error) {
      showNotification('error', 'Erro ao carregar backups');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateBackup = async () => {
    try {
      const backup = await createBackup();
      if (backup) {
        showNotification('success', 'Backup criado com sucesso!');
      }
    } catch (error) {
      showNotification('error', 'Erro ao criar backup');
    }
  };

  const handleDownload = async (backupId: string) => {
    try {
      await downloadBackup(backupId);
      showNotification('success', 'Download iniciado!');
    } catch (error) {
      showNotification('error', 'Erro ao baixar backup');
    }
  };

  const handleRestore = async (backupId: string) => {
    try {
      await restoreBackup(backupId);
      showNotification('success', 'Backup restaurado com sucesso! Recarregue a página para ver as mudanças.');
      setConfirmAction(null);
    } catch (error) {
      showNotification('error', 'Erro ao restaurar backup');
      setConfirmAction(null);
    }
  };

  const handleDelete = async (backupId: string) => {
    try {
      await deleteBackup(backupId);
      showNotification('success', 'Backup deletado com sucesso!');
      setConfirmAction(null);
    } catch (error) {
      showNotification('error', 'Erro ao deletar backup');
      setConfirmAction(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {/* Notificação */}
      {notification && (
        <div className={`mb-4 p-4 rounded-lg ${
          notification.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <i className={`${
              notification.type === 'success' ? 'ri-check-circle-line' : 'ri-error-warning-line'
            } mr-2`}></i>
            {notification.message}
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              {confirmAction.type === 'restore' ? 'Confirmar Restauração' : 'Confirmar Exclusão'}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmAction.type === 'restore' 
                ? 'Tem certeza que deseja restaurar este backup? Todos os dados atuais serão substituídos.' 
                : 'Tem certeza que deseja deletar este backup? Esta ação não pode ser desfeita.'}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'restore') {
                    handleRestore(confirmAction.backupId);
                  } else {
                    handleDelete(confirmAction.backupId);
                  }
                }}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  confirmAction.type === 'restore'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmAction.type === 'restore' ? 'Restaurar' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Backup dos Dados</h3>
          <p className="text-sm text-gray-600">
            Gerencie seus backups e mantenha seus dados financeiros seguros
          </p>
        </div>
        <button
          onClick={handleCreateBackup}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
        >
          <i className="ri-add-line mr-2"></i>
          {loading ? 'Criando...' : 'Criar Backup'}
        </button>
      </div>

      {/* Informações sobre Backup Automático */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-100">
        <div className="flex items-start">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 mt-0.5">
            <i className="ri-information-line text-blue-600"></i>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Backup Automático Ativo</h4>
            <p className="text-sm text-blue-700 mb-2">
              Seus dados são automaticamente salvos diariamente para garantir segurança.
            </p>
            <div className="text-xs text-blue-600">
              Próximo backup automático: Hoje às 03:00
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Backups */}
      <div className="space-y-3">
        {loading && backups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="ri-loader-4-line animate-spin text-2xl mb-2"></i>
            <p>Carregando backups...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="ri-file-list-3-line text-4xl mb-3 opacity-50"></i>
            <p className="text-lg mb-2">Nenhum backup encontrado</p>
            <p className="text-sm">Clique em "Criar Backup" para fazer seu primeiro backup manual</p>
          </div>
        ) : (
          backups.map((backup) => (
            <div
              key={backup.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4">
                  <i className="ri-file-zip-line text-white"></i>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    Backup {backup.id.replace('backup_', '').slice(0, 16)}...
                  </h4>
                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <span className="flex items-center">
                      <i className="ri-calendar-line mr-1"></i>
                      {formatDate(backup.created_at)}
                    </span>
                    <span className="flex items-center">
                      <i className="ri-file-line mr-1"></i>
                      {formatFileSize(backup.size)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(backup.id)}
                  disabled={loading}
                  className="p-2 text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:text-blue-600 transition-all duration-200 disabled:opacity-50"
                  title="Baixar backup"
                >
                  <i className="ri-download-2-line"></i>
                </button>
                <button
                  onClick={() => setConfirmAction({ type: 'restore', backupId: backup.id })}
                  disabled={loading}
                  className="p-2 text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:text-green-600 transition-all duration-200 disabled:opacity-50"
                  title="Restaurar backup"
                >
                  <i className="ri-history-line"></i>
                </button>
                <button
                  onClick={() => setConfirmAction({ type: 'delete', backupId: backup.id })}
                  disabled={loading}
                  className="p-2 text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:text-red-600 transition-all duration-200 disabled:opacity-50"
                  title="Deletar backup"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dicas */}
      <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
        <h4 className="font-medium text-amber-900 mb-2 flex items-center">
          <i className="ri-lightbulb-line mr-2"></i>
          Dicas de Backup
        </h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Backups automáticos são criados diariamente às 03:00</li>
          <li>• Você pode criar backups manuais a qualquer momento</li>
          <li>• Use a função "Restaurar" para voltar a um estado anterior dos dados</li>
          <li>• Mantenha sempre um backup recente baixado localmente</li>
        </ul>
      </div>
    </div>
  );
}

export default BackupManager;
