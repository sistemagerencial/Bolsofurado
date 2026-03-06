import { useEffect, useState } from 'react';

/**
 * Hook para detectar mudanças de versão e forçar atualização do sistema
 * Limpa cache, storage e força reload quando detecta nova versão
 */
export const useForceRefresh = () => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Versão atual do sistema (definida no build)
        const currentVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
        
        // Versão armazenada no localStorage
        const storedVersion = localStorage.getItem('app_version');

        // Se não há versão armazenada, salvar a atual
        if (!storedVersion) {
          localStorage.setItem('app_version', currentVersion);
          return;
        }

        // Se a versão mudou, executar limpeza completa
        if (storedVersion !== currentVersion) {
          console.log(`🔄 Nova versão detectada: ${storedVersion} → ${currentVersion}`);
          
          // Mostrar modal de atualização
          setShowUpdateModal(true);

          // Aguardar 1 segundo antes de iniciar limpeza
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Limpar localStorage (exceto versão temporariamente)
          const keysToKeep = ['app_version'];
          Object.keys(localStorage).forEach(key => {
            if (!keysToKeep.includes(key)) {
              localStorage.removeItem(key);
            }
          });

          // Limpar sessionStorage
          sessionStorage.clear();

          // Limpar cache do Service Worker (se existir)
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
            }
          }

          // Limpar cache do navegador
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            );
          }

          // Atualizar versão armazenada
          localStorage.setItem('app_version', currentVersion);

          // Aguardar 5 segundos antes do reload (tempo do modal)
          await new Promise(resolve => setTimeout(resolve, 5000));

          // Forçar reload da página
          console.log('✅ Cache limpo. Recarregando sistema...');
          window.location.reload();
        }
      } catch (error) {
        console.error('❌ Erro ao verificar versão:', error);
      }
    };

    checkVersion();
  }, []);

  return { showUpdateModal };
};

/**
 * Função utilitária para limpar cache manualmente
 * Pode ser chamada de qualquer lugar do sistema
 */
export const clearSystemCache = async (): Promise<void> => {
  try {
    // Limpar localStorage
    localStorage.clear();

    // Limpar sessionStorage
    sessionStorage.clear();

    // Limpar Service Worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    // Limpar cache do navegador
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }

    console.log('✅ Cache do sistema limpo com sucesso');
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    throw error;
  }
};

/**
 * Função para forçar reload completo do sistema
 * Limpa cache e recarrega a página
 */
export const forceSystemReload = async (): Promise<void> => {
  await clearSystemCache();
  window.location.reload();
};