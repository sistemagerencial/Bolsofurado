import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { useSubscription } from './useSubscription';

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  month: number;
  year: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

export const useBudgets = () => {
  const { user, loading: authLoading } = useAuthContext();
  const { hasAccess } = useSubscription();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async (monthDate?: string) => {
    if (!user?.id) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (monthDate) {
        const parts = monthDate.split('-');
        const yearNum = parseInt(parts[0], 10);
        const monthNum = parseInt(parts[1], 10);
        query = query.eq('year', yearNum).eq('month', monthNum);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setBudgets(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar orçamentos:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      const now = new Date();
      const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      fetchBudgets(defaultMonth);
    } else if (!authLoading) {
      setBudgets([]);
      setLoading(false);
    }
  }, [user?.id, authLoading, fetchBudgets]);

  const createBudget = async (budgetData: {
    category_id: string;
    month: number;
    year: number;
    amount: number;
  }) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');
      if (!hasAccess) throw new Error('Assinatura expirada. Renove seu plano para continuar.');

      const { data, error: insertError } = await supabase
        .from('budgets')
        .insert([{
          user_id: user.id,
          category_id: budgetData.category_id,
          month: budgetData.month,
          year: budgetData.year,
          amount: budgetData.amount,
        }])
        .select()
        .maybeSingle();

      if (insertError) throw insertError;
      if (data) setBudgets(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao criar orçamento:', err);
      throw err;
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');
      if (!hasAccess) throw new Error('Assinatura expirada. Renove seu plano para continuar.');

      const { data, error: updateError } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (updateError) throw updateError;
      if (data) setBudgets(prev => prev.map(b => b.id === id ? data : b));
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao atualizar orçamento:', err);
      throw err;
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');
      if (!hasAccess) throw new Error('Assinatura expirada. Renove seu plano para continuar.');

      const { error: deleteError } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao deletar orçamento:', err);
      throw err;
    }
  };

  return {
    budgets,
    loading,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
    fetchBudgets,
    refetch: fetchBudgets
  };
};
