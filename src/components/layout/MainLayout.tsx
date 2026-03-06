import { Outlet } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';
import { useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import DailyUpgradeModal from '../modals/DailyUpgradeModal';
import PageTransition from './PageTransition';

const menuItems = [
  { icon: 'ri-dashboard-line', label: 'Visão Geral', path: '/' },
  { icon: 'ri-arrow-up-circle-line', label: 'Receitas', path: '/receitas' },
  { icon: 'ri-arrow-down-circle-line', label: 'Despesas', path: '/despesas' },
  { icon: 'ri-funds-line', label: 'Investimentos', path: '/investimentos' },
  { icon: 'ri-flag-line', label: 'Metas', path: '/planejamento' },
  { icon: 'ri-bar-chart-box-line', label: 'Relatórios', path: '/relatorios' },
  { icon: 'ri-building-line', label: 'Patrimônios', path: '/patrimonios' },
  { icon: 'ri-calculator-line', label: 'Calculadoras', path: '/calculadoras' },
];

interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isTrial, isLifetime, daysRemaining, status, hasAccess } = useSubscription();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDailyUpgrade, setShowDailyUpgrade] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuthContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef<number>(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const PULL_THRESHOLD = 80;

  const isPaidOrLifetime = isLifetime || (hasAccess && !isTrial);

  useEffect(() => {
    if (!profile || status === 'loading') return;
    if (isPaidOrLifetime || !isTrial || daysRemaining === null || daysRemaining <= 0) return;

    const today = new Date().toISOString().split('T')[0];
    const storageKey = `bolsofurado_upgrade_shown_${today}`;
    if (!localStorage.getItem(storageKey)) {
      const timer = setTimeout(() => {
        setShowDailyUpgrade(true);
        localStorage.setItem(storageKey, 'true');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [profile, isTrial, isPaidOrLifetime, daysRemaining, status]);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  // Fecha menu ao trocar de página
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Fecha ao clicar/tocar fora — suporte a mouse e touch
  useEffect(() => {
    if (!menuOpen) return;

    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [menuOpen]);

  // Bloqueia scroll do body quando menu aberto no mobile
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const checkAdminStatus = async () => {
    if (!user) { setIsAdmin(false); return; }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) setIsAdmin(data.is_admin ?? false);
    } catch (err) {
      console.error('Failed to fetch admin status:', err);
      setIsAdmin(false);
    }
  };

  const getFirstName = () => {
    // Usa apenas o campo 'name' que existe no banco de dados
    if (profile?.name && profile.name.trim()) {
      const fn = profile.name.trim().split(/\s+/)[0];
      return fn.charAt(0).toUpperCase() + fn.slice(1).toLowerCase();
    }
    // Fallback: email (apenas se não há nome salvo)
    if (user?.email) {
      const emailPart = user.email.split('@')[0];
      const clean = emailPart.replace(/[0-9._\-+]/g, '');
      if (clean.length >= 2) {
        return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
      }
      return 'Usuário';
    }
    return 'Usuário';
  };

  const handleSignOut = async () => {
    try {
      setMenuOpen(false);
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Sign-out failed:', err);
    }
  };

  const firstName = getFirstName();
  const initials = firstName.charAt(0).toUpperCase();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop = mainRef.current?.scrollTop ?? 0;
    if (scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return;
    const scrollTop = mainRef.current?.scrollTop ?? 0;
    if (scrollTop > 0) { setIsPulling(false); setPullDistance(0); return; }
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, PULL_THRESHOLD + 20));
    }
  }, [isPulling]);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance]);

  const renderStatusBadge = () => {
    if (status === 'loading' || status === 'none') return null;

    if (isLifetime) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium whitespace-nowrap">
          <i className="ri-vip-crown-fill text-xs"></i>
          Vitalício
        </span>
      );
    }

    if (hasAccess && !isTrial) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium whitespace-nowrap">
          <i className="ri-shield-check-line text-xs"></i>
          Pro
        </span>
      );
    }

    if (isTrial && daysRemaining !== null && daysRemaining > 0) {
      return (
        <button
          onClick={() => navigate('/checkout')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-medium whitespace-nowrap hover:bg-[#F59E0B]/20 transition-all cursor-pointer"
          title="Clique para assinar"
        >
          <i className="ri-time-line text-xs"></i>
          Teste · {daysRemaining}d
          <span className="hidden sm:inline text-[#F59E0B]/70 ml-0.5">· Assinar</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => navigate('/checkout')}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium whitespace-nowrap hover:bg-red-500/20 transition-all cursor-pointer"
        title="Reativar plano"
      >
        <i className="ri-error-warning-line text-xs"></i>
        Expirado · Reativar
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#0E0B16] flex flex-col">
      {!isPaidOrLifetime && (
        <DailyUpgradeModal
          isOpen={showDailyUpgrade}
          onClose={() => setShowDailyUpgrade(false)}
          daysRemaining={daysRemaining ?? 0}
        />
      )}

      {/* Top Bar — com suporte a safe area (notch iPhone) */}
      <header
        className="w-full bg-[#16122A] border-b border-white/5 flex items-center justify-between sticky top-0 z-50"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          paddingRight: 'max(16px, env(safe-area-inset-right))',
          paddingBottom: '0',
        }}
      >
        <div className="flex items-center gap-3 py-1">
          <button
            onClick={() => navigate('/')}
            className="cursor-pointer focus:outline-none"
            aria-label="Ir para Visão Geral"
          >
            <img
              src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/d897479ec7a02c7e53f2d5e4c64f1a14.png"
              alt="Bolso Furado"
              className="h-14 w-auto object-contain"
            />
          </button>
        </div>

        <div className="flex items-center gap-2 py-1">
          {renderStatusBadge()}

          {/* Botão hambúrguer */}
          <button
            ref={buttonRef}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-10 h-10 rounded-lg bg-[#7C3AED]/20 hover:bg-[#7C3AED]/40 active:bg-[#7C3AED]/50 flex items-center justify-center cursor-pointer transition-all touch-manipulation"
            title="Menu"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
          >
            <i className={`${menuOpen ? 'ri-close-line' : 'ri-menu-line'} text-[#7C3AED] text-xl`}></i>
          </button>
        </div>
      </header>

      {/* Overlay escuro ao abrir o menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
          onTouchStart={() => setMenuOpen(false)}
        />
      )}

      {/* Menu lateral — drawer fixo vindo da direita */}
      <div
        ref={menuRef}
        className={`
          fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-[#16122A] border-l border-white/10
          shadow-2xl shadow-black/70 z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          ${menuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Cabeçalho do drawer */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
          <span className="text-[#F9FAFB] font-semibold text-base">Menu</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 flex items-center justify-center transition-all touch-manipulation"
            aria-label="Fechar menu"
          >
            <i className="ri-close-line text-[#9CA3AF] text-lg"></i>
          </button>
        </div>

        {/* Info do usuário */}
        <Link
          to="/perfil"
          onClick={() => setMenuOpen(false)}
          className="block px-4 py-4 border-b border-white/5 bg-gradient-to-br from-[#7C3AED]/10 to-[#EC4899]/5 hover:from-[#7C3AED]/20 hover:to-[#EC4899]/10 active:from-[#7C3AED]/25 transition-all cursor-pointer touch-manipulation"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#EC4899] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-sm font-bold">{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#F9FAFB] truncate">{firstName}</p>
              <p className="text-xs text-[#9CA3AF] truncate">{user?.email ?? ''}</p>
            </div>
            <i className="ri-edit-line text-[#7C3AED] text-sm flex-shrink-0"></i>
          </div>
        </Link>

        {/* Itens de navegação — scrollável se necessário */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer touch-manipulation ${
                  isActive
                    ? 'bg-gradient-to-r from-[#7C3AED]/25 to-[#EC4899]/15 text-[#F9FAFB]'
                    : 'text-[#9CA3AF] hover:bg-white/5 active:bg-white/10 hover:text-[#F9FAFB]'
                }`}
              >
                <i className={`${item.icon} text-lg w-5 h-5 flex items-center justify-center flex-shrink-0 ${isActive ? 'text-[#7C3AED]' : ''}`}></i>
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && <i className="ri-arrow-right-s-line ml-auto text-[#7C3AED]"></i>}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer touch-manipulation ${
                location.pathname === '/admin'
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-[#F9FAFB]'
                  : 'text-amber-400 hover:bg-amber-500/10 active:bg-amber-500/15 hover:text-amber-300'
              }`}
            >
              <i className="ri-shield-star-line text-lg w-5 h-5 flex items-center justify-center flex-shrink-0"></i>
              <span className="text-sm font-medium">Admin</span>
              {location.pathname === '/admin' && <i className="ri-arrow-right-s-line ml-auto text-amber-400"></i>}
            </Link>
          )}
        </nav>

        {/* Sair */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#EF4444] hover:bg-[#EF4444]/10 active:bg-[#EF4444]/15 transition-all cursor-pointer touch-manipulation"
          >
            <i className="ri-logout-box-r-line text-lg w-5 h-5 flex items-center justify-center flex-shrink-0"></i>
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </div>

      {/* Indicador de Pull-to-Refresh */}
      <div
        className="fixed left-0 right-0 flex items-center justify-center z-30 pointer-events-none transition-all duration-200"
        style={{
          top: `calc(env(safe-area-inset-top) + 56px)`,
          height: `${pullDistance}px`,
          overflow: 'hidden',
        }}
      >
        <div
          className="flex flex-col items-center justify-center gap-1 transition-all duration-200"
          style={{ opacity: pullDistance > 20 ? Math.min((pullDistance - 20) / 40, 1) : 0 }}
        >
          {isRefreshing ? (
            <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
          ) : (
            <div
              className="w-8 h-8 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center transition-transform duration-200"
              style={{ transform: `rotate(${Math.min(pullDistance / PULL_THRESHOLD, 1) * 180}deg)` }}
            >
              <i className="ri-refresh-line text-[#7C3AED] text-base"></i>
            </div>
          )}
          <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap">
            {isRefreshing ? 'Atualizando...' : pullDistance >= PULL_THRESHOLD ? 'Solte para atualizar' : 'Puxe para atualizar'}
          </span>
        </div>
      </div>

      {/* Conteúdo da página */}
      <main
        ref={mainRef}
        className="flex-1 bg-[#0E0B16] overflow-y-auto"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.3s ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <PageTransition>
          {children ?? <Outlet />}
        </PageTransition>
      </main>
    </div>
  );
}

export default MainLayout;
