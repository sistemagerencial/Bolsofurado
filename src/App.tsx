import { Suspense, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './router';
import SplashScreen from './components/SplashScreen';
import { useForceRefresh } from './hooks/useForceRefresh';
import UpdateModal from './components/modals/UpdateModal';

// Verifica de forma síncrona se já mostrou o splash nesta sessão
function shouldShowSplash(): boolean {
  try {
    return !sessionStorage.getItem('hasShownSplash');
  } catch {
    // No iPhone PWA, sessionStorage pode falhar — não mostra splash
    return false;
  }
}

function App() {
  const [showSplash, setShowSplash] = useState(() => shouldShowSplash());
  const { showUpdateModal } = useForceRefresh();

  const handleSplashFinish = () => {
    try {
      sessionStorage.setItem('hasShownSplash', 'true');
    } catch {
      // ignora erro em modo privado/PWA
    }
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <>
      <UpdateModal isOpen={showUpdateModal} onClose={() => {}} />

      <BrowserRouter basename={__BASE_PATH__}>
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#0E0B16] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#9CA3AF] text-sm">Carregando...</p>
              </div>
            </div>
          }
        >
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </>
  );
}

export default App;
