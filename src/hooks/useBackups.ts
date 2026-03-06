
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface BackupInfo {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  size: number;
}

interface BackupRecordsCount {
  expenses: number;
  revenues: number;
  investments: number;
  budgets: number;
  categories: number;
  patrimonios: number;
  trades: number;
  calculator_projects: number;
  calculator_services: number;
}

interface CreateBackupResponse {
  id: string;
  path: string;
  created_at: string;
  records_count: BackupRecordsCount;
}

export function useBackups() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<BackupInfo[]>([]);

  // Função auxiliar para obter token válido
  const getValidToken = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro ao obter sessão:', error);
        throw new Error('Erro de autenticação');
      }

      if (!session?.access_token) {
        console.error('Nenhum token de acesso encontrado');
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      return session.access_token;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      throw new Error('Problema de autenticação. Tente fazer login novamente.');
    }
  };

  const createBackup = useCallback(async (): Promise<CreateBackupResponse | null> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setLoading(true);
      
      const token = await getValidToken();

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/automatic-backup?action=create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta:', parseError);
        throw new Error('Erro na comunicação com o servidor');
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        throw new Error(result?.error || `Erro no servidor (${response.status})`);
      }

      console.log('Backup criado:', result.backup);
      
      // Atualizar lista de backups
      await listBackups();
      
      return result.backup;
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const listBackups = useCallback(async (): Promise<BackupInfo[]> => {
    if (!user) {
      console.log('Usuário não autenticado, retornando lista vazia');
      setBackups([]);
      return [];
    }

    try {
      setLoading(true);
      
      const token = await getValidToken();

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/automatic-backup?action=list`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.warn('Erro ao fazer parse da resposta, retornando lista vazia');
        setBackups([]);
        return [];
      }

      if (!response.ok) {
        // Tratamento específico para diferentes códigos de erro
        if (response.status === 401) {
          console.warn('Token expirado, usuário precisa fazer login novamente');
          setBackups([]);
          return [];
        }
        
        // Se for erro 404 ou relacionado a não encontrar backups, retornar lista vazia
        if (response.status === 404 || (result?.error && result.error.includes('not found'))) {
          console.log('Nenhum backup encontrado para o usuário');
          setBackups([]);
          return [];
        }
        
        // Para outros erros, logar mas não quebrar a interface
        console.warn('Erro ao listar backups:', result?.error || response.statusText);
        setBackups([]);
        return [];
      }

      const backupsList = result.backups || [];
      setBackups(backupsList);
      return backupsList;
    } catch (error) {
      console.error('Erro ao listar backups:', error);
      // Em caso de erro, definir lista vazia e retornar
      setBackups([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const downloadBackup = useCallback(async (backupId: string): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setLoading(true);
      
      const token = await getValidToken();

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/automatic-backup?action=download&backup_id=${backupId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        
        let errorMessage = `Erro no servidor (${response.status})`;
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (parseError) {
          // Ignorar erro de parse e usar mensagem padrão
        }
        throw new Error(errorMessage);
      }

      // Criar blob e download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${backupId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar backup:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const restoreBackup = useCallback(async (backupId: string): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setLoading(true);
      
      const token = await getValidToken();

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/automatic-backup?action=restore`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ backup_id: backupId }),
        }
      );

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Erro na comunicação com o servidor');
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        throw new Error(result?.error || `Erro no servidor (${response.status})`);
      }

      console.log('Backup restaurado com sucesso');
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deleteBackup = useCallback(async (backupId: string): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setLoading(true);
      
      const token = await getValidToken();

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/automatic-backup?action=delete&backup_id=${backupId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Erro na comunicação com o servidor');
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        throw new Error(result?.error || `Erro no servidor (${response.status})`);
      }

      // Atualizar lista de backups
      await listBackups();
      console.log('Backup deletado com sucesso');
    } catch (error) {
      console.error('Erro ao deletar backup:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, listBackups]);

  return {
    loading,
    backups,
    createBackup,
    listBackups,
    downloadBackup,
    restoreBackup,
    deleteBackup,
  };
}
