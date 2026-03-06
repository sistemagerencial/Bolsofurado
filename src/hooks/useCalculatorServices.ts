import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface CalculatorService {
  id: string;
  user_id: string;
  bem: string;
  tipo: string;
  prestador: string;
  data: string;
  valor: number;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export const useCalculatorServices = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<CalculatorService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    if (!user) {
      setServices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('calculator_services')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false });

      if (fetchError) throw fetchError;

      setServices(data || []);
    } catch (err) {
      console.error('Erro ao buscar serviços:', err);
      setError('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const createService = async (serviceData: Omit<CalculatorService, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error: insertError } = await supabase
        .from('calculator_services')
        .insert([
          {
            user_id: user.id,
            ...serviceData,
          },
        ])
        .select()
        .maybeSingle();

      if (insertError) throw insertError;

      if (data) {
        setServices((prev) => [data, ...prev]);
      }

      return data;
    } catch (err) {
      console.error('Erro ao criar serviço:', err);
      throw err;
    }
  };

  const updateService = async (id: string, updates: Partial<Omit<CalculatorService, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error: updateError } = await supabase
        .from('calculator_services')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (updateError) throw updateError;

      if (data) {
        setServices((prev) =>
          prev.map((service) => (service.id === id ? data : service))
        );
      }

      return data;
    } catch (err) {
      console.error('Erro ao atualizar serviço:', err);
      throw err;
    }
  };

  const deleteService = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error: deleteError } = await supabase
        .from('calculator_services')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setServices((prev) => prev.filter((service) => service.id !== id));
    } catch (err) {
      console.error('Erro ao deletar serviço:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchServices();
  }, [user]);

  return {
    services,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    refetch: fetchServices,
  };
};