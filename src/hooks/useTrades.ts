import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';

export interface Trade {
  id: string;
  user_id: string;
  date: string;
  type: string;
  symbol: string;
  quantity: number;
  price: number;
  total: number;
  notes: string | null;
  created_at: string;
}

export const useTrades = () => {
  const { user } = useAuth();
  const { hasAccess } = useSubscription();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTrades([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;

      setTrades(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar trades:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTrade = async (tradeData: {
    date: string;
    type: string;
    symbol: string;
    quantity: number;
    price: number;
    total: number;
    notes?: string;
  }) => {
    if (!user) throw new Error('Usuário não autenticado');
    if (!hasAccess) throw new Error('Assinatura expirada. Renove seu plano para continuar.');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error: insertError } = await supabase
        .from('trades')
        .insert([
          {
            user_id: user.id,
            date: tradeData.date,
            type: tradeData.type,
            symbol: tradeData.symbol,
            quantity: tradeData.quantity,
            price: tradeData.price,
            total: tradeData.total,
            notes: tradeData.notes || null,
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      setTrades(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao criar trade:', err);
      throw err;
    }
  };

  const updateTrade = async (id: string, tradeData: {
    date?: string;
    type?: string;
    symbol?: string;
    quantity?: number;
    price?: number;
    total?: number;
    notes?: string;
  }) => {
    if (!user) throw new Error('Usuário não autenticado');
    if (!hasAccess) throw new Error('Assinatura expirada. Renove seu plano para continuar.');

    try {
      const { data, error: updateError } = await supabase
        .from('trades')
        .update(tradeData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setTrades(prev => prev.map(trade => trade.id === id ? data : trade));
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao atualizar trade:', err);
      throw err;
    }
  };

  const deleteTrade = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    if (!hasAccess) throw new Error('Assinatura expirada. Renove seu plano para continuar.');

    try {
      const { error: deleteError } = await supabase
        .from('trades')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setTrades(prev => prev.filter(trade => trade.id !== id));
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao deletar trade:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTrades();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchTrades();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    trades,
    loading,
    error,
    createTrade,
    updateTrade,
    deleteTrade,
    refetch: fetchTrades
  };
};
