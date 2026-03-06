import { useEffect, useState } from 'react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal exibido quando uma nova versão do sistema é detectada
 * Informa o usuário sobre a atualização e executa reload automático
 */
export const UpdateModal = ({ isOpen, onClose }: UpdateModalProps) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) return;

    // Countdown de 5 segundos antes do reload
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1A1625] border border-[#7C3AED]/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Ícone de Atualização */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#7C3AED] to-[#A855F7] rounded-full flex items-center justify-center animate-pulse">
            <i className="ri-refresh-line text-4xl text-white"></i>
          </div>
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-white text-center mb-3">
          Sistema Atualizado
        </h2>

        {/* Descrição */}
        <p className="text-[#9CA3AF] text-center mb-6">
          Uma nova versão do sistema está disponível. Estamos atualizando para garantir a melhor experiência.
        </p>

        {/* Countdown */}
        <div className="bg-[#0E0B16] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-sm text-[#9CA3AF] mb-1">Atualizando em</p>
              <p className="text-3xl font-bold text-[#7C3AED]">{countdown}s</p>
            </div>
          </div>
        </div>

        {/* Botão de Atualizar Agora */}
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Atualizar Agora
        </button>

        {/* Nota */}
        <p className="text-xs text-[#6B7280] text-center mt-4">
          Seus dados estão seguros e serão preservados
        </p>
      </div>
    </div>
  );
};

export default UpdateModal;