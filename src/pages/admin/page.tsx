import { useState, useEffect } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  subscription_status: string;
  subscription_expires_at: string | null;
  trial_end_date: string | null;
  plan_type: string;
  is_lifetime: boolean;
  is_admin_override: boolean;
  created_at: string;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { isAdmin, loading, getAllUsers, searchUsers, getUserById, grantOneMonth, grantOneYear, grantLifetime, cancelSubscription, getAdminLogs } = useAdmin();

  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadAllUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      handleSearch();
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchTerm]);

  const loadAllUsers = async () => {
    setLoadingUsers(true);
    const users = await getAllUsers();
    setAllUsers(users);
    setLoadingUsers(false);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSearch = async () => {
    const results = await searchUsers(searchTerm);
    setSearchResults(results);
    setShowResults(true);
  };

  const handleSelectUser = async (user: Profile) => {
    const fullUser = await getUserById(user.id);
    setSelectedUser(fullUser);
    setShowResults(false);
    setSearchTerm(user.email);
  };

  const handleAction = async (action: () => Promise<any>, successMessage: string) => {
    if (!selectedUser) return;
    setActionLoading(true);
    const result = await action();
    if (result.success) {
      showToast(successMessage, 'success');
      const updated = await getUserById(selectedUser.id);
      setSelectedUser(updated);
      await loadAllUsers();
    } else {
      showToast('Erro ao executar ação. Tente novamente.', 'error');
    }
    setActionLoading(false);
  };

  const handleQuickLifetime = async (userId: string) => {
    setActionLoading(true);
    const result = await grantLifetime(userId);
    if (result.success) {
      showToast('Acesso vitalício concedido!', 'success');
      await loadAllUsers();
    } else {
      showToast('Erro ao conceder acesso vitalício.', 'error');
    }
    setActionLoading(false);
  };

  const loadLogs = async () => {
    const logsData = await getAdminLogs(100);
    setLogs(logsData);
    setShowLogs(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expires = new Date(expiresAt);
    return Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getPlanBadge = (user: Profile) => {
    if (user.is_lifetime) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] text-xs font-semibold whitespace-nowrap">
          <i className="ri-vip-crown-fill"></i>
          Vitalício
        </span>
      );
    }
    
    if (user.subscription_status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#10B981]/20 text-[#10B981] text-xs font-semibold whitespace-nowrap">
          <i className="ri-shield-check-line"></i>
          Pro
        </span>
      );
    }
    
    if (user.subscription_status === 'trial') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FACC15]/20 text-[#FACC15] text-xs font-semibold whitespace-nowrap">
          <i className="ri-time-line"></i>
          Trial
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EF4444]/20 text-[#EF4444] text-xs font-semibold whitespace-nowrap">
        <i className="ri-error-warning-line"></i>
        Expirado
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0E0B16]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#9CA3AF] text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-[#16122A] hover:bg-[#1E1833] border border-white/10 text-[#F9FAFB] rounded-lg transition-all cursor-pointer whitespace-nowrap"
          >
            <i className="ri-arrow-left-line text-lg"></i>
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <i className="ri-admin-line mr-3"></i>
            Painel Administrativo
          </h1>
          <p className="text-gray-600">Gerencie usuários e configurações do sistema</p>
        </div>

        {/* Botão de Manutenção */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/manutencao')}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-tools-line text-xl"></i>
            Sistema de Manutenção
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-[#16122A] border-[#10B981]/40 text-[#10B981]'
              : 'bg-[#16122A] border-[#EF4444]/40 text-[#EF4444]'
          }`}>
            <i className={`text-lg ${toast.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}`}></i>
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}

        {/* Listagem de Todos os Usuários */}
        <div className="bg-[#16122A] border border-white/5 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[#F9FAFB] flex items-center gap-2">
              <i className="ri-team-line text-[#7C3AED]"></i>
              Todos os Usuários ({allUsers.length})
            </h2>
            <button
              onClick={loadAllUsers}
              className="px-4 py-2 bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 border border-[#7C3AED]/20 text-[#7C3AED] rounded-xl transition-all text-sm font-medium whitespace-nowrap cursor-pointer flex items-center gap-2"
            >
              <i className="ri-refresh-line"></i>
              Atualizar
            </button>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#9CA3AF] text-sm">Carregando usuários...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#9CA3AF] whitespace-nowrap">Nome</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#9CA3AF] whitespace-nowrap">E-mail</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#9CA3AF] whitespace-nowrap">Telefone</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#9CA3AF] whitespace-nowrap">Plano</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#9CA3AF] whitespace-nowrap">Dias Restantes</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#9CA3AF] whitespace-nowrap">Cadastrado em</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-[#9CA3AF] whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-[#9CA3AF]">
                        <i className="ri-inbox-line text-3xl block mb-2"></i>
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  ) : (
                    allUsers.map((user) => {
                      const daysRemaining = getDaysRemaining(user.subscription_expires_at);
                      return (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-[#F9FAFB] text-sm font-medium whitespace-nowrap">
                            {user.name || 'Sem nome'}
                          </td>
                          <td className="py-3 px-4 text-[#9CA3AF] text-sm whitespace-nowrap">
                            {user.email}
                          </td>
                          <td className="py-3 px-4 text-[#9CA3AF] text-sm whitespace-nowrap">
                            {user.phone ? (
                              <a
                                href={`https://wa.me/55${user.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[#10B981] hover:text-[#34D399] transition-colors cursor-pointer"
                                title="Abrir no WhatsApp"
                              >
                                <i className="ri-whatsapp-line text-base"></i>
                                {user.phone}
                              </a>
                            ) : (
                              <span className="text-[#6B7280]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {getPlanBadge(user)}
                          </td>
                          <td className="py-3 px-4 text-[#9CA3AF] text-sm whitespace-nowrap">
                            {user.is_lifetime ? (
                              <span className="text-[#7C3AED] font-medium">∞ Vitalício</span>
                            ) : daysRemaining !== null ? (
                              daysRemaining > 0 ? (
                                <span className={daysRemaining <= 7 ? 'text-[#EF4444] font-medium' : 'text-[#9CA3AF]'}>
                                  {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
                                </span>
                              ) : (
                                <span className="text-[#EF4444] font-medium">Expirado</span>
                              )
                            ) : (
                              <span className="text-[#9CA3AF]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#9CA3AF] text-xs whitespace-nowrap">
                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {!user.is_lifetime && (
                              <button
                                onClick={() => handleQuickLifetime(user.id)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 border border-[#7C3AED]/30 text-[#7C3AED] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5"
                                title="Tornar Vitalício"
                              >
                                <i className="ri-vip-crown-line"></i>
                                Vitalício
                              </button>
                            )}
                            {user.is_lifetime && (
                              <span className="text-[#7C3AED] text-xs font-medium">
                                <i className="ri-check-line"></i> Vitalício
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Search Section */}
        <div className="bg-[#16122A] border border-white/5 rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium text-[#F9FAFB] mb-3">
            Buscar Usuário por Email
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o email do usuário..."
              className="w-full bg-[#0E0B16] border border-white/10 rounded-xl px-4 py-3 pr-12 text-[#F9FAFB] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] transition-all"
            />
            <i className="ri-search-line absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-lg"></i>
          </div>

          {showResults && searchResults.length > 0 && (
            <div className="mt-2 bg-[#0E0B16] border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 border-b border-white/5 last:border-b-0 transition-colors cursor-pointer"
                >
                  <div className="font-medium text-[#F9FAFB] text-sm">{user.email}</div>
                  <div className="text-xs text-[#9CA3AF] mt-0.5">
                    {user.name || 'Sem nome'} • {user.subscription_status}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Details */}
        {selectedUser && (
          <div className="bg-[#16122A] border border-white/5 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-[#F9FAFB] mb-5 flex items-center gap-2">
              <i className="ri-user-line text-[#7C3AED]"></i>
              Detalhes do Usuário
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#0E0B16] border border-white/5 rounded-xl p-4">
                <p className="text-xs text-[#9CA3AF] uppercase font-medium mb-1">Email</p>
                <p className="text-sm text-[#F9FAFB] font-medium">{selectedUser.email}</p>
              </div>
              <div className="bg-[#0E0B16] border border-white/5 rounded-xl p-4">
                <p className="text-xs text-[#9CA3AF] uppercase font-medium mb-1">Nome</p>
                <p className="text-sm text-[#F9FAFB] font-medium">{selectedUser.name || 'Não informado'}</p>
              </div>
              <div className="bg-[#0E0B16] border border-white/5 rounded-xl p-4">
                <p className="text-xs text-[#9CA3AF] uppercase font-medium mb-1">Telefone / WhatsApp</p>
                {selectedUser.phone ? (
                  <a
                    href={`https://wa.me/55${selectedUser.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#10B981] hover:text-[#34D399] transition-colors text-sm font-medium cursor-pointer"
                  >
                    <i className="ri-whatsapp-line text-base"></i>
                    {selectedUser.phone}
                  </a>
                ) : (
                  <p className="text-sm text-[#6B7280]">Não informado</p>
                )}
              </div>

              <div className="bg-[#0E0B16] border border-white/5 rounded-xl p-4">
                <p className="text-xs text-[#9CA3AF] uppercase font-medium mb-2">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedUser.subscription_status === 'active'
                    ? 'bg-[#10B981]/20 text-[#10B981]'
                    : selectedUser.subscription_status === 'trial'
                    ? 'bg-[#FACC15]/20 text-[#FACC15]'
                    : 'bg-[#EF4444]/20 text-[#EF4444]'
                }`}>
                  {selectedUser.subscription_status === 'active' ? 'Ativo'
                    : selectedUser.subscription_status === 'trial' ? 'Trial' : 'Expirado'}
                </span>
              </div>

              <div className="bg-[#0E0B16] border border-white/5 rounded-xl p-4">
                <p className="text-xs text-[#9CA3AF] uppercase font-medium mb-2">Plano</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedUser.is_lifetime
                    ? 'bg-[#7C3AED]/20 text-[#7C3AED]'
                    : selectedUser.plan_type === 'monthly'
                    ? 'bg-[#10B981]/20 text-[#10B981]'
                    : selectedUser.plan_type === 'yearly'
                    ? 'bg-[#EC4899]/20 text-[#EC4899]'
                    : 'bg-white/10 text-[#9CA3AF]'
                }`}>
                  {selectedUser.is_lifetime ? 'Vitalício'
                    : selectedUser.plan_type === 'monthly' ? 'Mensal'
                    : selectedUser.plan_type === 'yearly' ? 'Anual' : 'Gratuito'}
                </span>
              </div>

              <div className="bg-[#0E0B16] border border-white/5 rounded-xl p-4">
                <p className="text-xs text-[#9CA3AF] uppercase font-medium mb-1">Expiração</p>
                <p className="text-sm text-[#F9FAFB] font-medium">
                  {selectedUser.is_lifetime ? 'Nunca expira' : formatDate(selectedUser.subscription_expires_at)}
                </p>
                {!selectedUser.is_lifetime && selectedUser.subscription_expires_at && (
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    {getDaysRemaining(selectedUser.subscription_expires_at)! > 0
                      ? `${getDaysRemaining(selectedUser.subscription_expires_at)} dias restantes`
                      : 'Expirado'}
                  </p>
                )}
              </div>

              <div className="bg-[#0E0B16] border border-white/5 rounded-xl p-4">
                <p className="text-xs text-[#9CA3AF] uppercase font-medium mb-1">Cadastrado em</p>
                <p className="text-sm text-[#F9FAFB] font-medium">{formatDate(selectedUser.created_at)}</p>
              </div>
            </div>

            {/* Flags */}
            {(selectedUser.is_lifetime || selectedUser.is_admin_override) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedUser.is_lifetime && (
                  <span className="px-3 py-1.5 bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/20 rounded-lg text-xs font-medium flex items-center gap-1.5">
                    <i className="ri-vip-crown-line"></i>
                    Acesso Vitalício
                  </span>
                )}
                {selectedUser.is_admin_override && (
                  <span className="px-3 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5">
                    <i className="ri-shield-star-line"></i>
                    Liberação Manual
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-white/5 pt-5">
              <h3 className="text-sm font-semibold text-[#9CA3AF] mb-4">Ações Administrativas</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => handleAction(() => grantOneMonth(selectedUser.id), 'Acesso de 1 mês concedido!')}
                  disabled={actionLoading}
                  className="px-4 py-3 bg-[#10B981]/20 hover:bg-[#10B981]/30 border border-[#10B981]/30 text-[#10B981] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="ri-calendar-line"></i>
                  1 Mês
                </button>
                <button
                  onClick={() => handleAction(() => grantOneYear(selectedUser.id), 'Acesso de 12 meses concedido!')}
                  disabled={actionLoading}
                  className="px-4 py-3 bg-[#EC4899]/20 hover:bg-[#EC4899]/30 border border-[#EC4899]/30 text-[#EC4899] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="ri-calendar-2-line"></i>
                  12 Meses
                </button>
                <button
                  onClick={() => handleAction(() => grantLifetime(selectedUser.id), 'Acesso vitalício concedido!')}
                  disabled={actionLoading}
                  className="px-4 py-3 bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 border border-[#7C3AED]/30 text-[#7C3AED] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="ri-vip-crown-line"></i>
                  Vitalício
                </button>
                <button
                  onClick={() => handleAction(() => cancelSubscription(selectedUser.id), 'Assinatura cancelada!')}
                  disabled={actionLoading}
                  className="px-4 py-3 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 border border-[#EF4444]/30 text-[#EF4444] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="ri-close-circle-line"></i>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="bg-[#16122A] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[#F9FAFB] flex items-center gap-2">
              <i className="ri-file-list-3-line text-[#7C3AED]"></i>
              Logs de Ações
            </h2>
            <button
              onClick={loadLogs}
              className="px-4 py-2 bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 border border-[#7C3AED]/20 text-[#7C3AED] rounded-xl transition-all text-sm font-medium whitespace-nowrap cursor-pointer flex items-center gap-2"
            >
              <i className="ri-refresh-line"></i>
              {showLogs ? 'Atualizar' : 'Carregar Logs'}
            </button>
          </div>

          {showLogs && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#9CA3AF] whitespace-nowrap">Data/Hora</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#9CA3AF] whitespace-nowrap">Ação</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#9CA3AF] whitespace-nowrap">Usuário Alvo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#9CA3AF] whitespace-nowrap">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-[#9CA3AF]">
                        <i className="ri-inbox-line text-3xl block mb-2"></i>
                        Nenhum log encontrado
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-[#9CA3AF] text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 bg-[#7C3AED]/20 text-[#7C3AED] rounded-lg text-xs font-medium whitespace-nowrap">
                            {log.action === 'grant_one_month' ? 'Liberou 1 mês'
                              : log.action === 'grant_one_year' ? 'Liberou 12 meses'
                              : log.action === 'grant_lifetime' ? 'Liberou vitalício'
                              : log.action === 'cancel_subscription' ? 'Cancelou assinatura'
                              : log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#9CA3AF] font-mono text-xs">{log.target_user_id.substring(0, 8)}...</td>
                        <td className="py-3 px-4 text-[#9CA3AF] text-xs">
                          {log.details?.expires_at ? `Expira: ${formatDate(log.details.expires_at)}` : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}