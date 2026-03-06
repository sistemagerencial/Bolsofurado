
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAdmin } from '../../../hooks/useAdmin';

export default function ManutencaoPage() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  // Redirecionar se não for admin
  if (!adminLoading && !isAdmin) {
    navigate('/');
    return null;
  }

  const handleLimparSessao = async () => {
    try {
      setLoading(true);
      
      // Fazer logout
      await supabase.auth.signOut();
      
      // Limpar localStorage
      localStorage.clear();
      
      // Mostrar mensagem e redirecionar
      alert('Sessão limpa com sucesso! Redirecionando para login...');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao limpar sessão:', error);
      alert('Erro ao limpar sessão. Tente novamente.');
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  const handleLimparCache = () => {
    try {
      setLoading(true);
      
      // Limpar localStorage
      localStorage.clear();
      
      // Limpar sessionStorage
      sessionStorage.clear();
      
      // Limpar cache do service worker se existir
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        });
      }
      
      // Mostrar mensagem e recarregar
      alert('Cache limpo com sucesso! A página será recarregada.');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      alert('Erro ao limpar cache. Tente novamente.');
      setLoading(false);
      setShowConfirm(null);
    }
  };

  const handleLimparLogs = async () => {
    try {
      setLoading(true);
      
      // Chamar edge function de limpeza
      const { data, error } = await supabase.functions.invoke('cleanup-system', {
        body: { action: 'cleanup_logs' }
      });
      
      if (error) throw error;
      
      alert(`Logs antigos removidos com sucesso! ${data?.deleted || 0} registros deletados.`);
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
      alert('Erro ao limpar logs. Verifique se a função está configurada.');
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  const handleResetarTokens = async () => {
    try {
      setLoading(true);
      
      // Forçar revalidação da sessão
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      if (session) {
        alert('Tokens revalidados com sucesso!');
      } else {
        alert('Nenhuma sessão ativa encontrada.');
      }
    } catch (error) {
      console.error('Erro ao resetar tokens:', error);
      alert('Erro ao resetar tokens. Tente fazer login novamente.');
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  const executeAction = (action: string) => {
    switch (action) {
      case 'sessao':
        handleLimparSessao();
        break;
      case 'cache':
        handleLimparCache();
        break;
      case 'logs':
        handleLimparLogs();
        break;
      case 'tokens':
        handleResetarTokens();
        break;
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
          >
            <i className="ri-arrow-left-line"></i>
            Voltar ao Painel Admin
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">
            <i className="ri-tools-line mr-3"></i>
            Sistema de Manutenção
          </h1>
          <p className="text-gray-400">
            Ferramentas de limpeza e manutenção do sistema
          </p>
        </div>

        {/* Cards de Ações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Limpar Sessão Atual */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-red-500/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-logout-box-line text-2xl text-red-400"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Limpar Sessão Atual
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Faz logout, limpa localStorage e redireciona para login
                </p>
                <button
                  onClick={() => setShowConfirm('sessao')}
                  disabled={loading}
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading && showConfirm === 'sessao' ? 'Limpando...' : 'Limpar Sessão'}
                </button>
              </div>
            </div>
          </div>

          {/* Limpar Cache Local */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-delete-bin-line text-2xl text-blue-400"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Limpar Cache Local
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Remove localStorage, sessionStorage e cache do navegador
                </p>
                <button
                  onClick={() => setShowConfirm('cache')}
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading && showConfirm === 'cache' ? 'Limpando...' : 'Limpar Cache'}
                </button>
              </div>
            </div>
          </div>

          {/* Limpar Logs Antigos */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-file-shred-line text-2xl text-yellow-400"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Limpar Logs Antigos
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Remove logs com mais de 90 dias do banco de dados
                </p>
                <button
                  onClick={() => setShowConfirm('logs')}
                  disabled={loading}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading && showConfirm === 'logs' ? 'Limpando...' : 'Limpar Logs'}
                </button>
              </div>
            </div>
          </div>

          {/* Resetar Tokens */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-green-500/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-key-2-line text-2xl text-green-400"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Resetar Tokens
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Força revalidação da sessão e atualiza tokens
                </p>
                <button
                  onClick={() => setShowConfirm('tokens')}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading && showConfirm === 'tokens' ? 'Resetando...' : 'Resetar Tokens'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Aviso de Segurança */}
        <div className="mt-8 bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <i className="ri-alert-line text-2xl text-orange-400 flex-shrink-0"></i>
            <div>
              <h4 className="text-orange-400 font-semibold mb-2">Atenção</h4>
              <p className="text-gray-300 text-sm">
                Estas ações são irreversíveis e podem afetar o funcionamento do sistema. 
                Use apenas quando necessário e confirme cada ação antes de executar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              Confirmar Ação
            </h3>
            <p className="text-gray-300 mb-6">
              {showConfirm === 'sessao' && 'Tem certeza que deseja limpar a sessão atual? Você será desconectado.'}
              {showConfirm === 'cache' && 'Tem certeza que deseja limpar todo o cache? A página será recarregada.'}
              {showConfirm === 'logs' && 'Tem certeza que deseja remover logs antigos? Esta ação não pode ser desfeita.'}
              {showConfirm === 'tokens' && 'Tem certeza que deseja resetar os tokens de autenticação?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                disabled={loading}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={() => executeAction(showConfirm)}
                disabled={loading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? 'Executando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
