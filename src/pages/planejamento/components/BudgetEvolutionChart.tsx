import { useState, useEffect, useCallback } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface MonthData {
  label: string;
  month: number;
  year: number;
  meta: number;
  gasto: number;
  saldo: number;
  percentual: number;
}

interface CategoryMonthData {
  label: string;
  month: number;
  year: number;
  [key: string]: number | string;
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-4 min-w-[180px]">
      <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
            <span className="text-xs text-gray-600">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-gray-900">
            {typeof entry.value === 'number' && entry.name !== 'Aproveitamento (%)'
              ? formatCurrency(entry.value)
              : `${entry.value?.toFixed(1)}%`}
          </span>
        </div>
      ))}
    </div>
  );
};

const CategoryTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-4 min-w-[200px]">
      <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
            <span className="text-xs text-gray-600 max-w-[100px] truncate">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-gray-900">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function BudgetEvolutionChart() {
  const { user } = useAuthContext();
  const [view, setView] = useState<'geral' | 'categorias'>('geral');
  const [months, setMonths] = useState(6);
  const [generalData, setGeneralData] = useState<MonthData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryMonthData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const getLast = useCallback((n: number) => {
    const result: { year: number; month: number }[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    return result;
  }, []);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const periods = getLast(months);
      const minYear = periods[0].year;
      const maxYear = periods[periods.length - 1].year;

      // Busca budgets
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .gte('year', minYear)
        .lte('year', maxYear);

      // Busca despesas
      const startDate = `${periods[0].year}-${String(periods[0].month).padStart(2, '0')}-01`;
      const lastPeriod = periods[periods.length - 1];
      const lastDay = new Date(lastPeriod.year, lastPeriod.month, 0).getDate();
      const endDate = `${lastPeriod.year}-${String(lastPeriod.month).padStart(2, '0')}-${lastDay}`;

      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      // Busca categorias de despesa
      const { data: cats } = await supabase
        .from('categories')
        .select('id, name, color')
        .eq('user_id', user.id)
        .eq('type', 'despesa');

      const catList: Category[] = cats || [];
      setCategories(catList);

      // Monta dados gerais
      const general: MonthData[] = periods.map(({ year, month }) => {
        const monthBudgets = (budgets || []).filter(b => b.year === year && b.month === month);
        const meta = monthBudgets.reduce((s: number, b: any) => s + Number(b.amount), 0);

        // Soma apenas despesas das categorias que têm meta neste mês
        const budgetCategoryIds = new Set(monthBudgets.map((b: any) => b.category_id).filter(Boolean));

        const gasto = (expenses || [])
          .filter(e => {
            const d = e.date.substring(0, 7);
            const matchMonth = d === `${year}-${String(month).padStart(2, '0')}`;
            // Se há metas cadastradas, filtra só pelas categorias com meta
            // Se não há metas, não soma nada
            const matchCategory = budgetCategoryIds.size > 0
              ? budgetCategoryIds.has(e.category_id)
              : false;
            return matchMonth && matchCategory;
          })
          .reduce((s: number, e: any) => s + Number(e.amount), 0);

        const saldo = meta - gasto;
        const percentual = meta > 0 ? Math.round((gasto / meta) * 100) : 0;

        return {
          label: `${MONTH_NAMES[month - 1]}/${String(year).slice(2)}`,
          month,
          year,
          meta,
          gasto,
          saldo,
          percentual,
        };
      });
      setGeneralData(general);

      // Monta dados por categoria
      const catData: CategoryMonthData[] = periods.map(({ year, month }) => {
        const row: CategoryMonthData = {
          label: `${MONTH_NAMES[month - 1]}/${String(year).slice(2)}`,
          month,
          year,
        };
        catList.forEach(cat => {
          const spent = (expenses || [])
            .filter(e => {
              const d = e.date.substring(0, 7);
              return (
                d === `${year}-${String(month).padStart(2, '0')}` &&
                e.category_id === cat.id
              );
            })
            .reduce((s: number, e: any) => s + Number(e.amount), 0);
          row[cat.name] = spent;
        });
        return row;
      });
      setCategoryData(catData);
    } catch (err) {
      console.error('Erro ao buscar dados do gráfico:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, months, getLast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasGeneralData = generalData.some(d => d.meta > 0 || d.gasto > 0);
  const hasCategoryData = categoryData.some(d =>
    categories.some(c => (d[c.name] as number) > 0)
  );

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden mt-4">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-white/10">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white">Evolução das Metas</h2>
            <p className="text-xs text-gray-400 mt-0.5">Acompanhe o desempenho ao longo dos meses</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle visão */}
            <div className="flex items-center bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setView('geral')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  view === 'geral'
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Geral
              </button>
              <button
                onClick={() => setView('categorias')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  view === 'categorias'
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Categorias
              </button>
            </div>
            {/* Seletor de período */}
            <select
              value={months}
              onChange={e => setMonths(Number(e.target.value))}
              className="border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/5 cursor-pointer"
            >
              <option value={3} className="bg-[#16122A]">3 meses</option>
              <option value={6} className="bg-[#16122A]">6 meses</option>
              <option value={12} className="bg-[#16122A]">12 meses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : view === 'geral' ? (
          <>
            {!hasGeneralData ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <i className="ri-bar-chart-2-line text-2xl text-gray-500"></i>
                </div>
                <p className="text-sm text-gray-400">Nenhum dado encontrado para o período</p>
                <p className="text-xs text-gray-500 mt-1">Crie metas e registre despesas para visualizar o gráfico</p>
              </div>
            ) : (
              <>
                {/* Mini KPIs — 2x2 no mobile, 4 colunas no desktop */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  {(() => {
                    const totalMeta = generalData.reduce((s, d) => s + d.meta, 0);
                    const totalGasto = generalData.reduce((s, d) => s + d.gasto, 0);
                    const avgPerc = generalData.filter(d => d.meta > 0).length > 0
                      ? generalData.filter(d => d.meta > 0).reduce((s, d) => s + d.percentual, 0) / generalData.filter(d => d.meta > 0).length
                      : 0;
                    const mesesOk = generalData.filter(d => d.meta > 0 && d.percentual <= 100).length;
                    const totalComMeta = generalData.filter(d => d.meta > 0).length;
                    return (
                      <>
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                          <p className="text-xs text-orange-400 font-medium mb-1 leading-tight">Total Planejado</p>
                          <p className="text-sm font-bold text-orange-300">{formatCurrency(totalMeta)}</p>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <p className="text-xs text-red-400 font-medium mb-1 leading-tight">Total Gasto</p>
                          <p className="text-sm font-bold text-red-300">{formatCurrency(totalGasto)}</p>
                        </div>
                        <div className={`rounded-lg p-3 border ${avgPerc <= 100 ? 'bg-teal-500/10 border-teal-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                          <p className={`text-xs font-medium mb-1 leading-tight ${avgPerc <= 100 ? 'text-teal-400' : 'text-red-400'}`}>Média de Uso</p>
                          <p className={`text-sm font-bold ${avgPerc <= 100 ? 'text-teal-300' : 'text-red-300'}`}>{avgPerc.toFixed(1)}%</p>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                          <p className="text-xs text-green-400 font-medium mb-1 leading-tight">Dentro da meta</p>
                          <p className="text-sm font-bold text-green-300">{mesesOk}/{totalComMeta} meses</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Gráfico principal */}
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={generalData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={v => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={v => `${v}%`}
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                      domain={[0, 150]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '12px', color: '#9CA3AF' }}
                      iconType="circle"
                      iconSize={7}
                    />
                    <ReferenceLine yAxisId="right" y={100} stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1.5} />
                    <Bar yAxisId="left" dataKey="meta" name="Meta" fill="#7C3AED60" radius={[3, 3, 0, 0]} maxBarSize={32} />
                    <Bar yAxisId="left" dataKey="gasto" name="Gasto" fill="#F97316" radius={[3, 3, 0, 0]} maxBarSize={32} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="percentual"
                      name="Aproveitamento (%)"
                      stroke="#14B8A6"
                      strokeWidth={2}
                      dot={{ fill: '#14B8A6', r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-500 text-center mt-2">
                  A linha tracejada vermelha indica o limite de 100% da meta
                </p>
              </>
            )}
          </>
        ) : (
          <>
            {!hasCategoryData || categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <i className="ri-pie-chart-2-line text-2xl text-gray-500"></i>
                </div>
                <p className="text-sm text-gray-400">Nenhuma despesa por categoria encontrada</p>
                <p className="text-xs text-gray-500 mt-1">Registre despesas com categorias para visualizar</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={categoryData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={v => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip content={<CategoryTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '12px', color: '#9CA3AF' }}
                      iconType="circle"
                      iconSize={7}
                    />
                    {categories.map(cat => (
                      <Bar
                        key={cat.id}
                        dataKey={cat.name}
                        name={cat.name}
                        fill={cat.color}
                        stackId="a"
                        maxBarSize={40}
                      />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Gastos empilhados por categoria ao longo dos meses
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
