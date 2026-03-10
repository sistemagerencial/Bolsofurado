import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';

type Plan = 'monthly' | 'yearly';

export function SubscriptionGate({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();
  const { hasAccess, status, daysRemaining, isTrial, planType, loading } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<Plan>(planType === 'yearly' ? 'yearly' : 'monthly');

  // Enquanto carrega, mostrar tela de loading para evitar piscar
  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0E0B16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#9CA3AF] text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Detectar se é plano mensal ou anual expirado
  const isMonthlyExpired = planType === 'monthly' && status === 'expired';
  const isYearlyExpired = planType === 'yearly' && status === 'expired';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 overflow-x-hidden">
      <div className="w-full max-w-2xl px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-12 text-center overflow-hidden">
          {/* Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-lock-line text-5xl text-white"></i>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            {isTrial 
              ? 'Período Gratuito Expirado' 
              : isMonthlyExpired 
                ? 'Plano Mensal Expirado'
                : isYearlyExpired
                  ? 'Plano Anual Expirado'
                  : 'Assinatura Expirada'}
          </h1>

          {/* Description */}
          <p className="text-lg text-slate-600 mb-8">
            {isTrial
              ? 'Seu período de teste de 30 dias chegou ao fim. Assine agora para continuar aproveitando todos os recursos.'
              : isMonthlyExpired
                ? 'Seu plano mensal expirou. Renove sua assinatura para continuar gerenciando suas finanças.'
                : isYearlyExpired
                  ? 'Seu plano anual expirou. Renove sua assinatura para continuar gerenciando suas finanças.'
                  : 'Sua assinatura expirou. Renove seu plano para continuar gerenciando suas finanças.'}
          </p>

          {/* Status Info */}
          <div className="bg-slate-50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-600">Status:</span>
              <span className="px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-semibold whitespace-nowrap">
                {status === 'trial' ? 'Trial Expirado' : 'Expirado'}
              </span>
            </div>
            {daysRemaining !== null && daysRemaining < 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Expirou há:</span>
                <span className="text-sm font-semibold text-slate-900">
                  {Math.abs(daysRemaining)} {Math.abs(daysRemaining) === 1 ? 'dia' : 'dias'}
                </span>
              </div>
            )}
            {(isMonthlyExpired || isYearlyExpired) && (
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-medium text-slate-600">Plano anterior:</span>
                <span className="text-sm font-semibold text-slate-900">
                  {isMonthlyExpired ? 'Mensal' : 'Anual'}
                </span>
              </div>
            )}
          </div>

          {/* Plans Selection */}
          <p className="text-sm font-semibold text-slate-700 mb-3 text-left">Escolha seu plano:</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Mensal */}
            <button
              type="button"
              onClick={() => setSelectedPlan('monthly')}
              className={`relative rounded-xl p-6 border-2 text-left transition-all duration-200 cursor-pointer
                ${selectedPlan === 'monthly'
                  ? 'border-teal-500 bg-teal-50 shadow-md scale-[1.02]'
                  : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/40'
                }`}
            >
              {selectedPlan === 'monthly' && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                  <i className="ri-check-line text-white text-xs"></i>
                </div>
              )}
              <p className="text-sm font-semibold text-teal-700 mb-2">Plano Mensal</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">R$ 19,90</p>
              <p className="text-xs text-slate-500">por mês</p>
            </button>

            {/* Anual */}
            <button
              type="button"
              onClick={() => setSelectedPlan('yearly')}
              className={`relative rounded-xl p-6 border-2 text-left transition-all duration-200 cursor-pointer
                ${selectedPlan === 'yearly'
                  ? 'border-amber-500 bg-amber-50 shadow-md scale-[1.02]'
                  : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/40'
                }`}
            >
              <div className="absolute -top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                Economize 17%
              </div>
              {selectedPlan === 'yearly' && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                  <i className="ri-check-line text-white text-xs"></i>
                </div>
              )}
              <p className="text-sm font-semibold text-orange-700 mb-2">Plano Anual</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">R$ 199,00</p>
              <p className="text-xs text-slate-500">por ano</p>
            </button>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => navigate(`/checkout?plan=${selectedPlan}&reason=expired`)}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 mb-6 sm:whitespace-nowrap cursor-pointer"
          >
            <i className="ri-vip-crown-line text-2xl"></i>
            Renovar {selectedPlan === 'monthly' ? 'Plano Mensal' : 'Plano Anual'} Agora
          </button>

          {/* Features List */}
          <div className="text-left bg-slate-50 rounded-xl p-6">
            <p className="text-sm font-semibold text-slate-900 mb-4">
              O que você terá com a assinatura:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <i className="ri-check-line text-lg text-teal-500 flex-shrink-0"></i>
                <span className="text-sm text-slate-700">Controle ilimitado de receitas e despesas</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="ri-check-line text-lg text-teal-500 flex-shrink-0"></i>
                <span className="text-sm text-slate-700">Gestão completa de investimentos e patrimônio</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="ri-check-line text-lg text-teal-500 flex-shrink-0"></i>
                <span className="text-sm text-slate-700">Relatórios e gráficos avançados</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="ri-check-line text-lg text-teal-500 flex-shrink-0"></i>
                <span className="text-sm text-slate-700">Metas de economia personalizadas</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="ri-check-line text-lg text-teal-500 flex-shrink-0"></i>
                <span className="text-sm text-slate-700">Calculadoras financeiras completas</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}