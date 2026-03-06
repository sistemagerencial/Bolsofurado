import { useState, useRef, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuthContext } from '../../contexts/AuthContext';
import { useRevenues } from '../../hooks/useRevenues';
import { useExpenses } from '../../hooks/useExpenses';
import { useBudgets } from '../../hooks/useBudgets';
import { useCategories } from '../../hooks/useCategories';
import { usePatrimonios } from '../../hooks/usePatrimonios';
import { useInvestments } from '../../hooks/useInvestments';
import { useTrades } from '../../hooks/useTrades';
import { useSubscription } from '../../hooks/useSubscription';
import { WelcomeModal } from '../../components/modals/WelcomeModal';
import { OnboardingModal } from '../../components/onboarding/OnboardingModal';
import { useNavigate } from 'react-router-dom';

const SECTION_IDS = {
  MAIN_CARDS: 'main-cards',
  SECONDARY_CARDS: 'secondary-cards',
  SAVINGS_GOALS: 'savings-goals',
  REVENUES_VS_EXPENSES: 'revenues-vs-expenses',
  FINANCIAL_PROJECTION: 'financial-projection',
  MONTHLY_GOALS: 'monthly-goals',
  INVESTMENTS_SUMMARY: 'investments-summary',
  MONTHLY_EVOLUTION: 'monthly-evolution',
  TRADES_EVOLUTION: 'trades-evolution',
};

const DEFAULT_ORDER = [
  SECTION_IDS.MAIN_CARDS,
  SECTION_IDS.SECONDARY_CARDS,
  SECTION_IDS.SAVINGS_GOALS,
  SECTION_IDS.REVENUES_VS_EXPENSES,
  SECTION_IDS.FINANCIAL_PROJECTION,
  SECTION_IDS.MONTHLY_GOALS,
  SECTION_IDS.INVESTMENTS_SUMMARY,
  SECTION_IDS.MONTHLY_EVOLUTION,
  SECTION_IDS.TRADES_EVOLUTION,
];

export default function HomePage() {
  const { profile, user } = useAuthContext();
  const { hasAccess, status, daysRemaining, isLifetime, isTrial } = useSubscription();
  const navigate = useNavigate();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_ORDER);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [selectedGoalMonth, setSelectedGoalMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const savedOrder = localStorage.getItem('dashboard_section_order_v2');
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_ORDER.length) {
          setSectionOrder(parsed);
        }
      } catch (e) {
        console.error('Erro ao carregar ordem dos cards:', e);
      }
    }
  }, []);

  const saveSectionOrder = (newOrder: string[]) => {
    setSectionOrder(newOrder);
    localStorage.setItem('dashboard_section_order_v2', JSON.stringify(newOrder));
  };

  const handleDragStart = (sectionId: string) => setDraggedSection(sectionId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetSectionId: string) => {
    if (!draggedSection || draggedSection === targetSectionId) { setDraggedSection(null); return; }
    const newOrder = [...sectionOrder];
    const draggedIndex = newOrder.indexOf(draggedSection);
    const targetIndex = newOrder.indexOf(targetSectionId);
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedSection);
    saveSectionOrder(newOrder);
    setDraggedSection(null);
  };
  const handleDragEnd = () => setDraggedSection(null);

  useEffect(() => {
    const hasPendingWelcome = localStorage.getItem('bolsofurado_show_welcome_pending');
    if (profile) {
      if (hasPendingWelcome === 'true') {
        // Usuário novo — mostra onboarding primeiro, depois o modal de planos
        const onboardingDone = localStorage.getItem('bolsofurado_onboarding_done');
        localStorage.removeItem('bolsofurado_show_welcome_pending');
        localStorage.setItem('bolsofurado_welcome_shown', 'true');
        if (!onboardingDone) {
          setShowOnboarding(true);
        } else {
          setShowWelcomeModal(true);
        }
      }
      // Usuários existentes: não mostrar nada
    }
  }, [profile]);

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
  };

  const getDisplayName = () => {
    // Prioridade 1: nome salvo no perfil (campo nome)
    if (profile?.nome && profile.nome.trim()) {
      const fn = profile.nome.trim().split(/\s+/)[0];
      return fn.charAt(0).toUpperCase() + fn.slice(1).toLowerCase();
    }
    // Prioridade 2: campo name do perfil
    if (profile?.name && profile.name.trim()) {
      const fn = profile.name.trim().split(/\s+/)[0];
      return fn.charAt(0).toUpperCase() + fn.slice(1).toLowerCase();
    }
    // Fallback: apenas se não há nenhum nome salvo
    if (user?.email) {
      const local = user.email.split('@')[0];
      // Remove números e caracteres especiais para pegar só o nome
      const clean = local.replace(/[0-9._\-+]/g, '');
      if (clean.length >= 2) {
        return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
      }
      // Se o email não tem parte legível, usa "Usuário"
      return 'Usuário';
    }
    return 'Usuário';
  };

  const firstName = getDisplayName();

  const { revenues, loading: loadingRevenues, createRevenue } = useRevenues();
  const { expenses, loading: loadingExpenses, createExpense } = useExpenses();
  const { patrimonios, loading: loadingPatrimonios } = usePatrimonios();
  const { investments, loading: loadingInvestments } = useInvestments();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { budgets, loading: loadingBudgets, fetchBudgets } = useBudgets();
  const { categories: categoriasDespesa, createCategory: createCategoryDespesa } = useCategories('despesa');
  const { categories: categoriasReceita, createCategory: createCategoryReceita } = useCategories('receita');

  const [showReceitaModal, setShowReceitaModal] = useState(false);
  const [showDespesaModal, setShowDespesaModal] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryModalType, setNewCategoryModalType] = useState<'receita' | 'despesa'>('receita');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#22C55E');
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingReceita, setSavingReceita] = useState(false);
  const [savingDespesa, setSavingDespesa] = useState(false);

  const receitaDateRef = useRef<HTMLInputElement>(null);
  const receitaCatRef = useRef<HTMLSelectElement>(null);
  const receitaValorRef = useRef<HTMLInputElement>(null);
  const despesaDateRef = useRef<HTMLInputElement>(null);
  const despesaCatRef = useRef<HTMLSelectElement>(null);
  const despesaValorRef = useRef<HTMLInputElement>(null);

  const colorOptions = ['#22C55E', '#7C3AED', '#EC4899', '#FACC15', '#EF4444', '#8B5CF6', '#10B981', '#F97316'];

  useEffect(() => { fetchBudgets(selectedGoalMonth); }, [selectedGoalMonth]);

  const handlePreviousMonth = () => {
    const [year, month] = selectedGoalMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() - 1);
    setSelectedGoalMonth(date.toISOString().slice(0, 7));
  };
  const handleNextMonth = () => {
    const [year, month] = selectedGoalMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() + 1);
    setSelectedGoalMonth(date.toISOString().slice(0, 7));
  };
  const getFormattedMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '#EF4444';
    if (percentage >= 70) return '#FACC15';
    return '#22C55E';
  };
  const getStatusColor = (s: string) => s === 'critical' ? '#EF4444' : s === 'warning' ? '#FACC15' : '#22C55E';
  const getStatusText = (s: string) => s === 'critical' ? 'CRÍTICO' : s === 'warning' ? 'ATENÇÃO' : 'OK';

  const totalRevenues = revenues.reduce((sum, rev) => sum + Number(rev.amount), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const saldoAcumulado = totalRevenues - totalExpenses;
  const totalPatrimonios = patrimonios.reduce((sum, pat) => sum + Number(pat.value), 0);

  const round2 = (n: number) => Math.round(n * 100) / 100;

  const calcProfit = (inv: any) => {
    if (['Previdência Privada', 'Capitalização', 'Consórcio'].includes(inv.type)) {
      if (inv.notes) {
        const match = inv.notes.match(/\[RENT_VALUE\]([-\d.]+)/);
        if (match) return round2(parseFloat(match[1]));
      }
      return 0;
    }
    const quantity = inv.quantity || 0;
    const averageCost = inv.average_cost || inv.entry_price || 0;
    const currentPrice = inv.current_value || 0;
    if (quantity > 0 && averageCost > 0 && currentPrice > 0) return round2(quantity * (currentPrice - averageCost));
    const invested = inv.amount || 0;
    if (averageCost > 0 && currentPrice > 0) return round2(invested * (currentPrice - averageCost) / averageCost);
    return round2(currentPrice - invested);
  };

  const totalInvestido = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalProfit = investments.reduce((sum, inv) => sum + calcProfit(inv), 0);
  const totalProfitabilityPct = totalInvestido > 0 ? (totalProfit / totalInvestido) * 100 : 0;
  const totalInvestimentosReal = round2(totalInvestido + totalProfit);

  // Score Financeiro = saldo + patrimônios + valor total real dos investimentos
  const scoreTotal = saldoAcumulado + totalPatrimonios + totalInvestimentosReal;

  // Resumo por tipo — TODOS os investimentos lançados
  const tiposEspeciais = ['Previdência Privada', 'Capitalização', 'Consórcio'];

  const allTypes = Array.from(new Set(investments.map(inv => inv.type))).filter(Boolean);

  const resumoTodos = allTypes.map(tipo => {
    const lista = investments.filter(inv => inv.type === tipo);
    const investido = round2(lista.reduce((s, inv) => s + (inv.amount || 0), 0));
    const rentabilidade = round2(lista.reduce((s, inv) => s + calcProfit(inv), 0));
    const total = round2(investido + rentabilidade);
    return { tipo, investido, rentabilidade, total, count: lista.length };
  }).filter(r => r.count > 0);

  const totalTodosInvestido = round2(resumoTodos.reduce((s, r) => s + r.investido, 0));
  const totalTodosRent = round2(resumoTodos.reduce((s, r) => s + r.rentabilidade, 0));
  const totalTodosTotal = round2(totalTodosInvestido + totalTodosRent);

  // Manter compatibilidade com variáveis antigas usadas em outros lugares
  const resumoEspeciais = resumoTodos.filter(r => tiposEspeciais.includes(r.tipo));
  const totalEspeciaisInvestido = round2(resumoEspeciais.reduce((s, r) => s + r.investido, 0));
  const totalEspeciaisRent = round2(resumoEspeciais.reduce((s, r) => s + r.rentabilidade, 0));
  const totalEspeciaisTotal = round2(totalEspeciaisInvestido + totalEspeciaisRent);

  const thisMonthRevenues = revenues.filter(rev => rev.date.startsWith(currentMonth)).reduce((sum, rev) => sum + Number(rev.amount), 0);
  const thisMonthExpenses = expenses.filter(exp => exp.date.startsWith(currentMonth)).reduce((sum, exp) => sum + Number(exp.amount), 0);
  const thisMonthBalance = thisMonthRevenues - thisMonthExpenses;

  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();

  const evolutionData = [];
  for (let m = 0; m <= currentMonthIndex; m++) {
    const date = new Date(currentYear, m, 1);
    const monthStr = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const receita = revenues.filter(r => r.date.startsWith(monthStr)).reduce((sum, r) => sum + Number(r.amount), 0);
    const despesa = expenses.filter(e => e.date.startsWith(monthStr)).reduce((sum, e) => sum + Number(e.amount), 0);
    evolutionData.push({ month: monthName.charAt(0).toUpperCase() + monthName.slice(1), receita, despesa, value: receita - despesa });
  }

  const savingsData = evolutionData.map((item) => {
    const economia = item.receita - item.despesa;
    const percentual = item.receita > 0 ? (economia / item.receita) * 100 : 0;
    return { ...item, economia, percentual };
  });

  const mediaSavings = savingsData.length > 0
    ? savingsData.reduce((sum, d) => sum + d.percentual, 0) / (savingsData.filter(d => d.receita > 0).length || 1)
    : 0;

  const getSavingsColor = (pct: number) => {
    if (pct >= 20) return '#10B981';
    if (pct >= 10) return '#FACC15';
    if (pct > 0) return '#F97316';
    return '#EF4444';
  };
  const getSavingsLabel = (pct: number) => {
    if (pct >= 20) return 'Ótimo';
    if (pct >= 10) return 'Bom';
    if (pct > 0) return 'Atenção';
    return 'Crítico';
  };

  const categoryData = budgets
    .filter(budget => {
      const [yearStr, monthStr] = selectedGoalMonth.split('-');
      return budget.year === parseInt(yearStr, 10) && budget.month === parseInt(monthStr, 10);
    })
    .map(budget => {
      const category = categoriasDespesa.find(c => c.id === budget.category_id);
      const [yearStr, monthStr] = selectedGoalMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const spent = expenses
        .filter(exp => {
          if (exp.category_id !== budget.category_id) return false;
          const parts = exp.date.substring(0, 10).split('-');
          return parseInt(parts[0], 10) === year && parseInt(parts[1], 10) === month;
        })
        .reduce((sum, exp) => sum + Number(exp.amount), 0);
      const budgetAmount = Number(budget.amount);
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
      let status = 'ok';
      if (percentage >= 100) status = 'critical';
      else if (percentage >= 90) status = 'warning';
      return { id: budget.id, name: category?.name || 'Sem categoria', color: category?.color || '#9CA3AF', budget: budgetAmount, spent, percentage, status };
    });

  const today = new Date().toISOString().split('T')[0];

  const handleSaveReceita = async (e: React.FormEvent) => {
    e.preventDefault();
    const date = receitaDateRef.current?.value;
    const category_id = receitaCatRef.current?.value;
    const amount = parseFloat(receitaValorRef.current?.value || '0');
    if (!date || !category_id || !amount) return;
    try { setSavingReceita(true); await createRevenue({ date, category_id, description: '', amount }); setShowReceitaModal(false); }
    catch (err) { console.error('Erro ao salvar receita:', err); } finally { setSavingReceita(false); }
  };

  const handleSaveDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    const date = despesaDateRef.current?.value;
    const category_id = despesaCatRef.current?.value;
    const amount = parseFloat(despesaValorRef.current?.value || '0');
    if (!date || !category_id || !amount) return;
    try { setSavingDespesa(true); await createExpense({ date, category_id, description: '', amount }); setShowDespesaModal(false); }
    catch (err) { console.error('Erro ao salvar despesa:', err); } finally { setSavingDespesa(false); }
  };

  const openNewCategoryModal = (type: 'receita' | 'despesa') => {
    setNewCategoryModalType(type);
    setNewCategoryName('');
    setNewCategoryColor(type === 'receita' ? '#22C55E' : '#EF4444');
    setShowNewCategoryModal(true);
  };

  const handleSaveNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setSavingCategory(true);
      if (newCategoryModalType === 'receita') await createCategoryReceita({ name: newCategoryName.trim(), type: 'receita', color: newCategoryColor });
      else await createCategoryDespesa({ name: newCategoryName.trim(), type: 'despesa', color: newCategoryColor });
      setShowNewCategoryModal(false);
      setNewCategoryName('');
    } catch (err) { console.error(err); } finally { setSavingCategory(false); }
  };

  const { trades } = useTrades();

  const tradesEvolutionData = [];
  for (let m = 0; m <= 11; m++) {
    const date = new Date(currentYear, m, 1);
    const monthStr = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const result = trades.filter(t => t.date && t.date.startsWith(monthStr)).reduce((sum, t) => sum + (t.total || 0), 0);
    const gains = trades.filter(t => t.date && t.date.startsWith(monthStr) && (t.total || 0) > 0).reduce((sum, t) => sum + (t.total || 0), 0);
    const losses = trades.filter(t => t.date && t.date.startsWith(monthStr) && (t.total || 0) < 0).reduce((sum, t) => sum + Math.abs(t.total || 0), 0);
    tradesEvolutionData.push({ month: monthName.charAt(0).toUpperCase() + monthName.slice(1), result, gains, losses });
  }

  const monthsWithData = evolutionData.filter(d => d.receita > 0 || d.despesa > 0);
  const avgReceita = monthsWithData.length > 0 ? monthsWithData.reduce((s, d) => s + d.receita, 0) / monthsWithData.length : 0;
  const avgDespesa = monthsWithData.length > 0 ? monthsWithData.reduce((s, d) => s + d.despesa, 0) / monthsWithData.length : 0;
  const avgSaldo = avgReceita - avgDespesa;

  const projectionData: { month: string; receita: number; despesa: number; saldo: number; isProjection: boolean }[] = [];
  evolutionData.forEach(item => projectionData.push({ month: item.month, receita: item.receita, despesa: item.despesa, saldo: item.receita - item.despesa, isProjection: false }));
  for (let m = currentMonthIndex + 1; m <= 11; m++) {
    const date = new Date(currentYear, m, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    projectionData.push({ month: monthName.charAt(0).toUpperCase() + monthName.slice(1), receita: avgReceita, despesa: avgDespesa, saldo: avgSaldo, isProjection: true });
  }

  const projMaxVal = Math.max(...projectionData.map(d => Math.max(d.receita, d.despesa)), 1);
  const projTotalReceita = projectionData.reduce((s, d) => s + d.receita, 0);
  const projTotalDespesa = projectionData.reduce((s, d) => s + d.despesa, 0);
  const projTotalSaldo = projTotalReceita - projTotalDespesa;

  let acumulado = 0;
  const projAcumulado = projectionData.map(d => { acumulado += d.saldo; return acumulado; });

  // Ícones por tipo de investimento
  const tipoIcon: Record<string, string> = {
    'Previdência Privada': 'ri-shield-check-line',
    'Capitalização': 'ri-bank-line',
    'Consórcio': 'ri-group-line',
    'Ações': 'ri-stock-line',
    'FIIs': 'ri-building-4-line',
    'Cripto': 'ri-bit-coin-line',
    'Renda Fixa': 'ri-secure-payment-line',
    'Tesouro Direto': 'ri-government-line',
    'ETF': 'ri-pie-chart-line',
    'BDR': 'ri-global-line',
    'Fundos': 'ri-funds-line',
    'CDB': 'ri-bank-card-line',
    'LCI': 'ri-home-smile-line',
    'LCA': 'ri-plant-line',
    'Debêntures': 'ri-file-text-line',
    'Outros': 'ri-more-line',
  };
  const tipoColor: Record<string, string> = {
    'Previdência Privada': '#10B981',
    'Capitalização': '#FACC15',
    'Consórcio': '#EC4899',
    'Ações': '#F97316',
    'FIIs': '#8B5CF6',
    'Cripto': '#F59E0B',
    'Renda Fixa': '#06B6D4',
    'Tesouro Direto': '#22C55E',
    'ETF': '#A78BFA',
    'BDR': '#FB7185',
    'Fundos': '#34D399',
    'CDB': '#60A5FA',
    'LCI': '#4ADE80',
    'LCA': '#86EFAC',
    'Debêntures': '#FCA5A5',
    'Outros': '#9CA3AF',
  };

  const DraggableSection = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <div
      draggable
      onDragStart={() => handleDragStart(id)}
      onDragOver={handleDragOver}
      onDrop={() => handleDrop(id)}
      onDragEnd={handleDragEnd}
      className={`relative transition-all duration-200 ${draggedSection === id ? 'opacity-50 scale-95' : ''}`}
    >
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <div className="w-6 h-6 rounded-lg bg-[#7C3AED]/20 hover:bg-[#7C3AED]/40 flex items-center justify-center">
          <i className="ri-draggable text-[#7C3AED] text-sm"></i>
        </div>
      </div>
      {children}
    </div>
  );

  const renderSection = (sectionId: string) => {
    switch (sectionId) {

      // ─── CARDS PRINCIPAIS ───────────────────────────────────────────────────
      case SECTION_IDS.MAIN_CARDS:
        return (
          <DraggableSection key={sectionId} id={sectionId}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">

              {/* Saldo Acumulado */}
              <div
                onClick={() => navigate('/receitas')}
                className={`rounded-xl p-3 sm:p-4 border transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-lg ${
                  saldoAcumulado >= 0
                    ? 'bg-gradient-to-br from-[#10B981]/10 to-[#059669]/5 border-[#10B981]/20 hover:border-[#10B981]/50 hover:shadow-[#10B981]/10'
                    : 'bg-gradient-to-br from-[#EF4444]/10 to-[#DC2626]/5 border-[#EF4444]/20 hover:border-[#EF4444]/50 hover:shadow-[#EF4444]/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${saldoAcumulado >= 0 ? 'bg-[#10B981]/20' : 'bg-[#EF4444]/20'}`}>
                    <i className={`ri-wallet-3-line text-lg sm:text-xl ${saldoAcumulado >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}></i>
                  </div>
                  <span className={`text-xs font-medium ${saldoAcumulado >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {saldoAcumulado >= 0 ? 'Positivo' : 'Negativo'}
                  </span>
                </div>
                <h3 className="text-xs text-[#9CA3AF] mb-1">Saldo Acumulado</h3>
                <p className={`text-xl sm:text-2xl lg:text-3xl font-light ${saldoAcumulado >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {loadingRevenues || loadingExpenses ? '...' : formatCurrency(saldoAcumulado)}
                </p>
                <p className="text-[10px] text-[#9CA3AF] mt-1 flex items-center gap-1">
                  Líquido de todos os meses
                  <i className={`ri-arrow-right-s-line ${saldoAcumulado >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}></i>
                </p>
              </div>

              {/* Receitas do Mês */}
              <div
                onClick={() => navigate('/receitas')}
                className="bg-gradient-to-br from-[#10B981]/10 to-[#059669]/5 border border-[#10B981]/20 rounded-xl p-3 sm:p-4 hover:shadow-lg hover:shadow-[#10B981]/10 transition-all duration-300 cursor-pointer hover:border-[#10B981]/50 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#10B981]/20 flex items-center justify-center">
                    <i className="ri-arrow-up-line text-[#10B981] text-lg sm:text-xl"></i>
                  </div>
                  <span className="text-xs text-[#10B981] font-medium flex items-center gap-1">
                    Este mês <i className="ri-arrow-right-s-line"></i>
                  </span>
                </div>
                <h3 className="text-xs text-[#9CA3AF] mb-1">Receitas do Mês</h3>
                <p className="text-xl sm:text-2xl lg:text-3xl font-light text-[#10B981]">
                  {loadingRevenues ? '...' : formatCurrency(thisMonthRevenues)}
                </p>
                {!loadingRevenues && !loadingExpenses && (
                  <p className={`text-[10px] font-medium mt-1 ${thisMonthBalance >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    Saldo do mês: {formatCurrency(thisMonthBalance)}
                  </p>
                )}
              </div>

              {/* Despesas do Mês */}
              <div
                onClick={() => navigate('/despesas')}
                className="bg-gradient-to-br from-[#EF4444]/10 to-[#DC2626]/5 border border-[#EF4444]/20 rounded-xl p-3 sm:p-4 hover:shadow-lg hover:shadow-[#EF4444]/10 transition-all duration-300 cursor-pointer hover:border-[#EF4444]/50 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#EF4444]/20 flex items-center justify-center">
                    <i className="ri-arrow-down-line text-[#EF4444] text-lg sm:text-xl"></i>
                  </div>
                  <span className="text-xs text-[#EF4444] font-medium flex items-center gap-1">
                    Este mês <i className="ri-arrow-right-s-line"></i>
                  </span>
                </div>
                <h3 className="text-xs text-[#9CA3AF] mb-1">Despesas do Mês</h3>
                <p className="text-xl sm:text-2xl lg:text-3xl font-light text-[#EF4444]">
                  {loadingExpenses ? '...' : formatCurrency(thisMonthExpenses)}
                </p>
                {!loadingRevenues && !loadingExpenses && thisMonthRevenues > 0 && (
                  <p className="text-[10px] text-[#9CA3AF] mt-1">
                    {((thisMonthExpenses / thisMonthRevenues) * 100).toFixed(0)}% da receita do mês
                  </p>
                )}
              </div>

              {/* Score Financeiro */}
              <div
                onClick={() => navigate('/planejamento')}
                className={`rounded-xl p-3 sm:p-4 border transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-lg ${
                  scoreTotal >= 0
                    ? 'bg-gradient-to-br from-[#FACC15]/10 to-[#F59E0B]/5 border-[#FACC15]/20 hover:border-[#FACC15]/50 hover:shadow-[#FACC15]/10'
                    : 'bg-gradient-to-br from-[#EF4444]/10 to-[#DC2626]/5 border-[#EF4444]/20 hover:border-[#EF4444]/50 hover:shadow-[#EF4444]/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${scoreTotal >= 0 ? 'bg-[#FACC15]/20' : 'bg-[#EF4444]/20'}`}>
                    <i className={`ri-trophy-line text-lg sm:text-xl ${scoreTotal >= 0 ? 'text-[#FACC15]' : 'text-[#EF4444]'}`}></i>
                  </div>
                  <span className={`text-xs font-medium flex items-center gap-1 ${scoreTotal >= 0 ? 'text-[#FACC15]' : 'text-[#EF4444]'}`}>
                    Total <i className="ri-arrow-right-s-line"></i>
                  </span>
                </div>
                <h3 className="text-xs text-[#9CA3AF] mb-1">Score Financeiro</h3>
                <p className={`text-xl sm:text-2xl lg:text-3xl font-light ${scoreTotal >= 0 ? 'text-[#FACC15]' : 'text-[#EF4444]'}`}>
                  {loadingRevenues || loadingExpenses || loadingPatrimonios || loadingInvestments ? '...' : formatCurrency(scoreTotal)}
                </p>
                <p className="text-[10px] text-[#9CA3AF] mt-1">Saldo + Patrimônios + Investimentos</p>
              </div>
            </div>
          </DraggableSection>
        );

      // ─── CARDS SECUNDÁRIOS ──────────────────────────────────────────────────
      case SECTION_IDS.SECONDARY_CARDS:
        return (
          <DraggableSection key={sectionId} id={sectionId}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-4 lg:mb-6">

              {/* Patrimônios */}
              <div
                onClick={() => navigate('/patrimonios')}
                className="bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 border border-[#8B5CF6]/20 rounded-xl p-3 sm:p-4 hover:shadow-lg hover:shadow-[#8B5CF6]/10 transition-all duration-300 cursor-pointer hover:border-[#8B5CF6]/50 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#8B5CF6]/20 flex items-center justify-center">
                    <i className="ri-home-4-line text-[#8B5CF6] text-lg sm:text-xl"></i>
                  </div>
                  <span className="text-xs text-[#8B5CF6] font-medium flex items-center gap-1">
                    Total <i className="ri-arrow-right-s-line"></i>
                  </span>
                </div>
                <h3 className="text-xs text-[#9CA3AF] mb-1">Total em Patrimônios</h3>
                <p className="text-xl sm:text-2xl lg:text-3xl font-light text-[#8B5CF6]">
                  {loadingPatrimonios ? '...' : formatCurrency(totalPatrimonios)}
                </p>
                <p className="text-[10px] text-[#9CA3AF] mt-1">{patrimonios.length} {patrimonios.length === 1 ? 'item cadastrado' : 'itens cadastrados'}</p>
              </div>

              {/* Investimentos */}
              <div
                onClick={() => navigate('/investimentos')}
                className="bg-gradient-to-br from-[#EC4899]/10 to-[#DB2777]/5 border border-[#EC4899]/20 rounded-xl p-3 sm:p-4 hover:shadow-lg hover:shadow-[#EC4899]/10 transition-all duration-300 cursor-pointer hover:border-[#EC4899]/50 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#EC4899]/20 flex items-center justify-center">
                    <i className="ri-line-chart-line text-[#EC4899] text-lg sm:text-xl"></i>
                  </div>
                  <span className="text-xs text-[#EC4899] font-medium flex items-center gap-1">
                    Total <i className="ri-arrow-right-s-line"></i>
                  </span>
                </div>
                <h3 className="text-xs text-[#9CA3AF] mb-1">Total em Investimentos</h3>
                <p className="text-xl sm:text-2xl lg:text-3xl font-light text-[#EC4899]">
                  {loadingInvestments ? '...' : formatCurrency(totalInvestido)}
                </p>
                {!loadingInvestments && (
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-[10px] font-semibold ${totalProfit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {totalProfit >= 0 ? '▲ Lucro' : '▼ Prejuízo'}: {formatCurrency(Math.abs(totalProfit))}
                    </p>
                    {totalInvestido > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${totalProfit >= 0 ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
                        {totalProfit >= 0 ? '+' : ''}{totalProfitabilityPct.toFixed(2)}%
                      </span>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-[#9CA3AF] mt-1">{investments.length} {investments.length === 1 ? 'investimento ativo' : 'investimentos ativos'}</p>
              </div>
            </div>
          </DraggableSection>
        );

      // ─── RESUMO TODOS OS INVESTIMENTOS ──────────────────────────────────────
      case SECTION_IDS.INVESTMENTS_SUMMARY:
        if (resumoTodos.length === 0) return null;
        return (
          <DraggableSection key={sectionId} id={sectionId}>
            <div
              onClick={() => navigate('/investimentos')}
              className="bg-[#16122A] border border-white/5 rounded-xl p-3 sm:p-4 mb-4 lg:mb-6 transition-all duration-300 cursor-pointer hover:border-[#EC4899]/30 hover:shadow-lg hover:shadow-[#EC4899]/5"
            >
              {/* Cabeçalho */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EC4899]/20 flex items-center justify-center">
                    <i className="ri-funds-box-line text-[#EC4899] text-base sm:text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-normal text-[#F9FAFB]">Resumo de Investimentos</h2>
                    <p className="text-[10px] text-[#9CA3AF]">Valor investido + rentabilidade por tipo</p>
                  </div>
                </div>
                {/* Total geral */}
                <div className="flex items-center gap-3 bg-[#0E0B16] border border-white/5 rounded-xl px-3 py-2 self-start sm:self-auto">
                  <div>
                    <p className="text-[10px] text-[#9CA3AF]">Valor Total Geral</p>
                    <p className={`text-base font-semibold ${totalTodosTotal >= totalTodosInvestido ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {formatCurrency(totalTodosTotal)}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-white/10"></div>
                  <div>
                    <p className="text-[10px] text-[#9CA3AF]">Rentabilidade</p>
                    <p className={`text-sm font-semibold ${totalTodosRent >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {totalTodosRent >= 0 ? '+' : ''}{formatCurrency(totalTodosRent)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cards por tipo */}
              <div className={`grid gap-3 ${
                resumoTodos.length === 1 ? 'grid-cols-1' :
                resumoTodos.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                resumoTodos.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
                {resumoTodos.map(r => {
                  const color = tipoColor[r.tipo] || '#9CA3AF';
                  const icon = tipoIcon[r.tipo] || 'ri-funds-line';
                  const rentPct = r.investido > 0 ? (r.rentabilidade / r.investido) * 100 : 0;
                  return (
                    <div key={r.tipo} className="bg-[#0E0B16] border border-white/5 rounded-xl p-3 hover:border-white/10 transition-all">
                      {/* Tipo */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
                          <i className={`${icon} text-sm`} style={{ color }}></i>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#F9FAFB]">{r.tipo}</p>
                          <p className="text-[10px] text-[#9CA3AF]">{r.count} {r.count === 1 ? 'investimento' : 'investimentos'}</p>
                        </div>
                      </div>

                      {/* Valores */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#9CA3AF]">Investido</span>
                          <span className="text-xs font-semibold text-[#F9FAFB]">{formatCurrency(r.investido)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#9CA3AF]">Rentabilidade</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-semibold ${r.rentabilidade >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                              {r.rentabilidade >= 0 ? '+' : ''}{formatCurrency(r.rentabilidade)}
                            </span>
                            {r.investido > 0 && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.rentabilidade >= 0 ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
                                {r.rentabilidade >= 0 ? '+' : ''}{rentPct.toFixed(2)}%
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Divisor */}
                        <div className="border-t border-white/5 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-[#9CA3AF]">Valor Total</span>
                            <span className="text-sm font-bold" style={{ color }}>
                              {formatCurrency(r.total)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Barra de progresso da rentabilidade */}
                      {r.investido > 0 && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${Math.min(Math.abs(rentPct), 100)}%`,
                                backgroundColor: r.rentabilidade >= 0 ? '#10B981' : '#EF4444',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </DraggableSection>
        );

      // ─── METAS DE ECONOMIA ──────────────────────────────────────────────────
      case SECTION_IDS.SAVINGS_GOALS:
        return (
          <DraggableSection key={sectionId} id={sectionId}>
            <div
              onClick={() => navigate('/planejamento')}
              className="bg-[#16122A] border border-white/5 rounded-xl p-3 sm:p-4 mb-4 lg:mb-6 transition-all duration-300 cursor-pointer hover:border-[#10B981]/30 hover:shadow-lg hover:shadow-[#10B981]/5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#10B981]/20 flex items-center justify-center">
                    <i className="ri-piggy-bank-line text-[#10B981] text-base sm:text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg lg:text-xl font-normal text-[#F9FAFB]">Metas de Economia</h2>
                    <p className="text-[10px] text-[#9CA3AF]">
                      Taxa de economia mensal — Janeiro a {new Date(currentYear, currentMonthIndex).toLocaleDateString('pt-BR', { month: 'long' })} de {currentYear}
                    </p>
                  </div>
                </div>
                {savingsData.some(d => d.receita > 0) && (
                  <div className="flex items-center gap-2 bg-[#0E0B16] border border-white/5 rounded-xl px-3 py-2 self-start sm:self-auto">
                    <div>
                      <p className="text-[10px] text-[#9CA3AF]">Média do período</p>
                      <p className="text-base font-normal" style={{ color: getSavingsColor(mediaSavings) }}>
                        {isNaN(mediaSavings) ? '—' : `${mediaSavings.toFixed(1)}%`}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: `${getSavingsColor(mediaSavings)}20`, color: getSavingsColor(mediaSavings) }}>
                      {isNaN(mediaSavings) ? '—' : getSavingsLabel(mediaSavings)}
                    </span>
                  </div>
                )}
              </div>

              {savingsData.every(d => d.receita === 0) ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <i className="ri-piggy-bank-line text-3xl text-[#9CA3AF] mb-2"></i>
                  <p className="text-[#9CA3AF] text-xs">Nenhuma receita registrada ainda</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto pb-2 mb-3">
                    <div className="flex gap-2" style={{ minWidth: `${savingsData.length * 130}px` }}>
                      {savingsData.map((item, index) => {
                        const color = getSavingsColor(item.percentual);
                        const label = getSavingsLabel(item.percentual);
                        const isCurrentMonth = index === savingsData.length - 1;
                        return (
                          <div key={index} className={`relative bg-[#0E0B16] rounded-xl border transition-all duration-200 hover:scale-105 flex-shrink-0 w-[120px] p-2${isCurrentMonth ? ' border-[#10B981]/60 ring-1 ring-[#10B981]/30' : ' border-white/5'}`}>
                            <p className="text-[10px] text-[#9CA3AF] mb-1.5 text-center">{item.month}</p>
                            <div className="flex justify-center mb-1.5">
                              <div className="relative w-12 h-12">
                                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ffffff08" strokeWidth="3" />
                                  <circle cx="18" cy="18" r="15.9" fill="none" stroke={item.receita > 0 ? color : '#374151'} strokeWidth="3" strokeDasharray={`${Math.min(Math.max(item.percentual, 0), 100)} 100`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-[10px] font-bold" style={{ color: item.receita > 0 ? color : '#6B7280' }}>
                                    {item.receita > 0 ? `${item.percentual.toFixed(0)}%` : '—'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] text-[#9CA3AF]">Receita</span>
                                <span className="text-[9px] font-semibold text-[#10B981]">{item.receita > 0 ? formatCurrency(item.receita).replace('R$\u00a0', 'R$ ') : '—'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] text-[#9CA3AF]">Despesa</span>
                                <span className="text-[9px] font-semibold text-[#EF4444]">{item.despesa > 0 ? formatCurrency(item.despesa).replace('R$\u00a0', 'R$ ') : '—'}</span>
                              </div>
                              <div className="flex justify-between items-center pt-0.5 border-t border-white/5">
                                <span className="text-[9px] text-[#9CA3AF]">Economia</span>
                                <span className="text-[9px] font-bold" style={{ color: item.receita > 0 ? color : '#6B7280' }}>{item.receita > 0 ? formatCurrency(item.economia).replace('R$\u00a0', 'R$ ') : '—'}</span>
                              </div>
                            </div>
                            {item.receita > 0 && (
                              <div className="mt-1.5 text-center">
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color }}>{label}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 mb-3">
                    <span className="text-[10px] text-[#9CA3AF]">Referência:</span>
                    {[{ color: '#10B981', label: 'Ótimo ≥ 20%' }, { color: '#FACC15', label: 'Bom ≥ 10%' }, { color: '#F97316', label: 'Atenção > 0%' }, { color: '#EF4444', label: 'Crítico ≤ 0%' }].map(item => (
                      <div key={item.label} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-[10px] text-[#9CA3AF]">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </DraggableSection>
        );

      // ─── RECEITAS VS DESPESAS ───────────────────────────────────────────────
      case SECTION_IDS.REVENUES_VS_EXPENSES:
        return (
          <DraggableSection key={sectionId} id={sectionId}>
            <div className="bg-[#16122A] border border-white/5 rounded-xl p-3 sm:p-4 mb-4 lg:mb-6 transition-all duration-300">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center">
                  <i className="ri-bar-chart-grouped-line text-[#7C3AED] text-base sm:text-lg"></i>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg lg:text-xl font-normal text-[#F9FAFB]">Receitas vs Despesas</h2>
                  <p className="text-[10px] text-[#9CA3AF]">Janeiro a {new Date(currentYear, currentMonthIndex).toLocaleDateString('pt-BR', { month: 'long' })} de {currentYear}</p>
                </div>
              </div>
              {evolutionData.every(d => d.receita === 0 && d.despesa === 0) ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <i className="ri-bar-chart-2-line text-4xl text-[#9CA3AF] mb-3"></i>
                  <p className="text-[#9CA3AF] text-sm">Nenhum dado registrado ainda</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto pb-2">
                    <div className="flex items-end gap-2 h-44 sm:h-52 mb-4" style={{ minWidth: '720px' }}>
                      {evolutionData.map((item, index) => {
                        const maxVal = Math.max(...evolutionData.map(d => Math.max(d.receita, d.despesa)), 1);
                        const receitaHeight = (item.receita / maxVal) * 100;
                        const despesaHeight = (item.despesa / maxVal) * 100;
                        const saldo = item.receita - item.despesa;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                            <div className="w-full flex flex-col items-center justify-end gap-0.5 h-full">
                              {item.receita > 0 && <div className="w-full rounded-t-md bg-gradient-to-t from-[#22C55E] to-[#22C55E]/60 transition-all duration-500" style={{ height: `${receitaHeight}%`, minHeight: '4px' }} title={`Receita: ${formatCurrency(item.receita)}`} />}
                              {item.despesa > 0 && <div className="w-full rounded-b-md bg-gradient-to-b from-[#EF4444] to-[#EF4444]/60 transition-all duration-500" style={{ height: `${despesaHeight}%`, minHeight: '4px' }} title={`Despesa: ${formatCurrency(item.despesa)}`} />}
                              {item.receita === 0 && item.despesa === 0 && <div className="w-full rounded-md bg-white/5" style={{ height: '4px' }} />}
                            </div>
                            <p className="text-[10px] text-[#9CA3AF] mt-1 whitespace-nowrap">{item.month}</p>
                            <p className={`text-[9px] font-bold whitespace-nowrap ${saldo >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                              {saldo >= 0 ? '+' : ''}{formatCurrency(saldo).replace('R$\u00a0', 'R$ ')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 mb-3">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-[#22C55E]" /><span className="text-[10px] text-[#9CA3AF]">Receitas</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-[#EF4444]" /><span className="text-[10px] text-[#9CA3AF]">Despesas</span></div>
                    <div className="flex items-center gap-2"><span className="text-[#EC4899] text-xs">●</span><span className="text-[10px] text-[#9CA3AF]">Mês atual</span></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-3">
                    <div className="text-center">
                      <p className="text-[10px] text-[#9CA3AF] mb-0.5">Total Receitas ({currentYear})</p>
                      <p className="text-xs sm:text-sm font-normal text-[#10B981]">{formatCurrency(evolutionData.reduce((s, d) => s + d.receita, 0))}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-[#9CA3AF] mb-0.5">Total Despesas ({currentYear})</p>
                      <p className="text-xs sm:text-sm font-normal text-[#EF4444]">{formatCurrency(evolutionData.reduce((s, d) => s + d.despesa, 0))}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-[#9CA3AF] mb-0.5">Saldo {currentYear}</p>
                      {(() => {
                        const sp = evolutionData.reduce((s, d) => s + d.receita - d.despesa, 0);
                        return <p className={`text-xs sm:text-sm font-normal ${sp >= 0 ? 'text-[#FACC15]' : 'text-[#EF4444]'}`}>{sp >= 0 ? '+' : ''}{formatCurrency(sp)}</p>;
                      })()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </DraggableSection>
        );

      // ─── PROJEÇÃO FINANCEIRA ────────────────────────────────────────────────
      case SECTION_IDS.FINANCIAL_PROJECTION:
        return (
          <DraggableSection key={sectionId} id={sectionId}>
            <div className="bg-[#16122A] border border-white/5 rounded-xl p-3 sm:p-4 mb-4 lg:mb-6 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FACC15]/20 flex items-center justify-center">
                    <i className="ri-rocket-line text-[#FACC15] text-base sm:text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg lg:text-xl font-normal text-[#F9FAFB]">Projeção Financeira</h2>
                    <p className="text-[10px] text-[#9CA3AF]">Estimativa para {currentYear} com base na média dos meses registrados</p>
                  </div>
                </div>
                {monthsWithData.length > 0 && (
                  <div className="flex items-center gap-2 bg-[#0E0B16] border border-white/5 rounded-xl px-3 py-2 self-start sm:self-auto">
                    <i className="ri-calculator-line text-[#FACC15] text-sm"></i>
                    <div>
                      <p className="text-[10px] text-[#9CA3AF]">Base de cálculo</p>
                      <p className="text-xs font-semibold text-[#F9FAFB]">{monthsWithData.length} {monthsWithData.length === 1 ? 'mês' : 'meses'} com dados</p>
                    </div>
                  </div>
                )}
              </div>
              {monthsWithData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <i className="ri-rocket-line text-4xl text-[#9CA3AF] mb-3"></i>
                  <p className="text-[#9CA3AF] text-sm">Registre receitas e despesas para ver a projeção</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    <div className="bg-[#0E0B16] border border-[#10B981]/20 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded-lg bg-[#10B981]/20 flex items-center justify-center"><i className="ri-arrow-up-line text-[#10B981] text-sm"></i></div><span className="text-[10px] text-[#9CA3AF]">Média Receita/mês</span></div>
                      <p className="text-lg font-normal text-[#10B981]">{formatCurrency(avgReceita)}</p>
                      <p className="text-[9px] text-[#9CA3AF] mt-1">Projeção anual: {formatCurrency(avgReceita * 12)}</p>
                    </div>
                    <div className="bg-[#0E0B16] border border-[#EF4444]/20 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded-lg bg-[#EF4444]/20 flex items-center justify-center"><i className="ri-arrow-down-line text-[#EF4444] text-sm"></i></div><span className="text-[10px] text-[#9CA3AF]">Média Despesa/mês</span></div>
                      <p className="text-lg font-normal text-[#EF4444]">{formatCurrency(avgDespesa)}</p>
                      <p className="text-[9px] text-[#9CA3AF] mt-1">Projeção anual: {formatCurrency(avgDespesa * 12)}</p>
                    </div>
                    <div className={`bg-[#0E0B16] border rounded-xl p-3 ${avgSaldo >= 0 ? 'border-[#FACC15]/20' : 'border-[#EF4444]/20'}`}>
                      <div className="flex items-center gap-2 mb-2"><div className={`w-6 h-6 rounded-lg flex items-center justify-center ${avgSaldo >= 0 ? 'bg-[#FACC15]/20' : 'bg-[#EF4444]/20'}`}><i className={`ri-funds-line text-sm ${avgSaldo >= 0 ? 'text-[#FACC15]' : 'text-[#EF4444]'}`}></i></div><span className="text-[10px] text-[#9CA3AF]">Média Saldo/mês</span></div>
                      <p className={`text-lg font-normal ${avgSaldo >= 0 ? 'text-[#FACC15]' : 'text-[#EF4444]'}`}>{formatCurrency(avgSaldo)}</p>
                      <p className="text-[9px] text-[#9CA3AF] mt-1">Projeção anual: {formatCurrency(avgSaldo * 12)}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto pb-2 mb-4">
                    <div className="flex items-end gap-2 h-48 sm:h-56" style={{ minWidth: '720px' }}>
                      {projectionData.map((item, index) => {
                        const receitaH = (item.receita / projMaxVal) * 100;
                        const despesaH = (item.despesa / projMaxVal) * 100;
                        const isCurrentM = index === currentMonthIndex;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                            {item.isProjection && <div className="w-full flex justify-center mb-1"><span className="text-[9px] text-[#FACC15]/70 font-medium">est.</span></div>}
                            <div className="w-full flex items-end gap-0.5 h-full justify-center">
                              <div className="flex-1 flex flex-col justify-end h-full">
                                <div className="w-full rounded-t-sm transition-all duration-700" style={{ height: `${receitaH}%`, minHeight: item.receita > 0 ? '3px' : '0', background: item.isProjection ? 'repeating-linear-gradient(45deg, #10B981, #10B981 2px, #10B98140 2px, #10B98140 6px)' : 'linear-gradient(to top, #059669, #10B981)', opacity: item.isProjection ? 0.75 : 1 }} title={`Receita${item.isProjection ? ' (estimada)' : ''}: ${formatCurrency(item.receita)}`} />
                              </div>
                              <div className="flex-1 flex flex-col justify-end h-full">
                                <div className="w-full rounded-t-sm transition-all duration-700" style={{ height: `${despesaH}%`, minHeight: item.despesa > 0 ? '3px' : '0', background: item.isProjection ? 'repeating-linear-gradient(45deg, #EF4444, #EF4444 2px, #EF444440 2px, #EF444440 6px)' : 'linear-gradient(to top, #DC2626, #EF4444)', opacity: item.isProjection ? 0.75 : 1 }} title={`Despesa${item.isProjection ? ' (estimada)' : ''}: ${formatCurrency(item.despesa)}`} />
                              </div>
                            </div>
                            <p className={`text-[10px] mt-1 whitespace-nowrap font-medium ${isCurrentM ? 'text-[#FACC15]' : item.isProjection ? 'text-[#9CA3AF]/60' : 'text-[#9CA3AF]'}`}>{item.month}{isCurrentM && <span className="ml-0.5">●</span>}</p>
                            <p className={`text-[9px] font-bold whitespace-nowrap ${item.saldo >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'} ${item.isProjection ? 'opacity-70' : ''}`}>{item.saldo >= 0 ? '+' : ''}{formatCurrency(item.saldo).replace('R$\u00a0', 'R$')}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-[#0E0B16] border border-white/5 rounded-xl p-3 mb-4">
                    <p className="text-[10px] text-[#9CA3AF] mb-2 font-medium">Saldo acumulado projetado — mês a mês</p>
                    <div className="overflow-x-auto">
                      <div className="flex gap-2" style={{ minWidth: '720px' }}>
                        {projectionData.map((item, index) => {
                          const acc = projAcumulado[index];
                          const isCurrentM = index === currentMonthIndex;
                          return (
                            <div key={index} className={`flex-1 text-center rounded-lg py-2 px-1 border transition-all ${isCurrentM ? 'border-[#FACC15]/40 bg-[#FACC15]/5' : item.isProjection ? 'border-white/5 bg-white/[0.02]' : 'border-white/5 bg-white/[0.03]'}`}>
                              <p className={`text-[10px] mb-1 ${isCurrentM ? 'text-[#FACC15]' : 'text-[#9CA3AF]'}`}>{item.month}</p>
                              <p className={`text-[9px] font-bold ${acc >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'} ${item.isProjection ? 'opacity-70' : ''}`}>{acc >= 0 ? '+' : ''}{formatCurrency(acc).replace('R$\u00a0', 'R$')}</p>
                              {item.isProjection && <p className="text-[8px] text-[#FACC15]/50 mt-0.5">est.</p>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                    <div className="text-center"><p className="text-[10px] text-[#9CA3AF] mb-1">Receita projetada {currentYear}</p><p className="text-xs sm:text-sm font-normal text-[#10B981]">{formatCurrency(projTotalReceita)}</p></div>
                    <div className="text-center"><p className="text-[10px] text-[#9CA3AF] mb-1">Despesa projetada {currentYear}</p><p className="text-xs sm:text-sm font-normal text-[#EF4444]">{formatCurrency(projTotalDespesa)}</p></div>
                    <div className="text-center"><p className="text-[10px] text-[#9CA3AF] mb-1">Saldo projetado {currentYear}</p><p className={`text-xs sm:text-sm font-normal ${projTotalSaldo >= 0 ? 'text-[#FACC15]' : 'text-[#EF4444]'}`}>{projTotalSaldo >= 0 ? '+' : ''}{formatCurrency(projTotalSaldo)}</p></div>
                  </div>
                </>
              )}
            </div>
          </DraggableSection>
        );

      // ─── METAS DO MÊS ───────────────────────────────────────────────────────
      case SECTION_IDS.MONTHLY_GOALS:
        return (
          <DraggableSection key={sectionId} id={sectionId}>
            <div className="bg-[#16122A] border border-white/5 rounded-xl p-3 sm:p-4 transition-all duration-300 mb-4 lg:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center">
                    <i className="ri-target-line text-[#7C3AED] text-base sm:text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg lg:text-xl font-normal text-[#F9FAFB]">Metas do Mês</h2>
                    <p className="text-[10px] text-[#9CA3AF] capitalize">{getFormattedMonth(selectedGoalMonth)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-[#0E0B16] border border-white/5 rounded-xl px-2 py-1.5 self-start sm:self-auto">
                  <button onClick={handlePreviousMonth} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"><i className="ri-arrow-left-s-line text-[#F9FAFB] text-lg"></i></button>
                  <button onClick={handleNextMonth} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"><i className="ri-arrow-right-s-line text-[#F9FAFB] text-lg"></i></button>
                </div>
              </div>
              {loadingBudgets ? (
                <div className="text-center py-8 text-[#9CA3AF]">Carregando...</div>
              ) : categoryData.length === 0 ? (
                <div className="text-center py-8"><i className="ri-inbox-line text-4xl text-[#9CA3AF] mb-3 block"></i><p className="text-[#9CA3AF]">Nenhuma meta configurada para este mês</p></div>
              ) : (
                <>
                  <div className="space-y-3 lg:hidden">
                    {categoryData.map(category => {
                      const difference = category.budget - category.spent;
                      const statusColor = getStatusColor(category.status);
                      const progressColor = getProgressColor(category.percentage);
                      return (
                        <div key={category.id} className="bg-[#0E0B16] border border-white/5 rounded-lg p-4 hover:bg-white/5 transition-all duration-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${category.color}20` }}><div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div></div>
                            <div className="flex-1"><h3 className="text-sm font-semibold text-[#F9FAFB]">{category.name}</h3><span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mt-1" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>{getStatusText(category.status)}</span></div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div><p className="text-xs text-[#9CA3AF] mb-1">Meta</p><p className="text-sm font-semibold text-[#F9FAFB]">{formatCurrency(category.budget)}</p></div>
                            <div><p className="text-xs text-[#9CA3AF] mb-1">Gasto</p><p className="text-sm font-semibold text-[#F9FAFB]">{formatCurrency(category.spent)}</p></div>
                            <div><p className="text-xs text-[#9CA3AF] mb-1">Diferença</p><p className="text-sm font-semibold" style={{ color: difference >= 0 ? '#22C55E' : '#EF4444' }}>{formatCurrency(difference)}</p></div>
                            <div><p className="text-xs text-[#9CA3AF] mb-1">Progresso</p><p className="text-sm font-semibold text-[#F9FAFB]">{category.percentage.toFixed(0)}%</p></div>
                          </div>
                          <div className="flex items-center gap-2"><div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(category.percentage, 100)}%`, backgroundColor: progressColor }}></div></div></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] whitespace-nowrap">Categoria</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-[#9CA3AF] whitespace-nowrap">Meta</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-[#9CA3AF] whitespace-nowrap">Gasto</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-[#9CA3AF] whitespace-nowrap">Diferença</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-[#9CA3AF] whitespace-nowrap">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] whitespace-nowrap">Progresso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryData.map(category => {
                          const difference = category.budget - category.spent;
                          const statusColor = getStatusColor(category.status);
                          const progressColor = getProgressColor(category.percentage);
                          return (
                            <tr key={category.id} className="border-b border-white/5 hover:bg-white/5 transition-all duration-200">
                              <td className="py-4 px-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${category.color}20` }}><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }}></div></div><span className="text-sm font-medium text-[#F9FAFB]">{category.name}</span></div></td>
                              <td className="py-4 px-4 text-right text-sm text-[#9CA3AF]">{formatCurrency(category.budget)}</td>
                              <td className="py-4 px-4 text-right text-sm font-semibold text-[#F9FAFB]">{formatCurrency(category.spent)}</td>
                              <td className="py-4 px-4 text-right text-sm font-semibold" style={{ color: difference >= 0 ? '#22C55E' : '#EF4444' }}>{formatCurrency(difference)}</td>
                              <td className="py-4 px-4 text-center"><span className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-block" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>{getStatusText(category.status)}</span></td>
                              <td className="py-4 px-4"><div className="flex items-center gap-2"><div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(category.percentage, 100)}%`, backgroundColor: progressColor }}></div></div><span className="text-xs font-semibold text-[#F9FAFB] w-12 text-right">{category.percentage.toFixed(0)}%</span></div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </DraggableSection>
        );

      // ─── EVOLUÇÃO MENSAL ────────────────────────────────────────────────────
      case SECTION_IDS.MONTHLY_EVOLUTION:
        return (
          <DraggableSection key={sectionId} id={sectionId}>
            <div className="bg-[#16122A] border border-white/5 rounded-xl p-3 sm:p-4 transition-all duration-300 mb-4 lg:mb-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center"><i className="ri-line-chart-line text-[#7C3AED] text-base sm:text-lg"></i></div>
                <div>
                  <h2 className="text-base sm:text-lg lg:text-xl font-normal text-[#F9FAFB]">Evolução Mensal – Valor Líquido</h2>
                  <p className="text-[10px] text-[#9CA3AF]">Janeiro a {new Date(currentYear, currentMonthIndex).toLocaleDateString('pt-BR', { month: 'long' })} de {currentYear}</p>
                </div>
              </div>
              <div className="relative h-48 sm:h-64 lg:h-80">
                <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#7C3AED" /><stop offset="100%" stopColor="#EC4899" /></linearGradient>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#7C3AED" stopOpacity="0.3" /><stop offset="100%" stopColor="#7C3AED" stopOpacity="0" /></linearGradient>
                  </defs>
                  {evolutionData.length > 0 && (
                    <>
                      <path d={`M 0 ${300 - (evolutionData[0].value / 80)} ${evolutionData.map((item, index) => { const x = (index / (evolutionData.length - 1)) * 800; const y = 300 - Math.max(item.value, 0) / 80; return `L ${x} ${y}`; }).join(' ')} L 800 300 L 0 300 Z`} fill="url(#areaGradient)" />
                      <path d={`M 0 ${300 - (evolutionData[0].value / 80)} ${evolutionData.map((item, index) => { const x = (index / (evolutionData.length - 1)) * 800; const y = 300 - Math.max(item.value, 0) / 80; return `L ${x} ${y}`; }).join(' ')}`} fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      {evolutionData.map((item, index) => { const x = (index / (evolutionData.length - 1)) * 800; const y = 300 - Math.max(item.value, 0) / 80; return <circle key={index} cx={x} cy={y} r="4" fill="#7C3AED" stroke="#F9FAFB" strokeWidth="2" />; })}
                    </>
                  )}
                </svg>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mt-4 sm:mt-6">
                {evolutionData.map((item, index) => (
                  <div key={index} className="text-center">
                    <p className="text-[10px] text-[#9CA3AF] mb-1">{item.month}</p>
                    <p className={`text-xs sm:text-sm font-normal ${item.value >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{formatCurrency(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </DraggableSection>
        );

      // ─── TRADES ─────────────────────────────────────────────────────────────
      case SECTION_IDS.TRADES_EVOLUTION:
        return (
          <DraggableSection key={sectionId} id={sectionId}>
            <div className="bg-[#16122A] border border-white/5 rounded-xl p-3 sm:p-4 transition-all duration-300">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EC4899]/20 flex items-center justify-center"><i className="ri-stock-line text-[#EC4899] text-base sm:text-lg"></i></div>
                <div>
                  <h2 className="text-base sm:text-lg lg:text-xl font-normal text-[#F9FAFB]">Evolução Mensal – Trades</h2>
                  <p className="text-[10px] text-[#9CA3AF]">Janeiro a Dezembro de {currentYear}</p>
                </div>
              </div>
              {tradesEvolutionData.every(d => d.result === 0 && d.gains === 0 && d.losses === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 text-center"><i className="ri-bar-chart-2-line text-4xl text-[#9CA3AF] mb-3"></i><p className="text-[#9CA3AF] text-sm">Nenhum trade registrado ainda</p></div>
              ) : (
                <>
                  <div className="overflow-x-auto pb-2">
                    <div className="flex items-end gap-2 h-48 sm:h-64 mb-4" style={{ minWidth: '720px' }}>
                      {tradesEvolutionData.map((item, index) => {
                        const maxAbs = Math.max(...tradesEvolutionData.map(d => Math.max(Math.abs(d.gains), Math.abs(d.losses))), 1);
                        const gainHeight = (item.gains / maxAbs) * 100;
                        const lossHeight = (item.losses / maxAbs) * 100;
                        const isCurrentM = index === currentMonthIndex;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                            <div className="w-full flex flex-col items-center justify-end gap-0.5 h-full">
                              {item.gains > 0 && <div className="w-full rounded-t-md bg-gradient-to-t from-[#22C55E] to-[#22C55E]/60 transition-all duration-500" style={{ height: `${gainHeight}%`, minHeight: '4px' }} title={`Gain: ${formatCurrency(item.gains)}`} />}
                              {item.losses > 0 && <div className="w-full rounded-b-md bg-gradient-to-b from-[#EF4444] to-[#EF4444]/60 transition-all duration-500" style={{ height: `${lossHeight}%`, minHeight: '4px' }} title={`Loss: ${formatCurrency(item.losses)}`} />}
                              {item.gains === 0 && item.losses === 0 && <div className="w-full rounded-md bg-white/5" style={{ height: '4px' }} />}
                            </div>
                            <p className={`text-[10px] mt-1 whitespace-nowrap ${isCurrentM ? 'text-[#EC4899] font-semibold' : 'text-[#9CA3AF]'}`}>{item.month}{isCurrentM ? ' ●' : ''}</p>
                            <p className={`text-[9px] font-bold whitespace-nowrap ${item.result > 0 ? 'text-[#22C55E]' : item.result < 0 ? 'text-[#EF4444]' : 'text-[#9CA3AF]'}`}>{item.result !== 0 ? `${item.result > 0 ? '+' : ''}${formatCurrency(item.result).replace('R$\u00a0', '').replace('R$ ', '')}` : '—'}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {(() => {
                    const totalGains = tradesEvolutionData.reduce((s, d) => s + d.gains, 0);
                    const totalLosses = tradesEvolutionData.reduce((s, d) => s + d.losses, 0);
                    const totalResult = tradesEvolutionData.reduce((s, d) => s + d.result, 0);
                    return (
                      <div className="grid grid-cols-3 gap-2 mb-4 pt-3">
                        <div className="bg-[#0E0B16] border border-[#22C55E]/20 rounded-xl p-2 text-center"><p className="text-[10px] text-[#9CA3AF] mb-1">Total Gains {currentYear}</p><p className="text-xs font-normal text-[#22C55E]">{formatCurrency(totalGains)}</p></div>
                        <div className="bg-[#0E0B16] border border-[#EF4444]/20 rounded-xl p-2 text-center"><p className="text-[10px] text-[#9CA3AF] mb-1">Total Losses {currentYear}</p><p className="text-xs font-normal text-[#EF4444]">{formatCurrency(totalLosses)}</p></div>
                        <div className={`bg-[#0E0B16] border rounded-xl p-2 text-center ${totalResult >= 0 ? 'border-[#EC4899]/20' : 'border-[#EF4444]/20'}`}><p className="text-[10px] text-[#9CA3AF] mb-1">Resultado {currentYear}</p><p className={`text-xs font-normal ${totalResult >= 0 ? 'text-[#EC4899]' : 'text-[#EF4444]'}`}>{totalResult >= 0 ? '+' : ''}{formatCurrency(totalResult)}</p></div>
                      </div>
                    );
                  })()}
                  <div className="flex items-center justify-center gap-4 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#22C55E]" /><span className="text-[10px] text-[#9CA3AF]">Gain</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#EF4444]" /><span className="text-[10px] text-[#9CA3AF]">Loss</span></div>
                    <div className="flex items-center gap-2"><span className="text-[#EC4899] text-xs">●</span><span className="text-[10px] text-[#9CA3AF]">Mês atual</span></div>
                  </div>
                </>
              )}
            </div>
          </DraggableSection>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 w-full">
        <div className="mb-4 lg:mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-light text-[#F9FAFB]">
              Olá, <span className="text-[#7C3AED] font-normal">{firstName}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">Bem-vindo ao seu painel financeiro</p>
          </div>
        </div>

        {sectionOrder.map(sectionId => renderSection(sectionId))}
      </div>

      {/* Botões Flutuantes */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col gap-3 sm:gap-4 z-40">
        <button onClick={() => setShowReceitaModal(true)} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center cursor-pointer hover:scale-110 transition-all shadow-lg shadow-[#10B981]/50">
          <i className="ri-add-line text-white text-2xl sm:text-3xl"></i>
        </button>
        <button onClick={() => setShowDespesaModal(true)} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center cursor-pointer hover:scale-110 transition-all shadow-lg shadow-[#EF4444]/50">
          <i className="ri-subtract-line text-white text-2xl sm:text-3xl"></i>
        </button>
      </div>

      {/* Modal Nova Receita */}
      {showReceitaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowReceitaModal(false)}>
          <div className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#16122A] p-6 border-b border-white/10 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#22C55E]/20 to-[#16A34A]/20 flex items-center justify-center"><i className="ri-add-line text-2xl text-[#22C55E]"></i></div>
                <h2 className="text-2xl font-bold text-[#F9FAFB]">Nova Receita</h2>
              </div>
              <button onClick={() => setShowReceitaModal(false)} className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"><i className="ri-close-line text-xl text-[#F9FAFB]"></i></button>
            </div>
            <div className="p-6">
              <form className="space-y-5" onSubmit={handleSaveReceita}>
                <div><label className="block text-sm font-medium text-[#F9FAFB] mb-2">Data</label><input ref={receitaDateRef} type="date" defaultValue={today} required className="w-full bg-[#0E0B16] border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] text-sm focus:outline-none focus:border-[#22C55E] transition-all" /></div>
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Categoria</label>
                  <div className="flex gap-2">
                    <select ref={receitaCatRef} required className="flex-1 bg-[#0E0B16] border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] text-sm focus:outline-none focus:border-[#22C55E] transition-all cursor-pointer">
                      {categoriasReceita.length === 0 ? <option value="">Nenhuma categoria cadastrada</option> : categoriasReceita.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => openNewCategoryModal('receita')} className="w-12 h-12 rounded-lg bg-[#22C55E]/20 hover:bg-[#22C55E]/30 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"><i className="ri-add-line text-xl text-[#22C55E]"></i></button>
                  </div>
                </div>
                <div><label className="block text-sm font-medium text-[#F9FAFB] mb-2">Valor</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">R$</span><input ref={receitaValorRef} type="number" step="0.01" min="0.01" placeholder="0,00" required className="w-full bg-[#0E0B16] border border-white/10 rounded-lg pl-12 pr-4 py-3 text-[#F9FAFB] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#22C55E] transition-all" /></div></div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowReceitaModal(false)} className="flex-1 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-[#F9FAFB] font-medium transition-all cursor-pointer whitespace-nowrap">Cancelar</button>
                  <button type="submit" disabled={savingReceita} className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white font-semibold transition-all cursor-pointer shadow-lg shadow-[#22C55E]/20 whitespace-nowrap disabled:opacity-60">{savingReceita ? 'Salvando...' : 'Adicionar'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Despesa */}
      {showDespesaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDespesaModal(false)}>
          <div className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#16122A] p-6 border-b border-white/10 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#EF4444]/20 to-[#DC2626]/20 flex items-center justify-center"><i className="ri-subtract-line text-2xl text-[#EF4444]"></i></div>
                <h2 className="text-2xl font-bold text-[#F9FAFB]">Nova Despesa</h2>
              </div>
              <button onClick={() => setShowDespesaModal(false)} className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"><i className="ri-close-line text-xl text-[#F9FAFB]"></i></button>
            </div>
            <div className="p-6">
              <form className="space-y-5" onSubmit={handleSaveDespesa}>
                <div><label className="block text-sm font-medium text-[#F9FAFB] mb-2">Data</label><input ref={despesaDateRef} type="date" defaultValue={today} required className="w-full bg-[#0E0B16] border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] text-sm focus:outline-none focus:border-[#EF4444] transition-all" /></div>
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Categoria</label>
                  <div className="flex gap-2">
                    <select ref={despesaCatRef} required className="flex-1 bg-[#0E0B16] border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] text-sm focus:outline-none focus:border-[#EF4444] transition-all cursor-pointer">
                      {categoriasDespesa.length === 0 ? <option value="">Nenhuma categoria cadastrada</option> : categoriasDespesa.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => openNewCategoryModal('despesa')} className="w-12 h-12 rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/30 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"><i className="ri-add-line text-xl text-[#EF4444]"></i></button>
                  </div>
                </div>
                <div><label className="block text-sm font-medium text-[#F9FAFB] mb-2">Valor</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">R$</span><input ref={despesaValorRef} type="number" step="0.01" min="0.01" placeholder="0,00" required className="w-full bg-[#0E0B16] border border-white/10 rounded-lg pl-12 pr-4 py-3 text-[#F9FAFB] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#EF4444] transition-all" /></div></div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowDespesaModal(false)} className="flex-1 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-[#F9FAFB] font-medium transition-all cursor-pointer whitespace-nowrap">Cancelar</button>
                  <button type="submit" disabled={savingDespesa} className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] text-white font-semibold transition-all cursor-pointer shadow-lg shadow-[#EF4444]/20 whitespace-nowrap disabled:opacity-60">{savingDespesa ? 'Salvando...' : 'Adicionar'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Categoria */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setShowNewCategoryModal(false)}>
          <div className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#F9FAFB]">Nova Categoria de {newCategoryModalType === 'receita' ? 'Receita' : 'Despesa'}</h3>
              <button onClick={() => setShowNewCategoryModal(false)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"><i className="ri-close-line text-lg text-[#F9FAFB]"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-[#F9FAFB] mb-2">Nome da Categoria</label><input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder={newCategoryModalType === 'receita' ? 'Ex: Freelance' : 'Ex: Alimentação'} className="w-full bg-[#0E0B16] border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] transition-all" /></div>
              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Cor</label>
                <div className="grid grid-cols-8 gap-2">
                  {colorOptions.map(color => (<button key={color} type="button" onClick={() => setNewCategoryColor(color)} className={`w-8 h-8 rounded-lg cursor-pointer transition-all ${newCategoryColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#16122A]' : ''}`} style={{ backgroundColor: color }} />))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewCategoryModal(false)} className="flex-1 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-[#F9FAFB] font-medium transition-all cursor-pointer whitespace-nowrap">Cancelar</button>
                <button type="button" onClick={handleSaveNewCategory} disabled={savingCategory || !newCategoryName.trim()} className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white font-semibold transition-all cursor-pointer shadow-lg shadow-[#7C3AED]/20 whitespace-nowrap disabled:opacity-60">{savingCategory ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWelcomeModal && <WelcomeModal onClose={handleCloseWelcome} />}
      {showOnboarding && (
        <OnboardingModal
          onClose={() => setShowOnboarding(false)}
          onFinish={() => setShowWelcomeModal(true)}
        />
      )}
    </MainLayout>
  );
}
