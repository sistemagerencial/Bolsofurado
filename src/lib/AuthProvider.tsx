import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabaseClient';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (payload: { full_name?: string; avatar_url?: string }) => Promise<{ error?: any }>;
  updatePassword: (newPassword: string) => Promise<{ error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getUser() {
      try {
        // prefer getting session so we can access session.user reliably
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        const session = data?.session ?? null;
        setUser(session?.user ?? null);
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    getUser();

    // subscribe to auth state change
    const subReturn = supabase.auth.onAuthStateChange((event: any, session: any) => {
      // session may be null on sign out
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      try {
        // supabase-js may return { data: { subscription } } or { subscription }
        const subscription = (subReturn && (subReturn as any).data && (subReturn as any).data.subscription)
          || (subReturn && (subReturn as any).subscription);
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  async function signOut() {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      // ignore
    }
  }

  async function updateProfile(payload: { full_name?: string; avatar_url?: string }) {
    try {
      // supabase v2: updateUser accepts { data: { ... } }
      if ((supabase as any).auth && (supabase as any).auth.updateUser) {
        const res = await (supabase as any).auth.updateUser({ data: payload });
        // res may contain data.user
        if (res?.data?.user) setUser(res.data.user);
        return { error: (res as any).error };
      }
      return { error: 'updateUser not available' };
    } catch (err) {
      return { error: err };
    }
  }

  async function updatePassword(newPassword: string) {
    try {
      if ((supabase as any).auth && (supabase as any).auth.updateUser) {
        const res = await (supabase as any).auth.updateUser({ password: newPassword });
        if (res?.data?.user) setUser(res.data.user);
        return { error: (res as any).error };
      }
      return { error: 'updateUser not available' };
    } catch (err) {
      return { error: err };
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, updateProfile, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
