import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Logo from '../logo/Logo';

interface OnboardingStep {
  id: number;
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  features: { icon: string; text: string }[];
  route?: string;
  image: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    icon: 'ri-dashboard-3-line',
    iconColor: '#7C3AED',
    iconBg: 'from-[#7C3AED]/20 to-[#EC4899]/10',
    title: 'Painel Financeiro',
    description: 'Tenha uma visão completa da sua saúde financeira em um único lugar, com dados em tempo real.',
    features: [
      { icon: 'ri-bar-chart-2-line', text: 'Gráficos de receitas vs despesas' },
      { icon: 'ri-trophy-line', text: 'Score financeiro consolidado' },
      { icon: 'ri-rocket-line', text: 'Projeção financeira anual' },
      { icon: 'ri-drag-move-line', text: 'Cards reorganizáveis por arraste' },
    ],
    route: '/',
    image: 'https://readdy.ai/api/search-image?query=modern%20dark%20financial%20dashboard%20with%20purple%20gradient%20charts%20and%20cards%20showing%20income%20expenses%20balance%20on%20dark%20background%20minimalist%20UI%20design%20professional%20fintech%20app&width=600&height=340&seq=onb1&orientation=landscape',
  },
  {
    id: 2,
    icon: 'ri-arrow-up-down-line',
    iconColor: '#10B981',
    iconBg: 'from-[#10B981]/20 to-[#059669]/10',
    title: 'Receitas & Despesas',
    description: 'Registre e categorize todas as suas entradas e saídas financeiras com facilidade.',
    features: [
      { icon: 'ri-add-circle-line', text: 'Lançamento rápido pelo botão flutuante' },
      { icon: 'ri-price-tag-3-line', text: 'Categorias personalizadas com cores' },
      { icon: 'ri-filter-3-line', text: 'Filtros por mês e categoria' },
      { icon: 'ri-pie-chart-line', text: 'Gráfico de distribuição por categoria' },
    ],
    route: '/receitas',
    image: 'https://readdy.ai/api/search-image?query=dark%20finance%20app%20screen%20showing%20income%20and%20expense%20list%20with%20green%20and%20red%20categories%20tags%20minimalist%20dark%20purple%20theme%20mobile%20fintech%20UI&width=600&height=340&seq=onb2&orientation=landscape',
  },
  {
    id: 3,
    icon: 'ri-line-chart-line',
    iconColor: '#EC4899',
    iconBg: 'from-[#EC4899]/20 to-[#DB2777]/10',
    title: 'Investimentos',
    description: 'Acompanhe toda a sua carteira de investimentos, trades e dividendos em um só lugar.',
    features: [
      { icon: 'ri-stock-line', text: 'Carteira com rentabilidade em tempo real' },
      { icon: 'ri-exchange-line', text: 'Registro de trades com gain/loss' },
      { icon: 'ri-money-dollar-circle-line', text: 'Histórico de dividendos recebidos' },
      { icon: 'ri-alarm-warning-line', text: 'Alertas de preço personalizados' },
    ],
    route: '/investimentos',
    image: 'https://readdy.ai/api/search-image?query=dark%20investment%20portfolio%20app%20with%20pink%20purple%20gradient%20stock%20charts%20candlestick%20graph%20trading%20dashboard%20fintech%20dark%20theme%20professional&width=600&height=340&seq=onb3&orientation=landscape',
  },
  {
    id: 4,
    icon: 'ri-home-4-line',
    iconColor: '#8B5CF6',
    iconBg: 'from-[#8B5CF6]/20 to-[#7C3AED]/10',
    title: 'Patrimônios',
    description: 'Cadastre e acompanhe o valor de todos os seus bens: imóveis, veículos, equipamentos e mais.',
    features: [
      { icon: 'ri-building-line', text: 'Imóveis, veículos e outros bens' },
      { icon: 'ri-funds-line', text: 'Evolução do patrimônio total' },
      { icon: 'ri-edit-line', text: 'Atualização de valores a qualquer momento' },
      { icon: 'ri-pie-chart-2-line', text: 'Distribuição por tipo de ativo' },
    ],
    route: '/patrimonios',
    image: 'https://readdy.ai/api/search-image?query=dark%20wealth%20management%20app%20showing%20assets%20real%20estate%20vehicles%20portfolio%20purple%20violet%20gradient%20cards%20dark%20background%20minimalist%20fintech%20UI&width=600&height=340&seq=onb4&orientation=landscape',
  },
  {
    id: 5,
    icon: 'ri-target-line',
    iconColor: '#FACC15',
    iconBg: 'from-[#FACC15]/20 to-[#F59E0B]/10',
    title: 'Planejamento & Metas',
    description: 'Defina metas de gastos por categoria e acompanhe seu progresso mês a mês.',
    features: [
      { icon: 'ri-calendar-check-line', text: 'Orçamento mensal por categoria' },
      { icon: 'ri-progress-3-line', text: 'Barra de progresso em tempo real' },
      { icon: 'ri-alert-line', text: 'Alertas ao atingir 90% do limite' },
      { icon: 'ri-history-line', text: 'Histórico de metas anteriores' },
    ],
    route: '/planejamento',
    image: 'https://readdy.ai/api/search-image?query=dark%20budget%20planning%20app%20with%20yellow%20gold%20progress%20bars%20goals%20targets%20categories%20dark%20background%20minimalist%20fintech%20financial%20planning%20UI&width=600&height=340&seq=onb5&orientation=landscape',
  },
  {
    id: 6,
    icon: 'ri-calculator-line',
    iconColor: '#F97316',
    iconBg: 'from-[#F97316]/20 to-[#EA580C]/10',
    title: 'Calculadoras Financeiras',
    description: 'Ferramentas poderosas para simular investimentos, financiamentos e calcular sua renda.',
    features: [
      { icon: 'ri-percent-line', text: 'Simulador de juros compostos' },
      { icon: 'ri-bank-line', text: 'Calculadora de financiamento' },
      { icon: 'ri-briefcase-line', text: 'Cálculo de CLT vs PJ' },
      { icon: 'ri-building-2-line', text: 'Simulador de construção' },
    ],
    route: '/calculadoras',
    image: 'https://readdy.ai/api/search-image?query=dark%20financial%20calculator%20app%20with%20orange%20accent%20compound%20interest%20simulation%20charts%20graphs%20dark%20background%20minimalist%20fintech%20tools%20UI&width=600&height=340&seq=onb6&orientation=landscape',
  },
];

interface OnboardingModalProps {
  onClose: () => void;
  onFinish?: () => void;
}

export function OnboardingModal({ onClose, onFinish }: OnboardingModalProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const step = ONBOARDING_STEPS[currentStep];
  const isLast = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirst = currentStep === 0;

  const goTo = (index: number, dir: 'next' | 'prev') => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep(index);
      setAnimating(false);
    }, 220);
  };

  const handleNext = () => {
    if (!isLast) goTo(currentStep + 1, 'next');
  };

  const handlePrev = () => {
    if (!isFirst) goTo(currentStep - 1, 'prev');
  };

  const handleFinish = () => {
    localStorage.setItem('bolsofurado_onboarding_done', 'true');
    onClose();
    // Redirecionar diretamente para o dashboard sem passar pela tela de assinatura
    navigate('/', { replace: true });
  };

  const handleGoToFeature = () => {
    localStorage.setItem('bolsofurado_onboarding_done', 'true');
    onClose();
    if (step.route) navigate(step.route, { replace: true });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && !isLast) handleNext();
      if (e.key === 'ArrowLeft' && !isFirst) handlePrev();
      if (e.key === 'Escape') handleFinish();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentStep, animating]);

  const modal = (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-start sm:items-center justify-center z-[200] p-3">
      <div className="bg-[#0E0B16] border border-white/10 rounded-2xl w-full max-w-2xl shadow-xl shadow-black/50 overflow-hidden relative max-h-[90vh]">

        {/* Skip button */}
        <button
          onClick={handleFinish}
          className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#9CA3AF] hover:text-[#F9FAFB] text-xs font-medium transition-all cursor-pointer whitespace-nowrap"
        >
          Pular tour
        </button>

        {/* Logo no topo (usar Logo do projeto) */}
        <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
          <Logo width={120} height={32} showText={false} className="h-8 w-auto" />
        </div>

        {/* Step dots */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
          {ONBOARDING_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > currentStep ? 'next' : 'prev')}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                i === currentStep
                  ? 'w-6 h-2 bg-gradient-to-r from-[#7C3AED] to-[#EC4899]'
                  : i < currentStep
                  ? 'w-2 h-2 bg-[#7C3AED]/60'
                  : 'w-2 h-2 bg-white/15'
              }`}
            />
          ))}
        </div>

        {/* Image area */}
        <div className="relative h-40 sm:h-48 overflow-hidden">
          <img
            src={step.image}
            alt={step.title}
            className={`w-full h-full object-cover object-top transition-all duration-300 ${
              animating
                ? direction === 'next'
                  ? 'opacity-0 translate-x-4'
                  : 'opacity-0 -translate-x-4'
                : 'opacity-100 translate-x-0'
            }`}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0E0B16]" />
          {/* Step number badge */}
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1">
            <span className="text-xs text-[#9CA3AF]">{currentStep + 1} / {ONBOARDING_STEPS.length}</span>
          </div>
        </div>

        {/* Content */}
        <div
          className={`px-5 sm:px-6 pb-5 sm:pb-6 transition-all duration-220 ${
            animating
              ? direction === 'next'
                ? 'opacity-0 translate-x-4'
                : 'opacity-0 -translate-x-4'
              : 'opacity-100 translate-x-0'
          }`}
        >
          {/* Icon + Title */}
          <div className="flex items-center gap-3 mb-3 -mt-5 relative z-10">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.iconBg} border border-white/10 flex items-center justify-center flex-shrink-0 shadow-md`}>
              <i className={`${step.icon} text-xl`} style={{ color: step.iconColor }}></i>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#F9FAFB]">{step.title}</h2>
              <p className="text-sm text-[#9CA3AF] mt-0.5">{step.description}</p>
            </div>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            {step.features.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2.5 hover:bg-white/[0.06] transition-all"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${step.iconColor}20` }}
                >
                  <i className={`${feature.icon} text-sm`} style={{ color: step.iconColor }}></i>
                </div>
                <span className="text-sm text-[#D1D5DB]">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            {/* Prev */}
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                isFirst
                  ? 'border-white/5 text-white/20 cursor-not-allowed'
                  : 'border-white/10 text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'
              }`}
            >
              <i className="ri-arrow-left-s-line text-lg"></i>
              Anterior
            </button>

            {/* Center: go to feature */}
            {step.route && step.route !== '/' && (
              <button
                onClick={handleGoToFeature}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
                style={{
                  borderColor: `${step.iconColor}40`,
                  color: step.iconColor,
                  backgroundColor: `${step.iconColor}10`,
                }}
              >
                <i className="ri-external-link-line text-sm"></i>
                Explorar agora
              </button>
            )}

            {/* Next / Finish */}
            {isLast ? (
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white text-sm font-semibold transition-all cursor-pointer shadow-md shadow-[#7C3AED]/20 whitespace-nowrap"
              >
                <i className="ri-check-line text-lg"></i>
                Começar agora!
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white text-sm font-semibold transition-all cursor-pointer shadow-md shadow-[#7C3AED]/15 whitespace-nowrap"
              >
                Próximo
                <i className="ri-arrow-right-s-line text-lg"></i>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
