import { useEffect, useState, useRef } from 'react';

interface DailyUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysRemaining: number;
}

export default function DailyUpgradeModal({ isOpen, onClose, daysRemaining }: DailyUpgradeModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev || ''; };
  }, [isOpen]);

  // Ensure wheel events scroll the modal content (not the page)
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const el = scrollRef.current;
    if (!wrapper || !el) return;
    const onWheel = (e: WheelEvent) => {
      const target = e.target as Node | null;
      if (!target || !wrapper.contains(target)) return;
      const delta = e.deltaY;
      const atTop = el.scrollTop === 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if ((delta < 0 && !atTop) || (delta > 0 && !atBottom)) {
        e.preventDefault();
        e.stopPropagation();
        el.scrollTop += delta;
      }
    };
    window.addEventListener('wheel', onWheel as any, { passive: false, capture: true });
    wrapper.addEventListener('wheel', onWheel as any, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel as any, { capture: true } as any);
      wrapper.removeEventListener('wheel', onWheel as any);
    };
  }, [isOpen]);

  const handleContinueTrial = () => {
    onClose();
  };

  const handleUpgrade = (plan: 'monthly' | 'yearly') => {
    // Redirecionar para página de assinatura com o plano selecionado
    window.REACT_APP_NAVIGATE(`/assinatura?plan=${plan}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div ref={wrapperRef} className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleContinueTrial}
      ></div>

      {/* Modal com scroll */}
      <div
        className={`relative flex flex-col bg-gradient-to-br from-[#1F2937] to-[#111827] border border-[#374151] rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        style={{
          height: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 32px)',
          touchAction: 'pan-y'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header com gradiente — fixo no topo */}
        <div className="overflow-hidden rounded-t-2xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] p-6 text-center flex-shrink-0 sticky top-0 z-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
          
          <div className="relative">
            <div className="w-16 h-16 flex items-center justify-center bg-white/20 rounded-full mx-auto mb-4 backdrop-blur-sm">
              <i className="ri-vip-crown-line text-4xl text-white"></i>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Desbloqueie Todo o Potencial</h2>
            <p className="text-white/90 text-lg">Seu teste gratuito termina em <strong>{daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}</strong></p>
          </div>
        </div>

        {/* Conteúdo com scroll */}
        <div ref={scrollRef} className="overflow-y-auto flex-1 p-6" style={{ paddingBottom: 'env(safe-area-inset-bottom)', WebkitOverflowScrolling: 'touch' }}>
          {/* Benefícios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-[#10B981]/20 rounded-lg flex-shrink-0">
                <i className="ri-check-line text-[#10B981] text-lg"></i>
              </div>
              <div>
                <h4 className="text-[#F9FAFB] font-semibold text-sm mb-1">Controle Total</h4>
                <p className="text-[#9CA3AF] text-xs">Receitas, despesas e investimentos ilimitados</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-[#10B981]/20 rounded-lg flex-shrink-0">
                <i className="ri-check-line text-[#10B981] text-lg"></i>
              </div>
              <div>
                <h4 className="text-[#F9FAFB] font-semibold text-sm mb-1">Relatórios Avançados</h4>
                <p className="text-[#9CA3AF] text-xs">Análises detalhadas e gráficos personalizados</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-[#10B981]/20 rounded-lg flex-shrink-0">
                <i className="ri-check-line text-[#10B981] text-lg"></i>
              </div>
              <div>
                <h4 className="text-[#F9FAFB] font-semibold text-sm mb-1">Calculadoras Inteligentes</h4>
                <p className="text-[#9CA3AF] text-xs">Ferramentas para trabalho, construção e serviços</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-[#10B981]/20 rounded-lg flex-shrink-0">
                <i className="ri-check-line text-[#10B981] text-lg"></i>
              </div>
              <div>
                <h4 className="text-[#F9FAFB] font-semibold text-sm mb-1">Suporte Prioritário</h4>
                <p className="text-[#9CA3AF] text-xs">Atendimento rápido e personalizado</p>
              </div>
            </div>
          </div>

          {/* Planos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Plano Mensal */}
            <button
              onClick={() => handleUpgrade('monthly')}
              className="group relative bg-[#111827] border-2 border-[#374151] rounded-xl p-6 hover:border-[#7C3AED] transition-all duration-300 text-left cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Mensal</span>
                <i className="ri-arrow-right-line text-[#7C3AED] text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></i>
              </div>
              <div className="mb-2">
                <span className="text-4xl font-bold text-[#F9FAFB]">R$ 19</span>
                <span className="text-[#9CA3AF] text-lg">,90</span>
              </div>
              <p className="text-[#9CA3AF] text-sm">por mês</p>
              <div className="mt-4 pt-4 border-t border-[#374151]">
                <p className="text-xs text-[#9CA3AF]">Cancele quando quiser</p>
              </div>
            </button>

            {/* Plano Anual - Destaque */}
            <button
              onClick={() => handleUpgrade('yearly')}
              className="group relative bg-gradient-to-br from-[#7C3AED]/20 to-[#EC4899]/20 border-2 border-[#7C3AED] rounded-xl p-6 hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all duration-300 text-left cursor-pointer"
            >
              <div className="absolute -top-3 right-4 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-xs font-bold px-3 py-1 rounded-full">
                ECONOMIZE 17%
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#7C3AED] uppercase tracking-wide">Anual</span>
                <i className="ri-arrow-right-line text-[#7C3AED] text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></i>
              </div>
              <div className="mb-2">
                <span className="text-4xl font-bold text-[#F9FAFB]">R$ 199</span>
                <span className="text-[#9CA3AF] text-lg">,00</span>
              </div>
              <p className="text-[#9CA3AF] text-sm">por ano</p>
              <div className="mt-4 pt-4 border-t border-[#7C3AED]/30">
                <p className="text-xs text-[#7C3AED] font-medium">R$ 16,58/mês • 2 meses grátis</p>
              </div>
            </button>
          </div>

          {/* Botão Continuar Teste */}
          <button
            onClick={handleContinueTrial}
            className="w-full bg-[#374151] text-[#F9FAFB] px-6 py-3 rounded-lg font-medium hover:bg-[#4B5563] transition-all duration-300 whitespace-normal cursor-pointer break-words"
            style={{ wordBreak: 'break-word' }}
          >
            Continuar no teste gratuito ({daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'})
          </button>

          {/* Garantia */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#6B7280] flex items-center justify-center gap-2">
              <i className="ri-shield-check-line text-[#10B981]"></i>
              Garantia de 7 dias • Cancele quando quiser
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}