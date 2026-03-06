import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { useSubscription } from './useSubscription';

export interface Investment {
  id: string;
  user_id: string;
  purchase_date: string;
  type: string;
  name: string;
  amount: number;
  entry_price: number;
  current_value: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  code?: string;
  quantity?: number;
  invested?: number;
  average_cost?: number;
}

export const useInvestments = () => {
  const { user, loading: authLoading } = useAuthContext();
  const { hasAccess } = useSubscription();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestments = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', userId)
        .order('purchase_date', { ascending: false });

      if (fetchError) throw fetchError;
      setInvestments(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar investimentos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchInvestments(user.id);
    } else if (!authLoading) {
      setInvestments([]);
      setLoading(false);
    }
  }, [user?.id, authLoading, fetchInvestments]);

  const createInvestment = async (investmentData: {
    purchase_date: string;
    type: string;
    name: string;
    amount: number;
    entry_price?: number;
    current_value: number;
    notes?: string;
    code?: string;
    quantity?: number;
  }) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');
      if (!hasAccess) throw new Error('Assinatura expirada. Renove seu plano para continuar.');

      // Verificar se já existe um ativo com o mesmo código/nome
      const existingAsset = investments.find(
        inv => (investmentData.code && inv.code === investmentData.code) || 
               (inv.name === investmentData.name && inv.type === investmentData.type)
      );

      if (existingAsset && investmentData.quantity && investmentData.entry_price) {
        // Recalcular custo médio ponderado
        const oldQuantity = existingAsset.quantity || 0;
        const oldAverageCost = existingAsset.average_cost || existingAsset.entry_price || 0;
        const newQuantity = investmentData.quantity;
        const newPrice = investmentData.entry_price;

        const totalQuantity = oldQuantity + newQuantity;
        const newAverageCost = ((oldQuantity * oldAverageCost) + (newQuantity * newPrice)) / totalQuantity;
        const totalAmount = (existingAsset.amount || 0) + investmentData.amount;

        // Atualizar o ativo existente
        const { data, error: updateError } = await supabase
          .from('investments')
          .update({
            quantity: totalQuantity,
            amount: totalAmount,
            average_cost: newAverageCost,
            current_value: investmentData.current_value,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAsset.id)
          .select()
          .single();

        if (updateError) throw updateError;
        setInvestments(prev => prev.map(inv => inv.id === existingAsset.id ? data : inv));
        return data;
      } else {
        // Criar novo investimento
        const averageCost = investmentData.entry_price || 0;
        
        const { data, error: insertError } = await supabase
          .from('investments')
          .insert([{
            user_id: user.id,
            purchase_date: investmentData.purchase_date,
            type: investmentData.type,
            name: investmentData.name,
            code: investmentData.code || null,
            quantity: investmentData.quantity || 0,
            amount: investmentData.amount,
            entry_price: investmentData.entry_price || 0,
            average_cost: averageCost,
            current_value: investmentData.current_value,
            notes: investmentData.notes || null,
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        setInvestments(prev => [data, ...prev]);
        return data;
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao criar investimento:', err);
      throw err;
    }
  };

  const updateInvestment = async (id: string, updates: Partial<Investment>) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');
      if (!hasAccess) throw new Error('Assinatura expirada. Renove seu plano para continuar.');

      const { data, error: updateError } = await supabase
        .from('investments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      setInvestments(prev => prev.map(inv => inv.id === id ? data : inv));
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao atualizar investimento:', err);
      throw err;
    }
  };

  const deleteInvestment = async (id: string) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');
      if (!hasAccess) throw new Error('Assinatura expirada. Renove seu plano para continuar.');

      const { error: deleteError } = await supabase
        .from('investments')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setInvestments(prev => prev.filter(inv => inv.id !== id));
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao deletar investimento:', err);
      throw err;
    }
  };

  return {
    investments,
    loading,
    error,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    refetch: () => user?.id ? fetchInvestments(user.id) : Promise.resolve()
  };
};
