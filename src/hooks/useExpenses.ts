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

  const deleteExpenseGroup = async (id: string) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      // buscar despesa alvo
      const { data: targetData, error: targetErr } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .single();
      if (targetErr) throw targetErr;
      const target = targetData as Expense;

      const desc = target.description || '';
      // se contém (i/total)
      const m = desc.match(/\((\d+)\/(\d+)\)/);
      let idsToDelete: string[] = [];
      if (m) {
        const i = Number(m[1]);
        const total = Number(m[2]);
        const currentDate = new Date(target.date + 'T00:00:00');
        const purchaseDate = new Date(currentDate);
        purchaseDate.setDate(purchaseDate.getDate() - 30 * (i - 1));

        // gerar datas das parcelas (a partir da parcela i até total)
        const dates: string[] = [];
        for (let j = i; j <= total; j++) {
          const d = new Date(purchaseDate);
          d.setDate(d.getDate() + 30 * (j - 1));
          dates.push(d.toISOString().split('T')[0]);
        }

        // deletar por datas e user_id
        const { data: delData, error: delErr } = await supabase
          .from('expenses')
          .delete()
          .in('date', dates)
          .eq('user_id', user.id);
        if (delErr) throw delErr;
        // atualizar state: buscar novamente
        await fetchExpenses(user.id);
        return delData;
      }

      // se for entrada, tenta encontrar parcelas relacionadas (mesma categoria e datas posteriores que contenham (x/total))
      if (/\(entrada\)/i.test(desc)) {
        const entryDate = target.date;
        const { data: related, error: relatedErr } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', entryDate)
          .eq('category_id', target.category_id);
        if (relatedErr) throw relatedErr;
        // filtrar por descrições que contêm (n/total) ou (entrada)
        const toDelete = (related || []).filter((r: any) => /\(\d+\/\d+\)/.test(r.description || '') || /\(entrada\)/i.test(r.description || ''));
        const delIds = toDelete.map((r: any) => r.id);
        if (delIds.length === 0) {
          // fallback: delete only target
          await deleteExpense(id);
          return [target];
        }
        const { data: delData2, error: delErr2 } = await supabase
          .from('expenses')
          .delete()
          .in('id', delIds);
        if (delErr2) throw delErr2;
        await fetchExpenses(user.id);
        return delData2;
      }

      // default: delete single
      await deleteExpense(id);
      return [target];
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao deletar grupo de despesas:', err);
      throw err;
    }
  };

  const updateExpenseGroup = async (id: string, expenseData: {
    date?: string;
    category_id?: string | null;
    description?: string;
    amount?: number;
  }) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { data: targetData, error: targetErr } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .single();
      if (targetErr) throw targetErr;
      const target = targetData as Expense;
      const desc = target.description || '';

      // parcela: (i/total)
      const m = desc.match(/\((\d+)\/(\d+)\)/);
      if (m) {
        const i = Number(m[1]);
        const total = Number(m[2]);
        const currentDate = new Date(target.date + 'T00:00:00');
        const purchaseDate = new Date(currentDate);
        purchaseDate.setDate(purchaseDate.getDate() - 30 * (i - 1));

        const dates: string[] = [];
        for (let j = 1; j <= total; j++) {
          const d = new Date(purchaseDate);
          d.setDate(d.getDate() + 30 * (j - 1));
          dates.push(d.toISOString().split('T')[0]);
        }

        const updates: any = {};
        if (expenseData.date) updates.date = expenseData.date;
        if (typeof expenseData.category_id !== 'undefined') updates.category_id = expenseData.category_id;
        if (typeof expenseData.description !== 'undefined') updates.description = expenseData.description;
        if (typeof expenseData.amount !== 'undefined') updates.amount = expenseData.amount;

        const { data: updData, error: updErr } = await supabase
          .from('expenses')
          .update(updates)
          .in('date', dates)
          .eq('user_id', user.id);
        if (updErr) throw updErr;
        await fetchExpenses(user.id);
        return updData;
      }

      // assinatura: procurar lançamentos com mesma descrição e categoria
      // deletar/atualizar apenas a partir da data selecionada (pra frente)
      const relatedDesc = desc;
      const { data: related, error: relatedErr } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('category_id', target.category_id)
        .eq('description', relatedDesc)
        .gte('date', target.date);
      if (!relatedErr && related && related.length >= 1) {
        const updates: any = {};
        if (expenseData.date) updates.date = expenseData.date;
        if (typeof expenseData.category_id !== 'undefined') updates.category_id = expenseData.category_id;
        if (typeof expenseData.description !== 'undefined') updates.description = expenseData.description;
        if (typeof expenseData.amount !== 'undefined') updates.amount = expenseData.amount;

        const ids = related.map((r: any) => r.id);
        const { data: updData2, error: updErr2 } = await supabase
          .from('expenses')
          .update(updates)
          .in('id', ids);
        if (updErr2) throw updErr2;
        await fetchExpenses(user.id);
        return updData2;
      }

      // se for entrada: busca parcelas relacionadas e atualiza todas
      if (/\(entrada\)/i.test(desc)) {
        const entryDate = target.date;
        const { data: related2, error: relatedErr2 } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', entryDate)
          .eq('category_id', target.category_id);
        if (relatedErr2) throw relatedErr2;
        const toUpdate = (related2 || []).filter((r: any) => /\(\d+\/\d+\)/.test(r.description || '') || /\(entrada\)/i.test(r.description || ''));
        const ids = toUpdate.map((r: any) => r.id);
        if (ids.length > 0) {
          const updates: any = {};
          if (expenseData.date) updates.date = expenseData.date;
          if (typeof expenseData.category_id !== 'undefined') updates.category_id = expenseData.category_id;
          if (typeof expenseData.description !== 'undefined') updates.description = expenseData.description;
          if (typeof expenseData.amount !== 'undefined') updates.amount = expenseData.amount;

          const { data: updData3, error: updErr3 } = await supabase
            .from('expenses')
            .update(updates)
            .in('id', ids);
          if (updErr3) throw updErr3;
          await fetchExpenses(user.id);
          return updData3;
        }
      }

      // fallback: update single
      const { data, error: updateError } = await supabase
        .from('expenses')
        .update({
          date: expenseData.date || target.date,
          category_id: expenseData.category_id ?? target.category_id,
          description: expenseData.description ?? target.description,
          amount: typeof expenseData.amount !== 'undefined' ? expenseData.amount : target.amount
        })
        .eq('id', id)
        .select()
        .single();
      if (updateError) throw updateError;
      setExpenses(prev => prev.map(exp => exp.id === id ? data : exp));
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao atualizar grupo de despesas:', err);
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
    deleteExpenseGroup,
    updateExpenseGroup,
    refetch: () => user?.id ? fetchExpenses(user.id) : Promise.resolve()
  };
};
