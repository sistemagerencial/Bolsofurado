import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

interface AdminLog {
  id: string;
  admin_id: string;
  target_user_id: string;
  action: string;
  details: any;
  created_at: string;
}

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Erro ao verificar status admin:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const getAllUsers = async (): Promise<Profile[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar todos os usuários:', error);
      return [];
    }
  };

  const searchUsers = async (searchTerm: string): Promise<Profile[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  };

  const getUserById = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  };

  const logAdminAction = async (targetUserId: string, action: string, details: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('admin_logs').insert({
        admin_id: user.id,
        target_user_id: targetUserId,
        action,
        details
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  const grantOneMonth = async (userId: string) => {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_expires_at: expiresAt.toISOString(),
          is_admin_override: true,
          plan_type: 'monthly'
        })
        .eq('id', userId);

      if (error) throw error;

      await logAdminAction(userId, 'grant_one_month', {
        expires_at: expiresAt.toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao liberar 1 mês:', error);
      return { success: false, error };
    }
  };

  const grantOneYear = async (userId: string) => {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365);

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_expires_at: expiresAt.toISOString(),
          is_admin_override: true,
          plan_type: 'yearly'
        })
        .eq('id', userId);

      if (error) throw error;

      await logAdminAction(userId, 'grant_one_year', {
        expires_at: expiresAt.toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao liberar 12 meses:', error);
      return { success: false, error };
    }
  };

  const grantLifetime = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          is_lifetime: true,
          is_admin_override: true,
          plan_type: 'lifetime'
        })
        .eq('id', userId);

      if (error) throw error;

      await logAdminAction(userId, 'grant_lifetime', );

      return { success: true };
    } catch (error) {
      console.error('Erro ao liberar vitalício:', error);
      return { success: false, error };
    }
  };

  const cancelSubscription = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'expired',
          is_admin_override: false
        })
        .eq('id', userId);

      if (error) throw error;

      await logAdminAction(userId, 'cancel_subscription', {});

      return { success: true };
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      return { success: false, error };
    }
  };

  const getAdminLogs = async (limit = 50): Promise<AdminLog[]> => {
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      return [];
    }
  };

  return {
    isAdmin,
    loading,
    getAllUsers,
    searchUsers,
    getUserById,
    grantOneMonth,
    grantOneYear,
    grantLifetime,
    cancelSubscription,
    getAdminLogs
  };
};