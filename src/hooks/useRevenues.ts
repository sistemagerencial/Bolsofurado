
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

export interface Revenue {
  id: string;
  user_id: string;
  date: string;
  category_id: string | null;
  description: string;
  amount: number;
  created_at: string;
}

export const useRevenues = () => {
  const { user, loading: authLoading } = useAuthContext();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenues = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('revenues')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;

      setRevenues(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar receitas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchRevenues(user.id);
    } else if (!authLoading) {
      // Auth terminou de carregar e não há usuário
      setRevenues([]);
      setLoading(false);
    }
  }, [user?.id, authLoading, fetchRevenues]);

  const createRevenue = async (revenueData: {
    date: string;
    category_id: string;
    description: string;
    amount: number;
  }) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error: insertError } = await supabase
        .from('revenues')
        .insert([
          {
            user_id: user.id,
            date: revenueData.date,
            category_id: revenueData.category_id,
            description: revenueData.description,
            amount: revenueData.amount
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      setRevenues(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao criar receita:', err);
      throw err;
    }
  };

  const deleteRevenue = async (id: string) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { error: deleteError } = await supabase
        .from('revenues')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setRevenues(prev => prev.filter(rev => rev.id !== id));
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao deletar receita:', err);
      throw err;
    }
  };

  const updateRevenue = async (id: string, revenueData: {
    date: string;
    category_id: string | null;
    description: string;
    amount: number;
  }) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error: updateError } = await supabase
        .from('revenues')
        .update({
          date: revenueData.date,
          category_id: revenueData.category_id,
          description: revenueData.description,
          amount: revenueData.amount
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setRevenues(prev => prev.map(rev => rev.id === id ? data : rev));
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao atualizar receita:', err);
      throw err;
    }
  };

  return {
    revenues,
    loading,
    error,
    createRevenue,
    updateRevenue,
    deleteRevenue,
    refetch: () => user?.id ? fetchRevenues(user.id) : Promise.resolve()
  };
};
