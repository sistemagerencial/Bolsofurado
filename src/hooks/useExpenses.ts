import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

export interface Expense {
  id: string;
  user_id: string;
  date: string;
  category_id: string | null;
  description: string;
  amount: number;
  created_at: string;
}

export const useExpenses = () => {
  const { user, loading: authLoading } = useAuthContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;
      setExpenses(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar despesas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchExpenses(user.id);
    } else if (!authLoading) {
      setExpenses([]);
      setLoading(false);
    }
  }, [user?.id, authLoading, fetchExpenses]);

  const createExpense = async (expenseData: {
    date: string;
    category_id: string;
    description: string;
    amount: number;
  }) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error: insertError } = await supabase
        .from('expenses')
        .insert([{
          user_id: user.id,
          date: expenseData.date,
          category_id: expenseData.category_id,
          description: expenseData.description,
          amount: expenseData.amount
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      setExpenses(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao criar despesa:', err);
      throw err;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setExpenses(prev => prev.filter(exp => exp.id !== id));
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao deletar despesa:', err);
      throw err;
    }
  };

  const updateExpense = async (id: string, expenseData: {
    date: string;
    category_id: string | null;
    description: string;
    amount: number;
  }) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error: updateError } = await supabase
        .from('expenses')
        .update({
          date: expenseData.date,
          category_id: expenseData.category_id,
          description: expenseData.description,
          amount: expenseData.amount
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      setExpenses(prev => prev.map(exp => exp.id === id ? data : exp));
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao atualizar despesa:', err);
      throw err;
    }
  };

  return {
    expenses,
    loading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch: () => user?.id ? fetchExpenses(user.id) : Promise.resolve()
  };
};
