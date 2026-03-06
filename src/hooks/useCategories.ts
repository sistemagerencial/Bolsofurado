
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'receita' | 'despesa';
  icon?: string;
  color: string;
  created_at: string;
}

export const useCategories = (typeFilter?: 'receita' | 'despesa') => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCategories([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (typeFilter) {
        query = query.eq('type', typeFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setCategories(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar categorias:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: {
    name: string;
    type: 'receita' | 'despesa';
    color: string;
    icon?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error: insertError } = await supabase
        .from('categories')
        .insert([
          {
            user_id: user.id,
            name: categoryData.name,
            type: categoryData.type,
            icon: categoryData.icon || null,
            color: categoryData.color
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao criar categoria:', err);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao deletar categoria:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchCategories();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCategories();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    categories,
    loading,
    error,
    createCategory,
    deleteCategory,
    refetch: fetchCategories
  };
};
