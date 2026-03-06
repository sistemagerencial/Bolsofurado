
import { useAuthContext } from '../contexts/AuthContext';

interface SubscriptionData {
  hasAccess: boolean;
  status: string;
  expiresAt: string | null;
  daysRemaining: number | null;
  daysUntilExpiry: number | null;
  isExpiringSoon: boolean;
  planType: string;
  isLifetime: boolean;
  isTrial: boolean;
  loading: boolean;
  isRecurring: boolean;
  preapprovalId: string | null;
  subscriptionId: string | null;
  nextPaymentDate: string | null;
}

export function useSubscription(): SubscriptionData {
  const { profile, loading } = useAuthContext();

  // Enquanto carrega, não bloquear acesso
  if (loading) {
    return {
      hasAccess: false,
      status: 'loading',
      expiresAt: null,
      daysRemaining: null,
      daysUntilExpiry: null,
      isExpiringSoon: false,
      planType: 'free',
      isLifetime: false,
      isTrial: false,
      loading: true,
      isRecurring: false,
      preapprovalId: null,
      subscriptionId: null,
      nextPaymentDate: null,
    };
  }

  // Perfil ainda não carregou — libera acesso por segurança
  if (!profile) {
    return {
      hasAccess: false,
      status: 'none',
      expiresAt: null,
      daysRemaining: null,
      daysUntilExpiry: null,
      isExpiringSoon: false,
      planType: 'free',
      isLifetime: false,
      isTrial: false,
      loading: false,
      isRecurring: false,
      preapprovalId: null,
      subscriptionId: null,
      nextPaymentDate: null,
    };
  }

  // Acesso vitalício ou override de admin
  if (profile.is_lifetime || profile.is_admin_override) {
    return {
      hasAccess: true,
      status: profile.subscription_status,
      expiresAt: profile.subscription_expires_at,
      daysRemaining: null,
      daysUntilExpiry: null,
      isExpiringSoon: false,
      planType: profile.plan_type,
      isLifetime: profile.is_lifetime,
      isTrial: false,
      loading: false,
      isRecurring: false,
      preapprovalId: null,
      subscriptionId: null,
      nextPaymentDate: null,
    };
  }

  const now = new Date();
  const isTrial = profile.subscription_status === 'trial';
  const isRecurring = !!(profile as any).preapproval_id;

  // ─── Calcular data de expiração correta ───────────────────────────────────
  let expiresAt: Date | null = null;

  if (isTrial) {
    if (profile.trial_end_date) {
      expiresAt = new Date(profile.trial_end_date);
    } else if (profile.trial_start_date) {
      expiresAt = new Date(profile.trial_start_date);
      expiresAt.setDate(expiresAt.getDate() + 30);
    } else if (profile.created_at) {
      expiresAt = new Date(profile.created_at);
      expiresAt.setDate(expiresAt.getDate() + 30);
    }
  } else if (profile.subscription_status === 'active') {
    if (profile.subscription_expires_at) {
      expiresAt = new Date(profile.subscription_expires_at);
    } else if (profile.plan_type === 'monthly' && profile.created_at) {
      expiresAt = new Date(profile.created_at);
      expiresAt.setDate(expiresAt.getDate() + 30);
    } else if (profile.plan_type === 'yearly' && profile.created_at) {
      expiresAt = new Date(profile.created_at);
      expiresAt.setDate(expiresAt.getDate() + 365);
    }
  } else if (profile.subscription_expires_at) {
    expiresAt = new Date(profile.subscription_expires_at);
  }

  // ─── Calcular dias restantes ──────────────────────────────────────────────
  let daysRemaining: number | null = null;
  let daysUntilExpiry: number | null = null;
  if (expiresAt) {
    const diffTime = expiresAt.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    daysUntilExpiry = daysRemaining;
  }

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 7;

  // ─── Verificar acesso ─────────────────────────────────────────────────────
  let hasAccess = false;

  if (expiresAt) {
    hasAccess = now < expiresAt;
  } else if (isTrial) {
    // Trial sem nenhuma data: conceder acesso (dados incompletos, não punir o usuário)
    hasAccess = true;
  }

  // ─── Determinar status final ──────────────────────────────────────────────
  // Só marca como 'expired' se realmente não tem acesso E o status do banco
  // também indica expiração. Nunca marca 'expired' durante trial ativo.
  let finalStatus = profile.subscription_status;
  if (!hasAccess && profile.subscription_status !== 'trial') {
    finalStatus = 'expired';
  } else if (hasAccess && profile.subscription_status === 'trial') {
    finalStatus = 'trial'; // trial ativo — nunca 'expired'
  }

  return {
    hasAccess,
    status: finalStatus,
    expiresAt: expiresAt ? expiresAt.toISOString() : (profile.subscription_expires_at || profile.trial_end_date),
    daysRemaining,
    daysUntilExpiry,
    isExpiringSoon,
    planType: profile.plan_type,
    isLifetime: profile.is_lifetime,
    isTrial,
    loading: false,
    isRecurring,
    preapprovalId: (profile as any).preapproval_id || null,
    subscriptionId: (profile as any).subscription_id || null,
    nextPaymentDate: profile.subscription_expires_at,
  };
}
