import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuthContext } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';

interface PaymentRecord {
  id: string;
  plan_type: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  description: string | null;
  paid_at: string;
  external_reference: string | null;
  payment_id: string | null;
  is_recurring?: boolean;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: 'Aprovado', color: '#10B981', bg: '#10B981' },
  pending: { label: 'Pendente', color: '#FACC15', bg: '#FACC15' },
  rejected: { label: 'Recusado', color: '#EF4444', bg: '#EF4444' },
  cancelled: { label: 'Cancelado', color: '#9CA3AF', bg: '#9CA3AF' },
  refunded: { label: 'Reembolsado', color: '#7C3AED', bg: '#7C3AED' },
  authorized: { label: 'Autorizado', color: '#10B981', bg: '#10B981' },
  paused: { label: 'Pausado', color: '#FACC15', bg: '#FACC15' },
};

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Plano Mensal',
  annual: 'Plano Anual',
  yearly: 'Plano Anual',
  lifetime: 'Plano Vitalício',
  free: 'Plano Gratuito',
  trial: 'Período de Teste',
};

export default function AssinaturaPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthContext();
  const subscription = useSubscription();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (user) fetchPayments();
  }, [user]);

  const fetchPayments = async () => {
    if (!user) return;
    setLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('paid_at', { ascending: false });
      if (!error && data) setPayments(data);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription.preapprovalId) return;
    
    setCancellingSubscription(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/create-subscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'cancel',
            preapproval_id: subscription.preapprovalId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao cancelar assinatura');
      }

      // Atualizar perfil localmente
      await supabase.auth.refreshSession();
      setShowCancelConfirm(false);
      
      alert('Assinatura cancelada com sucesso! Você continuará tendo acesso até o fim do período já pago.');
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      alert('Erro ao cancelar assinatura. Tente novamente.');
    } finally {
      setCancellingSubscription(false);
    }
  };

  const getPlanInfo = () => {
    if (profile?.is_lifetime) return { label: 'Vitalício', color: '#FACC15', icon: 'ri-infinity-line' };
    if (profile?.is_admin_override) return { label: 'Admin', color: '#FACC15', icon: 'ri-shield-star-line' };
    const s = profile?.subscription_status;
    if (s === 'active' || s === 'authorized') {
      return profile?.plan_type === 'annual'
        ? { label: 'Pro Anual', color: '#10B981', icon: 'ri-vip-crown-line' }
        : { label: 'Pro Mensal', color: '#10B981', icon: 'ri-vip-crown-line' };
    }
    if (s === 'paused') return { label: 'Pausado', color: '#FACC15', icon: 'ri-pause-circle-line' };
    if (s === 'cancelled') return { label: 'Cancelado', color: '#EF4444', icon: 'ri-close-circle-line' };
    if (s === 'trial') return { label: 'Trial Gratuito', color: '#7C3AED', icon: 'ri-time-line' };
    return { label: 'Expirado', color: '#EF4444', icon: 'ri-close-circle-line' };
  };

  const planInfo = getPlanInfo();

  const getExpiryDate = () => {
    if (profile?.is_lifetime || profile?.is_admin_override) return null;
    if (profile?.subscription_status === 'trial' && profile?.trial_end_date) {
      return new Date(profile.trial_end_date);
    }
    if (profile?.subscription_expires_at) {
      return new Date(profile.subscription_expires_at);
    }
    return null;
  };

  const expiryDate = getExpiryDate();
  const isExpired = expiryDate ? new Date() > expiryDate : false;
  const daysLeft = expiryDate
    ? Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getStatusInfo = (status: string) =>
    STATUS_LABELS[status] ?? { label: status, color: '#9CA3AF', bg: '#9CA3AF' };

  const isTrial = profile?.subscription_status === 'trial';
  const isActive = profile?.subscription_status === 'active' || profile?.subscription_status === 'authorized';
  const isLifetime = profile?.is_lifetime || profile?.is_admin_override;
  const isCancelled = profile?.subscription_status === 'cancelled';
  const isPaused = profile?.subscription_status === 'paused';

  // Separar pagamentos recorrentes e avulsos
  const recurringPayments = payments.filter(p => p.is_recurring);
  const oneTimePayments = payments.filter(p => !p.is_recurring);

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 w-full max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/', { replace: true })}
            className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors cursor-pointer mb-4 text-sm"
          >
            <i className="ri-arrow-left-line"></i>
            Voltar
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F9FAFB]">Minha Assinatura</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Gerencie seu plano e veja o histórico de pagamentos</p>
        </div>

        {/* Card do plano atual */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#7C3AED]/20 via-[#16122A] to-[#EC4899]/10 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#7C3AED]/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Ícone do plano */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${planInfo.color}20`, border: `1.5px solid ${planInfo.color}40` }}
            >
              <i className={`${planInfo.icon} text-2xl`} style={{ color: planInfo.color }}></i>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${planInfo.color}20`, color: planInfo.color }}
                >
                  {planInfo.label}
                </span>
                {isActive && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981]">
                    Ativo
                  </span>
                )}
                {subscription.isRecurring && !isCancelled && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED]">
                    <i className="ri-repeat-line mr-1"></i>
                    Renovação Automática
                  </span>
                )}
                {isCancelled && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444]">
                    Cancelado
                  </span>
                )}
                {isPaused && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#FACC15]/10 text-[#FACC15]">
                    Pausado
                  </span>
                )}
                {isExpired && !isLifetime && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444]">
                    Expirado
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-[#F9FAFB]">
                {isLifetime ? 'Acesso Vitalício' : isActive ? 'Plano Pro Ativo' : isTrial ? 'Período de Teste' : isCancelled ? 'Assinatura Cancelada' : 'Plano Expirado'}
              </h2>
              <p className="text-sm text-[#9CA3AF] mt-0.5">
                {isLifetime
                  ? 'Você tem acesso completo para sempre'
                  : subscription.isRecurring && !isCancelled
                  ? `Renovação automática ${profile?.plan_type === 'annual' ? 'anual' : 'mensal'} ativa`
                  : isActive
                  ? `Plano ${profile?.plan_type === 'annual' ? 'anual' : 'mensal'} ativo`
                  : isCancelled
                  ? 'Você continuará tendo acesso até o fim do período pago'
                  : isTrial
                  ? 'Experimente todos os recursos gratuitamente'
                  : 'Renove seu plano para continuar usando'}
              </p>
            </div>

            {/* Botão de upgrade/cancelar/continuar com teste grátis */}
            {!isLifetime && (
              <>
                {subscription.isRecurring && !isCancelled && isActive ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#F9FAFB] text-sm font-semibold transition-all cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-close-circle-line mr-1.5"></i>
                    Cancelar Renovação
                  </button>
                ) : isTrial ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => navigate('/', { replace: true })}
                      className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#F9FAFB] text-sm font-semibold transition-all cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-arrow-right-line mr-1.5"></i>
                      Continuar com Teste Grátis
                    </button>
                    <button
                      onClick={() => navigate('/checkout')}
                      className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-[#7C3AED]/20"
                    >
                      <i className="ri-vip-crown-line mr-1.5"></i>
                      Assinar Pro
                    </button>
                  </div>
                ) : (isExpired || !isActive || isCancelled) && (
                  <button
                    onClick={() => navigate('/checkout')}
                    className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-[#7C3AED]/20"
                  >
                    <i className="ri-vip-crown-line mr-1.5"></i>
                    {isExpired || isCancelled ? 'Renovar Plano' : 'Assinar Pro'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Informações de renovação automática */}
          {subscription.isRecurring && !isCancelled && subscription.nextPaymentDate && (
            <div className="relative mt-5 pt-5 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center">
                    <i className="ri-calendar-check-line text-[#7C3AED] text-sm"></i>
                  </div>
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Próxima cobrança automática</p>
                    <p className="text-sm font-semibold text-[#F9FAFB]">
                      {formatDate(subscription.nextPaymentDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#9CA3AF]">Valor</p>
                  <p className="text-sm font-bold text-[#F9FAFB]">
                    {profile?.plan_type === 'annual' ? 'R$ 199,00' : 'R$ 19,90'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Barra de progresso do trial / vencimento */}
          {!isLifetime && expiryDate && !subscription.isRecurring && (
            <div className="relative mt-5 pt-5 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#9CA3AF]">
                  {isTrial ? 'Período de teste' : 'Validade do plano'}
                </span>
                <span className={`text-xs font-semibold ${isExpired ? 'text-[#EF4444]' : daysLeft !== null && daysLeft <= 7 ? 'text-[#FACC15]' : 'text-[#10B981]'}`}>
                  {isExpired
                    ? 'Expirado'
                    : daysLeft === 0
                    ? 'Expira hoje'
                    : `${daysLeft} dia${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`}
                </span>
              </div>

              {/* Datas */}
              <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-2">
                <span>
                  {isTrial && profile?.trial_start_date
                    ? formatDate(profile.trial_start_date)
                    : profile?.subscription_expires_at
                    ? 'Início'
                    : ''}
                </span>
                <span className="font-medium text-[#F9FAFB]">
                  Vence em {formatDate(expiryDate.toISOString())}
                </span>
              </div>

              {/* Barra */}
              {isTrial && profile?.trial_start_date && profile?.trial_end_date && (() => {
                const start = new Date(profile.trial_start_date).getTime();
                const end = new Date(profile.trial_end_date).getTime();
                const now = Date.now();
                const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
                return (
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: progress > 85 ? '#EF4444' : progress > 60 ? '#FACC15' : 'linear-gradient(90deg, #7C3AED, #EC4899)',
                      }}
                    ></div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Status */}
          <div className="bg-[#16122A] border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center">
                <i className="ri-shield-check-line text-[#7C3AED] text-base"></i>
              </div>
              <span className="text-xs text-[#9CA3AF] font-medium">Status</span>
            </div>
            <p className="text-lg font-bold" style={{ color: planInfo.color }}>{planInfo.label}</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              {isLifetime ? 'Permanente' : subscription.isRecurring && !isCancelled ? 'Renovação automática' : isActive ? 'Com renovação manual' : isTrial ? 'Gratuito' : 'Inativo'}
            </p>
          </div>

          {/* Vencimento */}
          <div className="bg-[#16122A] border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#EC4899]/10 flex items-center justify-center">
                <i className="ri-calendar-event-line text-[#EC4899] text-base"></i>
              </div>
              <span className="text-xs text-[#9CA3AF] font-medium">
                {subscription.isRecurring && !isCancelled ? 'Próxima Cobrança' : 'Vencimento'}
              </span>
            </div>
            <p className="text-lg font-bold text-[#F9FAFB]">
              {isLifetime ? '∞ Vitalício' : expiryDate ? formatDate(expiryDate.toISOString()) : '—'}
            </p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              {isLifetime ? 'Sem expiração' : subscription.isRecurring && !isCancelled ? 'Renovação automática' : expiryDate ? (isExpired ? 'Já expirou' : `${daysLeft} dias restantes`) : 'Sem data definida'}
            </p>
          </div>

          {/* Total pago */}
          <div className="bg-[#16122A] border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-[#10B981] text-base"></i>
              </div>
              <span className="text-xs text-[#9CA3AF] font-medium">Total Investido</span>
            </div>
            <p className="text-lg font-bold text-[#F9FAFB]">
              {formatCurrency(payments.filter(p => p.status === 'approved').reduce((acc, p) => acc + p.amount, 0))}
            </p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              {payments.filter(p => p.status === 'approved').length} pagamento{payments.filter(p => p.status === 'approved').length !== 1 ? 's' : ''} aprovado{payments.filter(p => p.status === 'approved').length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Planos disponíveis (se não for ativo/vitalício) */}
        {!isLifetime && !isActive && (
          <div className="bg-[#16122A] border border-white/5 rounded-2xl p-6 mb-6">
            <h3 className="text-base font-bold text-[#F9FAFB] mb-1">Escolha um Plano</h3>
            <p className="text-sm text-[#9CA3AF] mb-5">Desbloqueie todos os recursos do Bolso Furado</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  id: 'monthly',
                  label: 'Mensal',
                  price: 'R$ 19,90',
                  period: '/mês',
                  highlight: false,
                  badge: null,
                  features: ['Todos os recursos', 'Suporte incluído', 'Cancele quando quiser'],
                },
                {
                  id: 'yearly',
                  label: 'Anual',
                  price: 'R$ 199,00',
                  period: '/ano',
                  highlight: true,
                  badge: '2 meses grátis',
                  features: ['Todos os recursos', 'Suporte prioritário', 'Economize R$ 39,80'],
                },
              ].map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-xl p-5 border transition-all ${
                    plan.highlight
                      ? 'border-[#7C3AED]/50 bg-gradient-to-br from-[#7C3AED]/10 to-[#EC4899]/5'
                      : 'border-white/5 bg-[#0E0B16]'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 right-4 text-xs font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white whitespace-nowrap">
                      {plan.badge}
                    </span>
                  )}
                  <p className="text-xs text-[#9CA3AF] font-medium mb-1">{plan.label}</p>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-bold text-[#F9FAFB]">{plan.price}</span>
                    <span className="text-sm text-[#9CA3AF]">{plan.period}</span>
                  </div>
                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                        <i className="ri-check-line text-[#10B981] text-sm w-4 h-4 flex items-center justify-center"></i>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate(`/checkout?plan=${plan.id}`)}
                    className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      plan.highlight
                        ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white shadow-lg shadow-[#7C3AED]/20'
                        : 'bg-white/5 hover:bg-white/10 text-[#F9FAFB]'
                    }`}
                  >
                    Assinar {plan.label}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico de cobranças recorrentes */}
        {recurringPayments.length > 0 && (
          <div className="bg-[#16122A] border border-white/5 rounded-2xl overflow-hidden mb-6">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div>
                <h3 className="text-base font-bold text-[#F9FAFB]">Cobranças Recorrentes</h3>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Histórico de renovações automáticas</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED]">
                  <i className="ri-repeat-line mr-1"></i>
                  {recurringPayments.length} cobrança{recurringPayments.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {recurringPayments.map((payment) => {
                const statusInfo = getStatusInfo(payment.status);
                return (
                  <div key={payment.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/2 transition-colors">
                    {/* Ícone */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${statusInfo.color}15` }}
                    >
                      <i className="ri-repeat-line text-lg" style={{ color: statusInfo.color }}></i>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#F9FAFB] truncate">
                        {payment.description || 'Renovação Automática'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-[#9CA3AF]">{formatDate(payment.paid_at)}</span>
                        {payment.payment_method && (
                          <>
                            <span className="text-[#374151] text-xs">·</span>
                            <span className="text-xs text-[#9CA3AF] capitalize">{payment.payment_method}</span>
                          </>
                        )}
                        {payment.payment_id && (
                          <>
                            <span className="text-[#374151] text-xs">·</span>
                            <span className="text-xs text-[#6B7280] font-mono">#{payment.payment_id.slice(-8)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Valor + status */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-sm font-bold text-[#F9FAFB]">
                        {formatCurrency(payment.amount)}
                      </span>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${statusInfo.color}15`, color: statusInfo.color }}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Histórico de pagamentos avulsos */}
        <div className="bg-[#16122A] border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div>
              <h3 className="text-base font-bold text-[#F9FAFB]">
                {recurringPayments.length > 0 ? 'Pagamentos Avulsos' : 'Histórico de Pagamentos'}
              </h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                {recurringPayments.length > 0 ? 'Pagamentos únicos realizados' : 'Todos os seus pagamentos registrados'}
              </p>
            </div>
            <button
              onClick={fetchPayments}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
              title="Atualizar"
            >
              <i className="ri-refresh-line text-[#9CA3AF] text-base"></i>
            </button>
          </div>

          {loadingPayments ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin"></div>
                <p className="text-sm text-[#9CA3AF]">Carregando histórico...</p>
              </div>
            </div>
          ) : oneTimePayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center mb-4">
                <i className="ri-receipt-line text-[#7C3AED] text-2xl"></i>
              </div>
              <p className="text-[#F9FAFB] font-semibold mb-1">Nenhum pagamento encontrado</p>
              <p className="text-sm text-[#9CA3AF] max-w-xs">
                {recurringPayments.length > 0 
                  ? 'Você não possui pagamentos avulsos, apenas renovações automáticas.'
                  : 'Seus pagamentos aparecerão aqui após a primeira assinatura.'}
              </p>
              {!isLifetime && !isActive && (
                <button
                  onClick={() => navigate('/checkout')}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-[#7C3AED]/20"
                >
                  <i className="ri-vip-crown-line mr-1.5"></i>
                  Assinar agora
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {oneTimePayments.map((payment) => {
                const statusInfo = getStatusInfo(payment.status);
                return (
                  <div key={payment.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/2 transition-colors">
                    {/* Ícone */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${statusInfo.color}15` }}
                    >
                      <i
                        className={`text-lg ${
                          payment.status === 'approved'
                            ? 'ri-checkbox-circle-line'
                            : payment.status === 'pending'
                            ? 'ri-time-line'
                            : payment.status === 'refunded'
                            ? 'ri-refund-2-line'
                            : 'ri-close-circle-line'
                        }`}
                        style={{ color: statusInfo.color }}
                      ></i>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#F9FAFB] truncate">
                        {payment.description || PLAN_LABELS[payment.plan_type] || payment.plan_type}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-[#9CA3AF]">{formatDate(payment.paid_at)}</span>
                        {payment.payment_method && (
                          <>
                            <span className="text-[#374151] text-xs">·</span>
                            <span className="text-xs text-[#9CA3AF] capitalize">{payment.payment_method}</span>
                          </>
                        )}
                        {payment.payment_id && (
                          <>
                            <span className="text-[#374151] text-xs">·</span>
                            <span className="text-xs text-[#6B7280] font-mono">#{payment.payment_id.slice(-8)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Valor + status */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-sm font-bold text-[#F9FAFB]">
                        {formatCurrency(payment.amount)}
                      </span>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${statusInfo.color}15`, color: statusInfo.color }}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Suporte */}
        <div className="mt-6 bg-[#16122A] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0">
            <i className="ri-customer-service-2-line text-[#7C3AED] text-lg"></i>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#F9FAFB]">Precisa de ajuda?</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Em caso de dúvidas sobre cobranças ou cancelamentos, entre em contato com o suporte:{' '}
              <a href="mailto:epicsistemas10@gmail.com" className="text-[#7C3AED] hover:underline cursor-pointer">
                epicsistemas10@gmail.com
              </a>
            </p>
          </div>
        </div>

      </div>

      {/* Modal de confirmação de cancelamento */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16122A] border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#EF4444]/10 flex items-center justify-center">
                <i className="ri-error-warning-line text-[#EF4444] text-2xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F9FAFB]">Cancelar Renovação Automática?</h3>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <div className="bg-[#0E0B16] border border-white/5 rounded-xl p-4 mb-5">
              <p className="text-sm text-[#9CA3AF] mb-3">
                Ao cancelar a renovação automática:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-xs text-[#9CA3AF]">
                  <i className="ri-check-line text-[#10B981] text-sm mt-0.5"></i>
                  <span>Você continuará tendo acesso até <strong className="text-[#F9FAFB]">{subscription.nextPaymentDate ? formatDate(subscription.nextPaymentDate) : 'o fim do período'}</strong></span>
                </li>
                <li className="flex items-start gap-2 text-xs text-[#9CA3AF]">
                  <i className="ri-close-line text-[#EF4444] text-sm mt-0.5"></i>
                  <span>Não haverá mais cobranças automáticas no seu cartão</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-[#9CA3AF]">
                  <i className="ri-information-line text-[#FACC15] text-sm mt-0.5"></i>
                  <span>Você poderá assinar novamente quando quiser</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancellingSubscription}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#F9FAFB] text-sm font-semibold transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Manter Assinatura
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancellingSubscription}
                className="flex-1 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm font-semibold transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {cancellingSubscription ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Cancelando...
                  </>
                ) : (
                  <>
                    <i className="ri-close-circle-line"></i>
                    Confirmar Cancelamento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}