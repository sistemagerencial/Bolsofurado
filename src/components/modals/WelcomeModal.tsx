import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

interface WelcomeModalProps {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const navigate = useNavigate();
  const { profile } = useAuthContext();
  const [daysRemaining, setDaysRemaining] = useState(30);

  useEffect(() => {
    if (profile?.trial_end_date) {
      const endDate = new Date(profile.trial_end_date);
      const today = new Date();
      if (!isNaN(endDate.getTime())) {
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(Math.max(0, diffDays));
      } else {
        setDaysRemaining(0);
      }
    }
  }, [profile]);

  const getFirstName = (): string => {
    if (profile?.name && profile.name.trim()) {
      const firstName = profile.name.trim().split(' ')[0];
      return firstName.charAt(0).toUpperCase() + firstName.slice(1);
    }
    return 'Usuário';
  };

  const handleSelectPlan = (plan: 'monthly' | 'yearly') => {
    localStorage.setItem('welcome_seen', 'true');
    onClose();
    navigate(`/checkout?plan=${plan}`);
  };

  const handleContinueTrial = () => {
    localStorage.setItem('welcome_seen', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
      <div className="bg-[#0E0B16] border border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl overflow-y-auto" style={{ maxHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 32px)' }}>

        {/* Header */}
        <div className="relative p-8 sm:p-10 text-center border-b border-white/10 bg-gradient-to-br from-[#7C3AED]/10 to-[#EC4899]/10">
          <div className="flex justify-center mb-5">
            <img
              src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/329df8a96fbfb4f61300025c05375e5e.png"
              alt="Bolso Furado"
              className="h-16 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#F9FAFB] mb-3">
            Bem-vindo,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#EC4899]">
              {getFirstName()}
            </span>
            ! 🎉
          </h1>
          <p className="text-[#9CA3AF] text-base sm:text-lg max-w-2xl mx-auto">
            Parabéns por dar o primeiro passo rumo ao controle financeiro total!
          </p>
        </div>

        {/* Trial Info */}
        <div className="px-8 sm:px-10 py-6 bg-gradient-to-r from-[#7C3AED]/5 to-[#EC4899]/5 border-b border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#EC4899] flex items-center justify-center flex-shrink-0">
              <i className="ri-gift-line text-3xl text-white"></i>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-[#F9FAFB] mb-1">
                {daysRemaining} dias grátis
              </p>
              <p className="text-sm text-[#9CA3AF]">
                Aproveite todos os recursos premium sem compromisso
              </p>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="p-8 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB] text-center mb-3">
            Quer garantir acesso ilimitado?
          </h2>
          <p className="text-[#9CA3AF] text-center mb-8 max-w-2xl mx-auto">
            Assine agora e continue aproveitando todas as funcionalidades após o período gratuito
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Plano Mensal */}
            <div className="bg-[#16122A] border border-white/10 rounded-2xl p-6 hover:border-[#7C3AED]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#7C3AED]/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#F9FAFB]">Plano Mensal</h3>
                <div className="w-10 h-10 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center">
                  <i className="ri-calendar-line text-[#7C3AED] text-xl"></i>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-[#7C3AED]">R$ 19,90</span>
                  <span className="text-[#9CA3AF] text-sm">/mês</span>
                </div>
                <p className="text-xs text-[#9CA3AF]">Renovação automática mensal</p>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  'Controle completo de receitas e despesas',
                  'Gestão de investimentos e patrimônios',
                  'Relatórios e gráficos detalhados',
                  'Metas e planejamento financeiro',
                  'Calculadoras financeiras avançadas',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#9CA3AF]">
                    <i className="ri-check-line text-[#10B981] text-lg flex-shrink-0 mt-0.5"></i>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelectPlan('monthly')}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white font-semibold transition-all cursor-pointer shadow-lg shadow-[#7C3AED]/20 whitespace-normal break-words"
              >
                Assinar Mensal
              </button>
            </div>

            {/* Plano Anual */}
            <div className="bg-[#16122A] border-2 border-[#EC4899] rounded-2xl p-6 relative hover:shadow-xl hover:shadow-[#EC4899]/10 transition-all duration-300">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#EC4899] to-[#DB2777] rounded-full">
                <span className="text-xs font-bold text-white whitespace-nowrap">MAIS POPULAR</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#F9FAFB]">Plano Anual</h3>
                <div className="w-10 h-10 rounded-lg bg-[#EC4899]/20 flex items-center justify-center">
                  <i className="ri-vip-crown-line text-[#EC4899] text-xl"></i>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-bold text-[#EC4899]">R$ 199,00</span>
                  <span className="text-[#9CA3AF] text-sm">/ano</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-[#9CA3AF] line-through">R$ 238,80</span>
                  <span className="text-xs font-bold text-[#10B981] bg-[#10B981]/20 px-2 py-0.5 rounded-full">
                    Economize 17%
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF]">Apenas R$ 16,58/mês</p>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  'Controle completo de receitas e despesas',
                  'Gestão de investimentos e patrimônios',
                  'Relatórios e gráficos detalhados',
                  'Metas e planejamento financeiro',
                  'Calculadoras financeiras avançadas',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#9CA3AF]">
                    <i className="ri-check-line text-[#10B981] text-lg flex-shrink-0 mt-0.5"></i>
                    <span>{item}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2 text-sm text-[#EC4899] font-semibold">
                  <i className="ri-star-line text-[#EC4899] text-lg flex-shrink-0 mt-0.5"></i>
                  <span>2 meses grátis no plano anual</span>
                </li>
              </ul>
              <button
                onClick={() => handleSelectPlan('yearly')}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#DB2777] hover:from-[#DB2777] hover:to-[#BE185D] text-white font-semibold transition-all cursor-pointer shadow-lg shadow-[#EC4899]/20 whitespace-normal break-words"
              >
                Assinar Anual
              </button>
            </div>
          </div>

          {/* Ficar no teste grátis */}
          <div className="text-center">
            <button
              onClick={handleContinueTrial}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[#9CA3AF] hover:text-[#F9FAFB] font-medium transition-all cursor-pointer whitespace-normal break-words"
            >
              <i className="ri-time-line mr-2"></i>
              Ficar no teste grátis
            </button>
            <p className="text-xs text-[#9CA3AF] mt-3">
              Você pode assinar a qualquer momento durante o período de teste
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
