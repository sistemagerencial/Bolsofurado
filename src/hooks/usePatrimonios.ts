
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

export interface Patrimonio {
  id: string;
  user_id: string;
  name: string;
  type: string;
  value: number;
  acquisition_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const usePatrimonios = () => {
  const { user, loading: authLoading } = useAuthContext();
  const [patrimonios, setPatrimonios] = useState<Patrimonio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatrimonios = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('patrimonios')
        .select('*')
        .eq('user_id', userId)
        .order('acquisition_date', { ascending: false });

      if (fetchError) throw fetchError;
      setPatrimonios(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar patrimônios:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchPatrimonios(user.id);
    } else if (!authLoading) {
      setPatrimonios([]);
      setLoading(false);
    }
  }, [user?.id, authLoading, fetchPatrimonios]);

  const createPatrimonio = async (patrimonioData: {
    name: string;
    type: string;
    value: number;
    acquisition_date: string;
    notes?: string;
  }) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error: insertError } = await supabase
        .from('patrimonios')
        .insert([{
          user_id: user.id,
          name: patrimonioData.name,
          type: patrimonioData.type,
          value: patrimonioData.value,
          acquisition_date: patrimonioData.acquisition_date,
          notes: patrimonioData.notes || null
        }])
        .select()
        .maybeSingle();

      if (insertError) throw insertError;
      if (data) setPatrimonios(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao criar patrimônio:', err);
      throw err;
    }
  };

  const deletePatrimonio = async (id: string) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { error: deleteError } = await supabase
        .from('patrimonios')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setPatrimonios(prev => prev.filter(pat => pat.id !== id));
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao deletar patrimônio:', err);
      throw err;
    }
  };

  return {
    patrimonios,
    loading,
    error,
    createPatrimonio,
    deletePatrimonio,
    refetch: () => user?.id ? fetchPatrimonios(user.id) : Promise.resolve()
  };
};
