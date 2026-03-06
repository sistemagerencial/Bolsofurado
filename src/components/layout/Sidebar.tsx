
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../logo/Logo';
import { ThemeToggle } from '../theme/ThemeToggle';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, signOut, profile } = useAuth();

  const menuItems = [
    { path: '/home', label: 'Dashboard', icon: 'ri-dashboard-line' },
    { path: '/despesas', label: 'Despesas', icon: 'ri-shopping-cart-line' },
    { path: '/receitas', label: 'Receitas', icon: 'ri-money-dollar-circle-line' },
    { path: '/investimentos', label: 'Investimentos', icon: 'ri-line-chart-line' },
    { path: '/patrimonios', label: 'Patrimônios', icon: 'ri-home-line' },
    { path: '/planejamento', label: 'Planejamento', icon: 'ri-calendar-check-line' },
    { path: '/calculadoras', label: 'Calculadoras', icon: 'ri-calculator-line' },
    { path: '/relatorios', label: 'Relatórios', icon: 'ri-file-chart-line' },
    { path: '/perfil', label: 'Perfil', icon: 'ri-user-line' },
  ];

  const handleSignOut = () => {
    signOut();
  };

  const getDisplayName = (profile: any, user: any) => {
    if (profile?.nome) {
      return profile.nome.split(' ')[0];
    }
    if (profile?.name) {
      return profile.name.split(' ')[0];
    }
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      const cleanName = emailName.replace(/[0-9._]/g, '');
      return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
    }
    return 'Usuário';
  };

  const isPro = profile?.subscription_status === 'active' || 
               profile?.subscription_status === 'authorized' || 
               profile?.is_lifetime || 
               profile?.is_admin_override;

  return (
    <div className={`
      bg-card border-r border-border h-screen flex flex-col transition-all duration-300 theme-transition
      ${collapsed ? 'w-20' : 'w-64'}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Logo 
            width={collapsed ? 40 : 180}
            height={collapsed ? 40 : 60}
            showText={!collapsed}
            className="transition-all duration-300"
          />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <i className={`ri-${collapsed ? 'menu-unfold' : 'menu-fold'}-line text-foreground`}></i>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isAssinatura = item.path === '/assinatura';
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                ${isActive 
                  ? 'nav-active shadow-lg' 
                  : 'nav-hover text-muted-foreground'
                }
              `}
            >
              <i className={`${item.icon} text-lg flex-shrink-0`}></i>
              
              {!collapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium whitespace-nowrap">{item.label}</span>
                  {isAssinatura && isPro && (
                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                      PRO
                    </span>
                  )}
                </div>
              )}
              
              {collapsed && isAssinatura && isPro && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </Link>
          );
        })}

        {!isPro && (
          <Link
            to="/assinatura"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 mt-4"
          >
            <i className="ri-vip-crown-line text-lg flex-shrink-0"></i>
            {!collapsed && <span className="font-medium whitespace-nowrap">Assinar agora</span>}
          </Link>
        )}
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t border-border">
        <ThemeToggle 
          className="w-full justify-start" 
          showLabel={!collapsed}
        />
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                getDisplayName(profile, user)?.[0]?.toUpperCase()
              )}
            </div>
            {collapsed && isPro && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                <i className="ri-vip-crown-fill text-white text-xs"></i>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground truncate">
                  Olá, {getDisplayName(profile, user)}
                </p>
                {isPro && (
                  <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <i className="ri-vip-crown-fill"></i>
                    PRO
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            title="Sair"
          >
            <i className="ri-logout-circle-line text-lg text-muted-foreground"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
