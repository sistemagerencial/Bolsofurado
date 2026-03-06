
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { SubscriptionGate } from '../subscription/SubscriptionGate';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading, profile } = useAuthContext();
  const { hasAccess, loading: subLoading, status } = useSubscription();
  const location = useLocation();

  // Timeout extra de segurança: após 8s, força saída do loading
  const [forceReady, setForceReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceReady(true), 8000);
    return () => clearTimeout(t);
  }, []);

  const isCheckoutRoute = location.pathname.startsWith('/checkout');

  // Ainda carregando auth ou assinatura (mas respeita o timeout de segurança)
  const isLoading = (authLoading || subLoading) && !forceReady;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0E0B16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#9CA3AF] text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Só redireciona para checkout se o status for EXPLICITAMENTE 'expired'
  // Nunca bloqueia durante trial, loading, ou quando o perfil ainda não carregou
  const isDefinitelyExpired =
    status === 'expired' &&
    !hasAccess &&
    !profile?.is_lifetime &&
    !profile?.is_admin_override &&
    profile !== null; // garante que o perfil já foi carregado

  if (!isCheckoutRoute && isDefinitelyExpired) {
    return <Navigate to="/checkout?reason=expired" replace />;
  }

  // Mostra o gate de assinatura APENAS se:
  // - status é explicitamente 'expired'
  // - perfil já foi carregado (não é null)
  // - não está no checkout
  if (
    !isCheckoutRoute &&
    status === 'expired' &&
    !hasAccess &&
    profile !== null
  ) {
    return <SubscriptionGate />;
  }

  // Em qualquer dúvida (trial, active, loading, perfil null), libera o acesso
  return <>{children}</>;
}
