import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface ProjectLancamento {
  data: string;
  descricao: string;
  valor: number;
}

export interface CalculatorProject {
  id: string;
  user_id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  planejado: number;
  realizado: number;
  status: string;
  lancamentos: ProjectLancamento[];
  created_at: string;
  updated_at: string;
}

export const useCalculatorProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<CalculatorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('calculator_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setProjects(data || []);
    } catch (err) {
      console.error('Erro ao buscar projetos:', err);
      setError('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: Omit<CalculatorProject, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error: insertError } = await supabase
        .from('calculator_projects')
        .insert([
          {
            user_id: user.id,
            ...projectData,
          },
        ])
        .select()
        .maybeSingle();

      if (insertError) throw insertError;

      if (data) {
        setProjects((prev) => [data, ...prev]);
      }

      return data;
    } catch (err) {
      console.error('Erro ao criar projeto:', err);
      throw err;
    }
  };

  const updateProject = async (id: string, updates: Partial<Omit<CalculatorProject, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error: updateError } = await supabase
        .from('calculator_projects')
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
        setProjects((prev) =>
          prev.map((project) => (project.id === id ? data : project))
        );
      }

      return data;
    } catch (err) {
      console.error('Erro ao atualizar projeto:', err);
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error: deleteError } = await supabase
        .from('calculator_projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setProjects((prev) => prev.filter((project) => project.id !== id));
    } catch (err) {
      console.error('Erro ao deletar projeto:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
};