
import { Link, useLocation } from 'react-router-dom';
import { useState, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthProvider';

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

  // Handle navigation clicks: on mobile close the sidebar; on desktop do not change isOpen
  const handleNavClick = (path: string) => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
    // do not toggle or expand sidebar on desktop when clicking icons
  };

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
          ${isOpen ? 'w-56' : 'w-0 lg:w-20'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        
        {/* Logo */}
        <div className={`relative p-4 border-b border-white/5 bg-gradient-to-br from-[#7C3AED]/20 via-[#EC4899]/10 to-[#7C3AED]/20 transition-all duration-300 ${
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

          {/* Desktop small hamburger placed above the logo */}
          <button
            onClick={toggleSidebar}
            aria-label="Abrir/fechar menu"
            className={`hidden lg:inline-flex absolute left-1/2 -translate-x-1/2 -top-3 w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full items-center justify-center transition-all shadow z-50`}
          >
            <i className="ri-menu-line text-white text-sm"></i>
          </button>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => handleNavClick(item.path)}
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
                <span
                  className={
                    isOpen
                      ? 'text-sm font-medium whitespace-nowrap transition-all duration-300 opacity-100 w-auto'
                      : 'text-sm font-medium whitespace-nowrap transition-all duration-300 opacity-0 w-0 overflow-hidden'
                  }
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Perfil do Usuário */}
        <UserProfile isOpen={isOpen} />
      </aside>

      

      {/* Mobile hamburger - visible on small screens (right side) */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
        className="lg:hidden fixed top-4 right-4 w-12 h-12 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] rounded-lg flex items-center justify-center cursor-pointer hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all shadow-lg z-[60]"
        aria-label="Abrir menu"
      >
        <i className="ri-menu-line text-white text-xl"></i>
      </button>
    </>
  );
}

function UserProfile({ isOpen }: { isOpen: boolean }) {
  const { user, signOut, updateProfile, updatePassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : 'Usuário');
  const firstName = String(displayName).split(' ')[0];
  const avatarUrl = user?.user_metadata?.avatar_url || null;

  const openEditor = () => {
    setName(displayName);
    setAvatar(avatarUrl || '');
    setOpen(true);
  };

  async function handleSaveProfile() {
    // validação local
    if (!name || !name.trim()) {
      setMsg('Favor insira o nome do usuário');
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await updateProfile({ full_name: name, avatar_url: avatar });
      if (res.error) setMsg('Erro ao atualizar perfil');
      else setMsg('Perfil atualizado');
    } catch (e) {
      setMsg('Erro');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    if (!newPassword || !newPassword.trim()) {
      setMsg('Favor insira a senha');
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await updatePassword(newPassword);
      if (res.error) setMsg('Erro ao alterar senha');
      else setMsg('Senha atualizada');
    } catch (e) {
      setMsg('Erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-3 border-t border-white/5">
      <div className={`flex items-center rounded-lg transition-all duration-300 ${
        isOpen ? 'gap-3 px-3 py-2' : 'lg:justify-center lg:px-2 lg:py-2'
      }`}>
        <button onClick={openEditor} className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#EC4899] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <i className="ri-user-line text-white text-base"></i>
          )}
        </button>
        <div
          className={
            isOpen
              ? 'flex-1 min-w-0 transition-all duration-300 opacity-100'
              : 'flex-1 min-w-0 transition-all duration-300 opacity-0 hidden lg:hidden'
          }
        >
          <p className="text-sm font-medium text-[#F9FAFB] truncate">{firstName}</p>
        </div>
        <div className="ml-2">
          <button onClick={() => signOut()} className="text-sm text-[#9CA3AF] hover:text-white">Sair</button>
        </div>

      </div>

      {open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#0E0B16] border border-white/5 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[#F9FAFB] mb-3">Editar perfil</h3>
            {msg && <div className="text-sm text-[#9CA3AF] mb-2">{msg}</div>}
            <label className="block mb-2">
              <span className="text-sm text-[#9CA3AF]">Nome</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border border-white/10 bg-transparent rounded px-3 py-2 text-[#F9FAFB]" />
            </label>
            <label className="block mb-2">
              <span className="text-sm text-[#9CA3AF]">Avatar (selecione imagem)</span>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  setMsg('Enviando...');
                  // If supabase storage is available, try upload to 'avatars' bucket
                  try {
                    const storage = (supabase as any).storage;
                    if (storage && typeof storage.from === 'function') {
                      const userId = user?.id || 'anonymous';
                      const filePath = `public/${userId}/${Date.now()}_${file.name}`;
                      const uploadRes = await storage.from('avatars').upload(filePath, file as any, { cacheControl: '3600', upsert: false });
                      const uploadError = uploadRes?.error || uploadRes?.data?.error || null;
                      if (uploadError) {
                        setMsg('Erro ao enviar imagem para storage');
                        // fallback to preview
                        const reader = new FileReader();
                        reader.onload = () => setAvatar(String(reader.result));
                        reader.readAsDataURL(file);
                        return;
                      }
                      // get public url
                      let publicUrl = '';
                      try {
                        const urlRes = await storage.from('avatars').getPublicUrl(filePath);
                        publicUrl = (urlRes && (urlRes.data?.publicUrl || urlRes.publicUrl)) || '';
                      } catch (e) {
                        // ignore
                      }
                      if (publicUrl) {
                        setAvatar(publicUrl);
                        setMsg('Imagem enviada');
                      } else {
                        // fallback to data URL preview
                        const reader = new FileReader();
                        reader.onload = () => setAvatar(String(reader.result));
                        reader.readAsDataURL(file);
                        setMsg('Preview pronta');
                      }
                    } else {
                      // No storage available: preview as data URL
                      const reader = new FileReader();
                      reader.onload = () => setAvatar(String(reader.result));
                      reader.readAsDataURL(file);
                      setMsg('Preview pronta');
                    }
                  } catch (err) {
                    setMsg('Erro ao processar imagem');
                  }
                }}
                className="mt-1 block w-full text-sm text-[#F9FAFB]"
              />
            </label>
            <div className="mt-3">
              <button onClick={handleSaveProfile} disabled={loading} className="mr-2 bg-[#7C3AED] text-white px-4 py-2 rounded">Salvar</button>
              <button onClick={() => setOpen(false)} className="bg-white/5 text-[#F9FAFB] px-4 py-2 rounded">Fechar</button>
            </div>

            <hr className="my-4 border-white/5" />

            <h4 className="text-sm font-medium text-[#F9FAFB] mb-2">Alterar senha</h4>
            <label className="block mb-2">
              <input placeholder="Nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 block w-full border border-white/10 bg-transparent rounded px-3 py-2 text-[#F9FAFB]" />
            </label>
            <div className="mt-2">
              <button onClick={handleChangePassword} disabled={loading} className="bg-[#EC4899] text-white px-4 py-2 rounded">Alterar senha</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
