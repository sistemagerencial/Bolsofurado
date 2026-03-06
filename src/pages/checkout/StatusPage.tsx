
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

type PaymentStatus = 'approved' | 'pending' | 'failure' | 'loading';

export default function StatusPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile } = useAuthContext();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [refreshAttempts, setRefreshAttempts] = useState(0);

  const tryRefreshProfile = useCallback(async () => {
    // Tenta atualizar o perfil até 6 vezes (30 segundos) aguardando o webhook processar
    for (let i = 0; i < 6; i++) {
      await refreshProfile();
      setRefreshAttempts(i + 1);
      if (i < 5) {
        await new Promise((res) => setTimeout(res, 5000));
      }
    }
    setStatus('approved');
  }, [refreshProfile]);

  useEffect(() => {
    const paymentStatus = searchParams.get('status');

    if (!paymentStatus) {
      setStatus('failure');
      return;
    }

    if (paymentStatus === 'approved') {
      tryRefreshProfile();
    } else if (paymentStatus === 'pending') {
      setStatus('pending');
    } else {
      setStatus('failure');
    }
  }, [searchParams, tryRefreshProfile]);

  const handleGoToDashboard = () => {
    navigate('/');
  };

  const handleTryAgain = () => {
    navigate('/checkout');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Confirmando pagamento...</h2>
          <p className="text-slate-500 text-sm mb-4">
            Aguarde enquanto ativamos seu Plano PRO. Isso pode levar alguns segundos.
          </p>
          {refreshAttempts > 0 && (
            <div className="flex items-center justify-center gap-2 text-teal-600">
              <i className="ri-refresh-line text-base animate-spin"></i>
              <span className="text-sm font-medium">
                Verificando... ({refreshAttempts}/6)
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-check-line text-4xl text-green-600"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Pagamento Aprovado! 🎉
          </h1>
          <p className="text-slate-600 mb-2">
            Sua assinatura está ativa. Aproveite todos os recursos do Plano PRO!
          </p>
          <p className="text-sm text-slate-400 mb-8">
            Se o acesso não for liberado imediatamente, aguarde alguns instantes e recarregue a página.
          </p>
          <button
            onClick={handleGoToDashboard}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Ir para o Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-time-line text-4xl text-amber-600"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Pagamento em Análise
          </h1>
          <p className="text-slate-600 mb-8">
            Seu pagamento está sendo processado. Você receberá uma confirmação em breve por e-mail e o acesso será liberado automaticamente.
          </p>
          <button
            onClick={handleGoToDashboard}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="ri-close-line text-4xl text-red-600"></i>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          Pagamento Não Concluído
        </h1>
        <p className="text-slate-600 mb-8">
          Não foi possível processar seu pagamento. Por favor, tente novamente.
        </p>
        <div className="space-y-3">
          <button
            onClick={handleTryAgain}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Tentar Novamente
          </button>
          <button
            onClick={handleGoToDashboard}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
