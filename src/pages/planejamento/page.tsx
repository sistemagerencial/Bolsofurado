import { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { planningData } from '../../mocks/financialData';

export default function PlanejamentoPage() {
  const [selectedMonth, setSelectedMonth] = useState('2024-06');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    if (status === 'ok') return '#22C55E';
    if (status === 'warning') return '#FACC15';
    return '#EF4444';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'ok') return 'Dentro da Meta';
    if (status === 'warning') return 'Atenção';
    return 'Estourado';
  };

  const totalBudget = planningData.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = planningData.reduce((sum, item) => sum + item.spent, 0);
  const totalDifference = totalBudget - totalSpent;

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#F9FAFB] mb-2">Planejamento Mensal</h1>
            <p className="text-[#9CA3AF]">Defina e acompanhe as metas de cada categoria</p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-[#16122A] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-[#16122A] rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#EC4899]/20 flex items-center justify-center">
                <i className="ri-target-line text-2xl text-[#7C3AED]"></i>
              </div>
              <div>
                <p className="text-sm text-[#9CA3AF] mb-1">Orçamento Total</p>
                <p className="text-2xl font-bold text-[#F9FAFB]">{formatCurrency(totalBudget)}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#16122A] rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EC4899]/20 to-[#7C3AED]/20 flex items-center justify-center">
                <i className="ri-arrow-down-circle-line text-2xl text-[#EC4899]"></i>
              </div>
              <div>
                <p className="text-sm text-[#9CA3AF] mb-1">Total Gasto</p>
                <p className="text-2xl font-bold text-[#F9FAFB]">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#16122A] rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#22C55E]/20 to-[#22C55E]/10 flex items-center justify-center">
                <i className="ri-wallet-3-line text-2xl text-[#22C55E]"></i>
              </div>
              <div>
                <p className="text-sm text-[#9CA3AF] mb-1">Saldo</p>
                <p className="text-2xl font-bold text-[#22C55E]">{formatCurrency(totalDifference)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Planejamento */}
        <div className="bg-[#16122A] rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-bold text-[#F9FAFB]">Categorias</h2>
            <p className="text-sm text-[#9CA3AF] mt-1">Acompanhamento detalhado por categoria</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-[#0E0B16]">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Meta Definida
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Valor Gasto
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Diferença R$
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Diferença %
                  </th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Progresso
                  </th>
                </tr>
              </thead>
              <tbody>
                {planningData.map((item, index) => {
                  const statusColor = getStatusColor(item.status);
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-white/5 hover:bg-white/5 transition-all ${
                        index === planningData.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      <td className="px-6 py-5">
                        <span className="text-sm font-semibold text-[#F9FAFB]">{item.category}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-sm text-[#F9FAFB] font-medium">
                          {formatCurrency(item.budget)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-sm text-[#F9FAFB] font-medium">
                          {formatCurrency(item.spent)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: item.difference > 0 ? '#22C55E' : '#EF4444' }}
                        >
                          {formatCurrency(item.difference)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span
                          className="text-sm font-bold"
                          style={{ color: statusColor }}
                        >
                          {item.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold"
                            style={{
                              backgroundColor: `${statusColor}20`,
                              color: statusColor
                            }}
                          >
                            {getStatusLabel(item.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex-1 max-w-[120px] h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(item.percentage, 100)}%`,
                                backgroundColor: statusColor
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas */}
        <div className="mt-8 bg-[#16122A] rounded-2xl p-6 border border-white/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FACC15]/20 to-[#EF4444]/20 flex items-center justify-center flex-shrink-0">
              <i className="ri-alert-line text-2xl text-[#FACC15]"></i>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#F9FAFB] mb-2">Alertas Inteligentes</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FACC15]"></div>
                  <span>Marketing atingiu 92.5% da meta mensal</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FACC15]"></div>
                  <span>Pessoal está próximo do limite (90%)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FACC15]"></div>
                  <span>Tecnologia atingiu 89.5% do orçamento</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
