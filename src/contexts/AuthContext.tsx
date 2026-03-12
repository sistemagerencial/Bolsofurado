import { createContext, useEffect, useState, ReactNode, useContext, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  subscription_status: string;
  subscription_expires_at: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  is_lifetime: boolean;
  is_admin_override: boolean;
  plan_type: string;
  deleted_at?: string | null;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  userProfile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: { name: string; phone?: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}

// Extrai o primeiro nome de forma segura
function extractFirstName(fullName?: string | null, email?: string | null): string {
  if (fullName && fullName.trim()) {
    const first = fullName.trim().split(/\s+/)[0];
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }
  if (email) {
    const local = email.split('@')[0];
    const clean = local.replace(/[0-9._\-+]/g, '');
    if (clean.length > 0) {
      return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    }
    return local.charAt(0).toUpperCase() + local.slice(1).toLowerCase();
  }
  return 'Usuário';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const isFetchingProfile = useRef(false);
  const lastFetchedUserId = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  // userProfile é um alias de profile para compatibilidade com PerfilPage
  const userProfile = profile;

  const fetchProfile = async (userId: string, userEmail?: string) => {
    // Remove a trava de cache — sempre busca dados frescos
    isFetchingProfile.current = true;
    lastFetchedUserId.current = userId;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, phone, avatar_url, is_admin, subscription_status, subscription_expires_at, trial_start_date, trial_end_date, is_lifetime, is_admin_override, plan_type, deleted_at, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        if (error.code === '42P17') {
          return {
            id: userId,
            email: userEmail ?? '',
            name: null,
            phone: null,
            avatar_url: null,
            is_admin: false,
            subscription_status: 'trial',
            subscription_expires_at: null,
            trial_start_date: null,
            trial_end_date: null,
            is_lifetime: false,
            is_admin_override: false,
            plan_type: 'free',
          } as Profile;
        }
        return null;
      }

      if (!data) return null;

      return {
        ...data,
        email: userEmail ?? '',
      } as Profile;
    } catch {
      return null;
    } finally {
      isFetchingProfile.current = false;
    }
  };

  const refreshProfile = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, phone, avatar_url, is_admin, subscription_status, subscription_expires_at, trial_start_date, trial_end_date, is_lifetime, is_admin_override, plan_type, created_at')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) return null;

      const updated: Profile = { ...data, email: user.email ?? '' };
      // Força atualização imediata do estado — sem condição
      setProfile(() => updated);
      return updated;
    } catch {
      return null;
    }
  };

  const isNewUser = (createdAt?: string): boolean => {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - created.getTime()) / (1000 * 60);
    return diffMinutes <= 5;
  };

  const sendWelcomeEmail = async (email: string, name: string) => {
    try {
      await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/send-welcome-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name }),
        }
      );
    } catch (_e) {
      // silently ignore welcome email errors
    }
  };

  const sendWhatsAppNotification = async (phone: string, name: string, email: string) => {
    try {
      await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/send-whatsapp-notification`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, name, email }),
        }
      );
    } catch (_e) {
      // silently ignore whatsapp notification errors
    }
  };

  // Garante que o perfil tenha o nome correto (especialmente para Google)
  const ensureProfileName = async (userId: string, currentUser: User, profileData: Profile) => {
    // Se já tem nome salvo, não faz nada
    const existingName = profileData.name;
    if (existingName && existingName.trim() && existingName !== 'Usuário') return profileData;

    // Tenta extrair nome dos metadados do usuário (Google OAuth)
    const metaName =
      currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.name ||
      currentUser.user_metadata?.given_name ||
      null;

    const firstName = extractFirstName(metaName, currentUser.email);

    if (firstName && firstName !== 'Usuário') {
      try {
        await supabase
          .from('profiles')
          .update({ name: firstName })
          .eq('id', userId);

        return { ...profileData, name: firstName };
      } catch (_e) {
        // silently ignore profile name update errors
      }
    }

    return profileData;
  };

  // Cria categorias padrão para novos usuários
  const createDefaultCategories = async (userId: string) => {
    try {
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (existing && existing.length > 0) return; // já tem categorias

      const defaultCategories = [
        // Receitas
        { user_id: userId, name: 'Salário', type: 'receita', color: '#22C55E' },
        { user_id: userId, name: 'Freelance', type: 'receita', color: '#10B981' },
        { user_id: userId, name: 'Aluguéis', type: 'receita', color: '#06B6D4' },
        // Despesas
        { user_id: userId, name: 'Alimentação', type: 'despesa', color: '#EF4444' },
        { user_id: userId, name: 'Saúde', type: 'despesa', color: '#EC4899' },
        { user_id: userId, name: 'Lazer', type: 'despesa', color: '#F97316' },
        { user_id: userId, name: 'Ensino', type: 'despesa', color: '#8B5CF6' },
      ];

      await supabase.from('categories').insert(defaultCategories);
    } catch (_e) {
      // silently ignore default categories creation errors
    }
  };

  const handleSessionChange = async (currentUser: User | null) => {
    // Sempre busca o perfil atualizado — sem pular por userId igual
    currentUserIdRef.current = currentUser?.id ?? null;
    // Reseta as travas para garantir fetch sempre
    isFetchingProfile.current = false;
    lastFetchedUserId.current = null;
    setUser(currentUser);

    if (currentUser) {
      let profileData = await fetchProfile(currentUser.id, currentUser.email ?? '');

      // Se o perfil não existir (usuário autenticou via OAuth mas não tem perfil),
      // apenas marca `profile` como null — o fluxo de registro deve lidar com
      // navegação. Evita redirecionamentos forçados que podem causar loops.
      if (!profileData) {
        setProfile(null);
      }

      // Se o perfil estiver marcado como deletado, força sign-out (inclui OAuth)
      if (profileData && (profileData as any).deleted_at) {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        if (!initialLoadComplete) setInitialLoadComplete(true);
        setLoading(false);
        return;
      }

      if (profileData) {
        profileData = await ensureProfileName(currentUser.id, currentUser, profileData);
        setProfile(profileData);

        const isNew = isNewUser(profileData.created_at);
        const hasShownWelcome = localStorage.getItem('bolsofurado_welcome_shown');
        const hasPending = localStorage.getItem('bolsofurado_show_welcome_pending');

        if (isNew && !hasShownWelcome && !hasPending) {
          localStorage.setItem('bolsofurado_show_welcome_pending', 'true');
          const userName = profileData.name || extractFirstName(null, currentUser.email);
          sendWelcomeEmail(currentUser.email || '', userName);
          await createDefaultCategories(currentUser.id);
        }
      }
    } else {
      currentUserIdRef.current = null;
      setProfile(null);
    }

    if (!initialLoadComplete) setInitialLoadComplete(true);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    let sessionTimeout: NodeJS.Timeout;
    let hasInitialized = false;

    // Timeout de segurança reduzido para 1.5s (era 3s) — mais rápido no celular
    const safetyTimeout = setTimeout(() => {
      if (mounted && !initialLoadComplete) {
        setInitialLoadComplete(true);
        setLoading(false);
      }
    }, 1500);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted || hasInitialized) return;
      hasInitialized = true;
      await handleSessionChange(session?.user ?? null);
      clearTimeout(safetyTimeout);
    }).catch(() => {
      if (mounted && !initialLoadComplete) {
        setInitialLoadComplete(true);
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'SIGNED_IN') {
        clearTimeout(sessionTimeout);
        sessionTimeout = setTimeout(async () => {
          if (mounted) await handleSessionChange(session?.user ?? null);
        }, 150);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      clearTimeout(sessionTimeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile_changes_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, async (payload) => {
        if (payload.eventType === 'UPDATE') {
          // Busca sempre os dados mais frescos do banco ao invés de usar o payload
          // (o payload pode ter dados desatualizados em race conditions)
          const { data } = await supabase
            .from('profiles')
            .select('id, name, phone, avatar_url, is_admin, subscription_status, subscription_expires_at, trial_start_date, trial_end_date, is_lifetime, is_admin_override, plan_type, created_at')
            .eq('id', user.id)
            .maybeSingle();

          if (data) {
            setProfile(() => ({ ...data, email: user.email ?? '' } as Profile));
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // após autenticar, verificar se existe perfil correspondente e se não está marcado como excluído
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        // algo inesperado — desloga apenas por segurança
        await supabase.auth.signOut();
        throw new Error('Erro ao verificar usuário. Contate o suporte.');
      }

      const { data: profileRow, error: profileErr } = await supabase
        .from('profiles')
        .select('id, deleted_at')
        .eq('id', userId)
        .maybeSingle();

      if (profileErr) {
        await supabase.auth.signOut();
        throw profileErr;
      }

      if (!profileRow || profileRow.deleted_at) {
        // usuário foi removido do banco — desloga e retorna erro amigável
        await supabase.auth.signOut();
        throw new Error('Usuário não cadastrado. Por favor, realize o cadastro novamente.');
      }
    } catch (e) {
      // propaga erro para tela de login
      throw e;
    }
  };

  const signUp = async ({ name, phone, email, password }: { name: string; phone?: string; email: string; password: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone: phone || '' },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) throw error;

    if (data.user) {
      // Salva nome e telefone imediatamente
      await supabase
        .from('profiles')
        .update({ name, phone: phone || null })
        .eq('id', data.user.id);

      // Cria categorias padrão
      await createDefaultCategories(data.user.id);

      if (phone) await sendWhatsAppNotification(phone, name, email);
    }

    localStorage.setItem('bolsofurado_show_welcome_pending', 'true');
    await sendWelcomeEmail(email, name);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      // redireciona para a página de registro quando o usuário vem do OAuth,
      // assim o usuário sem `profiles` será levado diretamente ao cadastro.
      options: { redirectTo: `${window.location.origin}/registro` },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, userProfile, loading, signIn, signUp, signOut, refreshProfile, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}
