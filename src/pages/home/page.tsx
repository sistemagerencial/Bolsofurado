
import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthProvider';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showReceitaModal, setShowReceitaModal] = useState(false);
  const [showDespesaModal, setShowDespesaModal] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '#EF4444';
    if (percentage >= 70) return '#FACC15';
    return '#22C55E';
  };

  const getStatusColor = (status: string) => {
    if (status === 'critical') return '#EF4444';
    if (status === 'warning') return '#FACC15';
    return '#22C55E';
  };

  const getStatusText = (status: string) => {
    if (status === 'critical') return 'CRÍTICO';
    if (status === 'warning') return 'ATENÇÃO';
    return 'OK';
  };

  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyOverview, setMonthlyOverview] = useState<any>({ totalPlanned: 0, totalSpent: 0, availableBalance: 0, alerts: 0 });
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [saldoAcumulado, setSaldoAcumulado] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data: cats } = await supabase.from('categories').select('*');
        const { data: months } = await supabase.from('monthly_metrics').select('*');
        const { data: expenses } = await supabase.from('despesas').select('amount,date');
        const { data: revenues } = await supabase.from('receitas').select('amount,date');
        if (!mounted) return;
        setCategoryData(Array.isArray(cats) ? cats : []);
        setEvolutionData(Array.isArray(months) ? months : []);
        const totalSpent = Array.isArray(expenses) ? expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0) : 0;
        const totalRevenue = Array.isArray(revenues) ? revenues.reduce((s: number, r: any) => s + Number(r.amount || 0), 0) : 0;
        setMonthlyOverview({ totalPlanned: 0, totalSpent, totalRevenue, availableBalance: totalRevenue - totalSpent, alerts: 0 });
        setSaldoAcumulado((Array.isArray(months) ? months : []).reduce((s: number, m: any) => s + Number(m.actual || 0 || m.total || 0), 0));
      } catch (err) {
        // ignore
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const { user } = useAuth();
  const fullName = user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Executivo');
  const firstName = String(fullName).split(' ')[0];

  // Data atual formatada para input date
  const today = new Date().toISOString().split('T')[0];

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 w-full">
        {/* Saudação */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F9FAFB]">
            Olá!! <span className="text-[#7C3AED]">{firstName}</span>
          </h1>
          <p className="text-sm sm:text-base text-[#9CA3AF] mt-1">Bem-vindo ao seu painel financeiro</p>
        </div>

        {/* Cards Principais - Grid responsivo com transição suave */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {/* Card Saldo Acumulado */}
          <div className="bg-gradient-to-br from-[#7C3AED]/10 to-[#EC4899]/5 border border-[#7C3AED]/20 rounded-xl p-4 sm:p-6 transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-[#7C3AED]/10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center">
                <i className="ri-wallet-3-line text-[#7C3AED] text-xl sm:text-2xl"></i>
              </div>
              <span className={`text-xs sm:text-sm font-medium ${saldoAcumulado >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {saldoAcumulado >= 0 ? 'Positivo' : 'Negativo'}
              </span>
            </div>
            <h3 className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">Saldo Acumulado</h3>
            <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${saldoAcumulado >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {formatCurrency(saldoAcumulado)}
            </p>
            <p className="text-xs text-[#9CA3AF] mt-2">Líquido de todos os meses</p>
          </div>

          {/* Card Receitas do Mês */}
          <div className="bg-gradient-to-br from-[#10B981]/10 to-[#059669]/5 border border-[#10B981]/20 rounded-xl p-4 sm:p-6 transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-[#10B981]/10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#10B981]/20 flex items-center justify-center">
                <i className="ri-arrow-up-line text-[#10B981] text-xl sm:text-2xl"></i>
              </div>
              <span className="text-xs sm:text-sm text-[#10B981] font-medium">+12.5%</span>
            </div>
            <h3 className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">Receitas do Mês</h3>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#10B981]">
              {formatCurrency(monthlyOverview.totalRevenue || 0)}
            </p>
          </div>

          {/* Card Despesas do Mês */}
          <div className="bg-gradient-to-br from-[#EF4444]/10 to-[#DC2626]/5 border border-[#EF4444]/20 rounded-xl p-4 sm:p-6 transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-[#EF4444]/10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#EF4444]/20 flex items-center justify-center">
                <i className="ri-arrow-down-line text-[#EF4444] text-xl sm:text-2xl"></i>
              </div>
              <span className="text-xs sm:text-sm text-[#EF4444] font-medium">-8.3%</span>
            </div>
            <h3 className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">Despesas do Mês</h3>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#EF4444]">
              {formatCurrency(monthlyOverview.totalSpent)}
            </p>
          </div>
        </div>

        {/* Metas do Mês */}
        <div className="bg-[#16122A] border border-white/5 rounded-xl p-4 sm:p-6 mb-6 lg:mb-8 transition-all duration-300 ease-in-out">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center">
              <i className="ri-target-line text-[#7C3AED] text-lg sm:text-xl"></i>
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#F9FAFB]">Metas do Mês</h2>
          </div>

          {/* Tabela Responsiva - Mobile: Cards Verticais */}
          <div className="space-y-3 lg:hidden">
            {categoryData.map((category) => {
              const difference = category.budget - category.spent;
              let status = 'ok';
              if (category.percentage >= 100) status = 'critical';
              else if (category.percentage >= 90) status = 'warning';

              const statusColor = getStatusColor(status);
              const progressColor = getProgressColor(category.percentage);

              return (
                <div
                  key={category.id}
                  className="bg-[#0E0B16] border border-white/5 rounded-lg p-4 cursor-pointer hover:bg-white/5 transition-all duration-200"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-[#F9FAFB]">{category.name}</h3>
                      <span 
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mt-1"
                        style={{ 
                          backgroundColor: `${statusColor}20`,
                          color: statusColor
                        }}
                      >
                        {getStatusText(status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-[#9CA3AF] mb-1">Orçamento</p>
                      <p className="text-sm font-semibold text-[#F9FAFB]">{formatCurrency(category.budget)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9CA3AF] mb-1">Gasto</p>
                      <p className="text-sm font-semibold text-[#F9FAFB]">{formatCurrency(category.spent)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9CA3AF] mb-1">Diferença</p>
                      <p className="text-sm font-semibold" style={{ color: difference >= 0 ? '#22C55E' : '#EF4444' }}>
                        {formatCurrency(difference)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9CA3AF] mb-1">Progresso</p>
                      <p className="text-sm font-semibold text-[#F9FAFB]">{category.percentage.toFixed(0)}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(category.percentage, 100)}%`,
                          backgroundColor: progressColor
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabela Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] whitespace-nowrap">Categoria</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#9CA3AF] whitespace-nowrap">Orçamento</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#9CA3AF] whitespace-nowrap">Gasto</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#9CA3AF] whitespace-nowrap">Diferença</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#9CA3AF] whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] whitespace-nowrap">Progresso</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((category) => {
                  const difference = category.budget - category.spent;
                  let status = 'ok';
                  if (category.percentage >= 100) status = 'critical';
                  else if (category.percentage >= 90) status = 'warning';

                  const statusColor = getStatusColor(status);
                  const progressColor = getProgressColor(category.percentage);

                  return (
                    <tr 
                      key={category.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: category.color }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-[#F9FAFB]">{category.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right text-sm text-[#9CA3AF]">
                        {formatCurrency(category.budget)}
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-semibold text-[#F9FAFB]">
                        {formatCurrency(category.spent)}
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-semibold" style={{ color: difference >= 0 ? '#22C55E' : '#EF4444' }}>
                        {formatCurrency(difference)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span 
                          className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-block"
                          style={{ 
                            backgroundColor: `${statusColor}20`,
                            color: statusColor
                          }}
                        >
                          {getStatusText(status)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(category.percentage, 100)}%`,
                                backgroundColor: progressColor
                              }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-[#F9FAFB] w-12 text-right">
                            {category.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Evolução Mensal */}
        <div className="bg-[#16122A] border border-white/5 rounded-xl p-4 sm:p-6 transition-all duration-300 ease-in-out">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center">
              <i className="ri-line-chart-line text-[#7C3AED] text-lg sm:text-xl"></i>
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#F9FAFB]">Evolução Mensal – Valor Líquido</h2>
          </div>

          <div className="relative h-48 sm:h-64 lg:h-80">
            {evolutionData.length > 0 ? (
              <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Área sob a linha */}
              <path
                d={`M 0 ${300 - (evolutionData[0].value / 80)} ${evolutionData.map((item, index) => {
                  const x = (index / (evolutionData.length - 1)) * 800;
                  const y = 300 - (item.value / 80);
                  return `L ${x} ${y}`;
                }).join(' ')} L 800 300 L 0 300 Z`}
                fill="url(#areaGradient)"
              />
              
              {/* Linha */}
              <path
                d={`M 0 ${300 - (evolutionData[0].value / 80)} ${evolutionData.map((item, index) => {
                  const x = (index / (evolutionData.length - 1)) * 800;
                  const y = 300 - (item.value / 80);
                  return `L ${x} ${y}`;
                }).join(' ')}`}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Pontos */}
              {evolutionData.map((item, index) => {
                const x = (index / (evolutionData.length - 1)) * 800;
                const y = 300 - (item.value / 80);
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#7C3AED"
                    stroke="#F9FAFB"
                    strokeWidth="2"
                  />
                );
              })}
              </svg>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-[#9CA3AF]">Sem dados para exibir</div>
            )}
          </div>

          {/* Legenda */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mt-4 sm:mt-6">
            {evolutionData.map((item, index) => (
              <div key={index} className="text-center">
                <p className="text-xs text-[#9CA3AF] mb-1">{item.month}</p>
                <p className="text-xs sm:text-sm font-medium text-[#F9FAFB]">{formatCurrency(item.value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Botões Flutuantes */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col gap-3 sm:gap-4 z-40">
        <button
          onClick={() => setShowReceitaModal(true)}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center cursor-pointer hover:scale-110 transition-all shadow-lg shadow-[#10B981]/50"
        >
          <i className="ri-add-line text-white text-2xl sm:text-3xl"></i>
        </button>

        <button
          onClick={() => setShowDespesaModal(true)}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center cursor-pointer hover:scale-110 transition-all shadow-lg shadow-[#EF4444]/50"
        >
          <i className="ri-subtract-line text-white text-2xl sm:text-3xl"></i>
        </button>
      </div>

      {/* Modal de Categoria */}
      {selectedCategory && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCategory(null)}
        >
          <div
            className="bg-[#16122A] rounded-2xl p-6 lg:p-8 border border-white/10 max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#F9FAFB]">Detalhes da Categoria</h2>
              <button
                onClick={() => setSelectedCategory(null)}
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
              >
                <i className="ri-close-line text-xl text-[#F9FAFB]"></i>
              </button>
            </div>
            <p className="text-[#9CA3AF] mb-4">Informações detalhadas sobre os gastos desta categoria</p>
            <div className="bg-[#0E0B16] rounded-xl p-6 border border-white/5">
              <p className="text-[#F9FAFB]">Conteúdo do modal em desenvolvimento...</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Receita */}
      {showReceitaModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowReceitaModal(false)}
        >
          <div
            className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#16122A] p-6 border-b border-white/10 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#22C55E]/20 to-[#16A34A]/20 flex items-center justify-center">
                  <i className="ri-add-line text-2xl text-[#22C55E]"></i>
                </div>
                <h2 className="text-2xl font-bold text-[#F9FAFB]">Nova Receita</h2>
              </div>
              <button
                onClick={() => setShowReceitaModal(false)}
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
              >
                <i className="ri-close-line text-xl text-[#F9FAFB]"></i>
              </button>
            </div>

            <div className="p-6">
              <form className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Data</label>
                  <input
                    type="date"
                    defaultValue={today}
                    className="w-full bg-[#0E0B16] border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] text-sm focus:outline-none focus:border-[#22C55E] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Categoria</label>
                  <div className="flex gap-2">
                    <select className="flex-1 bg-[#0E0B16] border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] text-sm focus:outline-none focus:border-[#22C55E] transition-all cursor-pointer">
                      <option>Salário</option>
                      <option>Freelance</option>
                      <option>Investimentos</option>
                      <option>Vendas</option>
                      <option>Outros</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryModal(true)}
                      className="w-12 h-12 rounded-lg bg-[#22C55E]/20 hover:bg-[#22C55E]/30 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                    >
                      <i className="ri-add-line text-xl text-[#22C55E]"></i>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Salário mensal"
                    className="w-full bg-[#0E0B16] border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#22C55E] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Valor</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      className="w-full bg-[#0E0B16] border border-white/10 rounded-lg pl-12 pr-4 py-3 text-[#F9FAFB] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#22C55E] transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReceitaModal(false)}
                    className="flex-1 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-[#F9FAFB] font-medium transition-all cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white font-semibold transition-all cursor-pointer shadow-lg shadow-[#22C55E]/20 whitespace-nowrap"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Despesa */}
      {showDespesaModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDespesaModal(false)}
        >
          <div
            className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#16122A] p-6 border-b border-white/10 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#EF4444]/20 to-[#DC2626]/20 flex items-center justify-center">
                  <i className="ri-subtract-line text-2xl text-[#EF4444]"></i>
                </div>
                <h2 className="text-2xl font-bold text-[#F9FAFB]">Nova Despesa</h2>
              </div>
              <button
                onClick={() => setShowDespesaModal(false)}
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
              >
                <i className="ri-close-line text-xl text-[#F9FAFB]"></i>
              </button>
            </div>

            <div className="p-6">
              <form className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Data</label>
                  <input
                    type="date"
                    defaultValue={today}
                    className="w-full bg-[#0E0B16] border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] text-sm focus:outline-none focus:border-[#EF4444] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Categoria</label>
                  <div className="flex gap-2">
                    <select className="flex-1 bg-[#0E0B16] border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] text-sm focus:outline-none focus:border-[#EF4444] transition-all cursor-pointer">
                      <option>Alimentação</option>
                      <option>Transporte</option>
                      <option>Moradia</option>
                      <option>Saúde</option>
                      <option>Educação</option>
                      <option>Lazer</option>
                      <option>Outros</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryModal(true)}
                      className="w-12 h-12 rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/30 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                    >
                      <i className="ri-add-line text-xl text-[#EF4444]"></i>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Supermercado"
                    className="w-full bg-[#0E0B16] border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#EF4444] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Valor</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      className="w-full bg-[#0E0B16] border border-white/10 rounded-lg pl-12 pr-4 py-3 text-[#F9FAFB] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#EF4444] transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDespesaModal(false)}
                    className="flex-1 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-[#F9FAFB] font-medium transition-all cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] text-white font-semibold transition-all cursor-pointer shadow-lg shadow-[#EF4444]/20 whitespace-nowrap"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Categoria */}
      {showNewCategoryModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => setShowNewCategoryModal(false)}
        >
          <div
            className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#F9FAFB]">Nova Categoria</h3>
              <button
                onClick={() => setShowNewCategoryModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
              >
                <i className="ri-close-line text-lg text-[#F9FAFB]"></i>
              </button>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Nome da Categoria</label>
                  <input
                    type="text"
                    placeholder="Ex: Viagens"
                    className="w-full bg-[#0E0B16] border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryModal(false)}
                    className="flex-1 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-[#F9FAFB] font-medium transition-all cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    onClick={() => setShowNewCategoryModal(false)}
                    className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white font-semibold transition-all cursor-pointer shadow-lg shadow-[#7C3AED]/20 whitespace-nowrap"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
