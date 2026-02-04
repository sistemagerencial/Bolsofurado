import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabaseClient';

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

  const [planningData, setPlanningData] = useState<any[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalDifference, setTotalDifference] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlan, setNewPlan] = useState({ category: '', budget: '', spent: '' });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data } = await supabase.from('planning').select('*');
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        setPlanningData(list as any[]);
        const budget = list.reduce((s: number, it: any) => s + Number(it.budget || 0), 0);
        const spent = list.reduce((s: number, it: any) => s + Number(it.spent || 0), 0);
        setTotalBudget(budget);
        setTotalSpent(spent);
        setTotalDifference(budget - spent);
      } catch (err) {
        // ignore
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleAddPlan = async () => {
    if (!newPlan.category || !newPlan.budget) {
      alert('Preencha categoria e orçamento para adicionar a meta.');
      return;
    }
    try {
      const payload = {
        category: newPlan.category,
        budget: Number(String(newPlan.budget).replace(',', '.')) || 0,
        spent: Number(String(newPlan.spent).replace(',', '.')) || 0,
        difference: (Number(String(newPlan.budget).replace(',', '.')) || 0) - (Number(String(newPlan.spent).replace(',', '.')) || 0),
        percentage: 0,
        status: 'ok'
      };
      const { error } = await supabase.from('planning').insert(payload);
      if (error) throw error;
      // reload
      const { data } = await supabase.from('planning').select('*');
      setPlanningData(Array.isArray(data) ? data : []);
      setShowAddModal(false);
      setNewPlan({ category: '', budget: '', spent: '' });
    } catch (err) {
      console.error('Erro ao adicionar meta', err);
      alert('Erro ao adicionar meta. Veja console.');
    }
  };

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

          {/* Floating Add Meta Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-[#7C3AED] to-[#EC4899] rounded-full shadow-2xl shadow-[#7C3AED]/30 flex items-center justify-center hover:scale-110 transition-all cursor-pointer group z-40"
          >
            <i className="ri-add-line text-2xl lg:text-3xl text-white group-hover:rotate-90 transition-transform"></i>
          </button>

          {/* Modal Adicionar Meta */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
              <div className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#F9FAFB]">Nova Meta</h3>
                  <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
                    <i className="ri-close-line text-lg text-[#F9FAFB]"></i>
                  </button>
                </div>
                <div className="p-4">
                  <label className="block text-sm text-[#9CA3AF] mb-2">Categoria</label>
                  <input className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-3 py-2 text-[#F9FAFB] mb-3" value={newPlan.category} onChange={(e) => setNewPlan({ ...newPlan, category: e.target.value })} />
                  <label className="block text-sm text-[#9CA3AF] mb-2">Orçamento (R$)</label>
                  <input className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-3 py-2 text-[#F9FAFB] mb-3" value={newPlan.budget} onChange={(e) => setNewPlan({ ...newPlan, budget: e.target.value })} />
                  <label className="block text-sm text-[#9CA3AF] mb-2">Gasto Inicial (opcional)</label>
                  <input className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-3 py-2 text-[#F9FAFB] mb-4" value={newPlan.spent} onChange={(e) => setNewPlan({ ...newPlan, spent: e.target.value })} />
                  <div className="flex gap-3">
                    <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 bg-white/5 rounded-xl">Cancelar</button>
                    <button onClick={handleAddPlan} className="flex-1 px-4 py-2 bg-gradient-to-br from-[#7C3AED] to-[#EC4899] text-white rounded-xl">Adicionar</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Alertas */}
        <div className="mt-8 bg-[#16122A] rounded-2xl p-6 border border-white/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FACC15]/20 to-[#EF4444]/20 flex items-center justify-center flex-shrink-0">
              <i className="ri-alert-line text-2xl text-[#FACC15]"></i>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#F9FAFB] mb-2">Alertas Inteligentes</h3>
              <div className="space-y-2">
                {planningData.length === 0 && (
                  <div className="text-sm text-[#9CA3AF]">Nenhum alerta no momento.</div>
                )}
                {planningData.map((item) => {
                  const percent = Number(item.percentage || 0);
                  if (percent < 70) return null;
                  const color = percent >= 90 ? '#FACC15' : '#FACC15';
                  return (
                    <div key={item.id || item.category} className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></div>
                      <span>{item.category} atingiu {percent}% da meta mensal</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
