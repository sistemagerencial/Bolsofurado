import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Dividend {
  id: string;
  user_id: string;
  investment_id: string;
  payment_date: string;
  value_per_share: number;
  total_received: number;
  dividend_type: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useDividends = () => {
  const { user } = useAuth();
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDividends = async () => {
    if (!user) {
      setDividends([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dividends')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setDividends(data || []);
    } catch (error) {
      console.error('Erro ao buscar dividendos:', error);
      setDividends([]);
    } finally {
      setLoading(false);
    }
  };

  const addDividend = async (dividend: Omit<Dividend, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error } = await supabase
        .from('dividends')
        .insert([{ ...dividend, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      await fetchDividends();
      return data;
    } catch (error) {
      console.error('Erro ao adicionar dividendo:', error);
      throw error;
    }
  };

  const updateDividend = async (id: string, updates: Partial<Dividend>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error } = await supabase
        .from('dividends')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchDividends();
    } catch (error) {
      console.error('Erro ao atualizar dividendo:', error);
      throw error;
    }
  };

  const deleteDividend = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error } = await supabase
        .from('dividends')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchDividends();
    } catch (error) {
      console.error('Erro ao deletar dividendo:', error);
      throw error;
    }
  };

  const getDividendsByInvestment = (investmentId: string) => {
    return dividends.filter(d => d.investment_id === investmentId);
  };

  const getTotalDividendsByInvestment = (investmentId: string) => {
    return dividends
      .filter(d => d.investment_id === investmentId)
      .reduce((sum, d) => sum + Number(d.total_received), 0);
  };

  const getDividendsThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return dividends.filter(d => {
      const date = new Date(d.payment_date);
      return date >= firstDay && date <= lastDay;
    });
  };

  const getDividendsThisYear = () => {
    const now = new Date();
    const year = now.getFullYear();

    return dividends.filter(d => {
      const date = new Date(d.payment_date);
      return date.getFullYear() === year;
    });
  };

  const getTotalThisMonth = () => {
    return getDividendsThisMonth().reduce((sum, d) => sum + Number(d.total_received), 0);
  };

  const getTotalThisYear = () => {
    return getDividendsThisYear().reduce((sum, d) => sum + Number(d.total_received), 0);
  };

  useEffect(() => {
    fetchDividends();
  }, [user]);

  return {
    dividends,
    loading,
    fetchDividends,
    addDividend,
    updateDividend,
    deleteDividend,
    getDividendsByInvestment,
    getTotalDividendsByInvestment,
    getDividendsThisMonth,
    getDividendsThisYear,
    getTotalThisMonth,
    getTotalThisYear,
  };
};