
import { Link, useLocation } from 'react-router-dom';
import { useState, createContext, useContext, ReactNode } from 'react';

// Contexto para compartilhar estado da sidebar
interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

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

export default function Sidebar() {
  const location = useLocation();
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar();

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-screen bg-[#16122A] border-r border-white/5 flex flex-col z-50 overflow-hidden
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64' : 'w-0 lg:w-20'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        
        {/* Logo */}
        <div className={`p-4 border-b border-white/5 bg-gradient-to-br from-[#7C3AED]/20 via-[#EC4899]/10 to-[#7C3AED]/20 transition-all duration-300 ${
          isOpen ? '' : 'lg:p-2'
        }`}>
          <div className="flex items-center justify-center">
            <img 
              src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/329df8a96fbfb4f61300025c05375e5e.png" 
              alt="Logo" 
              className={`object-contain transition-all duration-300 ${
                isOpen ? 'w-24 h-24' : 'lg:w-12 lg:h-12'
              }`}
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                className={`flex items-center rounded-lg transition-all duration-200 cursor-pointer ${
                  isOpen ? 'gap-3 px-3 py-2.5' : 'lg:justify-center lg:px-2 lg:py-2.5'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-[#7C3AED]/20 to-[#EC4899]/20 text-[#F9FAFB] shadow-lg shadow-[#7C3AED]/20'
                    : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'
                }`}
                title={!isOpen ? item.label : undefined}
              >
                <i className={`${item.icon} text-lg w-5 h-5 flex items-center justify-center flex-shrink-0`}></i>
                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Perfil do Usuário */}
        <div className="p-3 border-t border-white/5">
          <div className={`flex items-center rounded-lg transition-all duration-300 ${
            isOpen ? 'gap-3 px-3 py-2' : 'lg:justify-center lg:px-2 lg:py-2'
          }`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#EC4899] flex items-center justify-center flex-shrink-0">
              <i className="ri-user-line text-white text-base"></i>
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-300 ${
              isOpen ? 'opacity-100' : 'opacity-0 hidden lg:hidden'
            }`}>
              <p className="text-sm font-medium text-[#F9FAFB] truncate">Executivo</p>
              <p className="text-xs text-[#9CA3AF] truncate">Administrador</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Botão hambúrguer - SEMPRE VISÍVEL */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 right-4 w-12 h-12 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] rounded-lg flex items-center justify-center cursor-pointer hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all shadow-lg z-[60]"
      >
        <i className="ri-menu-line text-white text-xl"></i>
      </button>
    </>
  );
}
