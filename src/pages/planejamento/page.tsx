import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useBudgets } from '../../hooks/useBudgets';
import { useCategories } from '../../hooks/useCategories';
import { useExpenses } from '../../hooks/useExpenses';
import { supabase } from '../../lib/supabase';
import BudgetEvolutionChart from './components/BudgetEvolutionChart';

interface NewBudgetForm {
  category_id: string;
  month: string;
  amount: string;
}

export default function PlanejamentoPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const shiftMonth = (delta: number) => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10);
    month += delta;
    if (month < 1) {
      month = 12;
      year -= 1;
    } else if (month > 12) {
      month = 1;
      year += 1;
    }
    setSelectedMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  const { budgets, loading, fetchBudgets, createBudget, deleteBudget, updateBudget } = useBudgets();
  const { categories } = useCategories('despesa');
  const { expenses } = useExpenses();

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [form, setForm] = useState<NewBudgetForm>({
    category_id: '',
    month: selectedMonth,
    amount: '',
  });

  useEffect(() => {
    fetchBudgets(selectedMonth);
  }, [selectedMonth]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sem categoria';
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Categoria desconhecida';
  };

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return '#9CA3AF';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.color || '#9CA3AF';
  };

  // Barra de progresso: verde enquanto dentro da meta, vermelho se estourar
  const getProgressBarColor = (percentage: number): string => {
    if (percentage > 100) return '#EF4444'; // estourou → vermelho
    return '#22C55E'; // dentro da meta → sempre verde
  };

  // Badge de status
  const getStatusInfo = (percentage: number): { label: string; color: string } => {
    if (percentage > 100) return { label: 'Extrapolou', color: '#EF4444' };
    return { label: 'OK', color: '#22C55E' };
  };

  // Calcula gastos reais por categoria no mês selecionado
  const getSpentByCategory = (categoryId: string | null): number => {
    if (!categoryId) return 0;
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    return expenses
      .filter(expense => {
        if (expense.category_id !== categoryId) return false;
        const datePart = expense.date.substring(0, 10);
        const parts = datePart.split('-');
        const expYear = parseInt(parts[0], 10);
        const expMonth = parseInt(parts[1], 10);
        return expYear === year && expMonth === month;
      })
      .reduce((sum, expense) => sum + Number(expense.amount), 0);
  };

  const totalBudget = budgets.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalSpent = budgets.reduce((sum, budget) => {
    return sum + getSpentByCategory(budget.category_id);
  }, 0);
  const totalDifference = totalBudget - totalSpent;

  const planningData = budgets.map(budget => {
    const budgetAmount = Number(budget.amount);
    const spent = getSpentByCategory(budget.category_id);
    const difference = budgetAmount - spent;
    const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
    const statusInfo = getStatusInfo(percentage);
    const progressColor = getProgressBarColor(percentage);

    return {
      id: budget.id,
      category_id: budget.category_id,
      categoryName: getCategoryName(budget.category_id),
      categoryColor: getCategoryColor(budget.category_id),
      budget: budgetAmount,
      spent,
      difference,
      percentage,
      statusInfo,
      progressColor,
    };
  });

  const alerts = planningData
    .filter(item => item.percentage >= 90)
    .slice(0, 3);

  const openModal = () => {
    setForm({ category_id: '', month: selectedMonth, amount: '' });
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleSave = async () => {
    if (!form.category_id || !form.month || !form.amount) return;
    const parts = form.month.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const amount = parseFloat(form.amount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;

    try {
      setSaving(true);
      await createBudget({ category_id: form.category_id, month, year, amount });
      closeModal();
      fetchBudgets(selectedMonth);
    } catch {
      // erro tratado no hook
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await deleteBudget(id);
      setDeleteConfirmId(null);
    } catch {
      // erro tratado no hook
    } finally {
      setDeleting(false);
    }
  };

  // Funções para edição inline
  const startEditing = (id: string, currentAmount: number) => {
    setEditingId(id);
    setEditValue(currentAmount.toString());
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (id: string) => {
    const newAmount = parseFloat(editValue.replace(',', '.'));
    if (isNaN(newAmount) || newAmount <= 0) {
      cancelEditing();
      return;
    }

    try {
      setUpdating(true);
      await updateBudget(id, { amount: newAmount });
      cancelEditing();
      fetchBudgets(selectedMonth);
    } catch {
      // erro tratado no hook
    } finally {
      setUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      saveEdit(id);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // Calcula o mês anterior a partir do selectedMonth
  const getPreviousMonth = (): { year: number; month: number; label: string } => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) - 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    const date = new Date(year, month - 1, 1);
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return { year, month, label };
  };

  const handleCopyPreviousMonth = async () => {
    setCopyError(null);
    const prev = getPreviousMonth();

    try {
      setCopying(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Busca metas do mês anterior
      const { data: prevBudgets, error: fetchErr } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', prev.year)
        .eq('month', prev.month);

      if (fetchErr) throw fetchErr;

      if (!prevBudgets || prevBudgets.length === 0) {
        setCopyError(`Nenhuma meta encontrada em ${prev.label}.`);
        return;
      }

      // Verifica quais categorias já existem no mês atual para não duplicar
      const existingCategoryIds = new Set(budgets.map(b => b.category_id));

      const toInsert = prevBudgets
        .filter(b => !existingCategoryIds.has(b.category_id))
        .map(b => ({
          user_id: user.id,
          category_id: b.category_id,
          month: parseInt(selectedMonth.split('-')[1], 10),
          year: parseInt(selectedMonth.split('-')[0], 10),
          amount: b.amount,
        }));

      if (toInsert.length === 0) {
        setCopyError('Todas as categorias do mês anterior já possuem meta neste mês.');
        return;
      }

      const { error: insertErr } = await supabase
        .from('budgets')
        .insert(toInsert);

      if (insertErr) throw insertErr;

      await fetchBudgets(selectedMonth);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err: any) {
      setCopyError(err.message || 'Erro ao copiar metas.');
    } finally {
      setCopying(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando metas...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const prevMonthLabel = getPreviousMonth().label;

  return (
    <MainLayout>
      <div className="p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">Metas Mensais</h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Defina e acompanhe as metas de cada categoria</p>
            </div>
            <button
              onClick={openModal}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer flex-shrink-0"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-add-line text-base"></i>
              </div>
              <span>Nova Meta</span>
            </button>
          </div>

          {/* Linha 2: seletor de mês + copiar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-[#F9FAFB] transition-all"
                aria-label="Mês anterior"
              >
                <i className="ri-arrow-left-s-line text-lg" />
              </button>

              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex-1 min-w-0 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer bg-[#1E1A2E]"
              />

              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-[#F9FAFB] transition-all"
                aria-label="Próximo mês"
              >
                <i className="ri-arrow-right-s-line text-lg" />
              </button>

              <button
                onClick={handleCopyPreviousMonth}
                disabled={copying}
                title={`Copiar metas de ${prevMonthLabel}`}
                className="flex items-center gap-1.5 border border-transparent bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60 flex-shrink-0"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {copying
                    ? <i className="ri-loader-4-line text-base animate-spin"></i>
                    : <i className="ri-file-copy-line text-base"></i>
                  }
                </div>
                <span className="hidden sm:inline">{copying ? 'Copiando...' : 'Copiar Meta'}</span>
                <span className="sm:hidden">{copying ? '...' : 'Copiar'}</span>
              </button>
            
            <p className="text-xs text-amber-400 mt-2 sm:mt-0">Ao fechar o mês, replique suas metas para o próximo mês clicando <strong>Copiar Meta</strong>.</p>
          </div>
        </div>

        {/* Feedback de cópia */}
        {copySuccess && (
          <div className="mb-3 flex items-center gap-3 bg-green-900/30 border border-green-700/50 rounded-lg px-4 py-3">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-green-400 text-lg"></i>
            </div>
            <p className="text-sm text-green-300 font-medium">Metas copiadas com sucesso!</p>
          </div>
        )}
        {copyError && (
          <div className="mb-3 flex items-center justify-between gap-3 bg-amber-900/30 border border-amber-700/50 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-information-line text-amber-400 text-lg"></i>
              </div>
              <p className="text-sm text-amber-300">{copyError}</p>
            </div>
            <button onClick={() => setCopyError(null)} className="w-5 h-5 flex items-center justify-center text-amber-500 hover:text-amber-300 cursor-pointer">
              <i className="ri-close-line"></i>
            </button>
          </div>
        )}

        {/* Cards de Resumo — 3 colunas sempre */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-white/5 rounded-xl p-2.5 sm:p-5 border border-white/10">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
              <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <i className="ri-target-line text-sm sm:text-xl text-orange-400"></i>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 leading-tight">Meta Total</p>
                <p className="text-[11px] sm:text-xl font-bold text-orange-400 truncate leading-tight">{formatCurrency(totalBudget)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 sm:p-5 border border-white/10">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
              <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <i className="ri-arrow-up-circle-line text-sm sm:text-xl text-red-400"></i>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 leading-tight">Total Gasto</p>
                <p className="text-[11px] sm:text-xl font-bold text-gray-100 truncate leading-tight">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 sm:p-5 border border-white/10">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
              <div className={`w-7 h-7 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${totalDifference >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <i className={`ri-wallet-3-line text-sm sm:text-xl ${totalDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}></i>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 leading-tight">Saldo</p>
                <p className={`text-[11px] sm:text-xl font-bold truncate leading-tight ${totalDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(totalDifference)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {planningData.length === 0 ? (
          <div className="bg-white/5 rounded-xl border border-white/10 p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
              <i className="ri-target-line text-3xl text-teal-400"></i>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Nenhuma meta encontrada</h3>
            <p className="text-gray-400 text-sm mb-6">Comece definindo metas para suas categorias de despesas</p>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-add-line"></i>
              </div>
              Criar primeira meta
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="lg:hidden space-y-2 mb-4">
              {planningData.map((item) => (
                <div key={item.id} className="bg-white/5 rounded-xl border border-white/10 p-3">
                  {/* Linha 1: categoria + status + delete */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.categoryColor }}></div>
                      <span className="text-sm font-semibold text-white truncate">{item.categoryName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: `${item.statusInfo.color}25`, color: item.statusInfo.color }}
                      >
                        {item.statusInfo.label}
                      </span>
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>
                  </div>

                  {/* Linha 2: valores */}
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-xs text-gray-500 mb-0.5">Meta</p>
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, item.id)}
                            className="w-full bg-white/10 border border-teal-500/50 rounded px-1 py-0.5 text-xs text-white focus:outline-none"
                            autoFocus
                          />
                          <button onClick={() => saveEdit(item.id)} className="text-green-400 cursor-pointer flex-shrink-0">
                            <i className="ri-check-line text-xs"></i>
                          </button>
                          <button onClick={cancelEditing} className="text-gray-500 cursor-pointer flex-shrink-0">
                            <i className="ri-close-line text-xs"></i>
                          </button>
                        </div>
                      ) : (
                        <p
                          className="text-xs font-bold text-orange-400 cursor-pointer leading-tight"
                          onDoubleClick={() => startEditing(item.id, item.budget)}
                          title="Toque duplo para editar"
                        >
                          {formatCurrency(item.budget)}
                        </p>
                      )}
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-xs text-gray-500 mb-0.5">Gasto</p>
                      <p className="text-xs font-bold text-gray-100 leading-tight">{formatCurrency(item.spent)}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-xs text-gray-500 mb-0.5">Saldo</p>
                      <p className="text-xs font-bold leading-tight" style={{ color: item.difference >= 0 ? '#22C55E' : '#EF4444' }}>{formatCurrency(item.difference)}</p>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(item.percentage, 100)}%`, backgroundColor: item.progressColor }}></div>
                    </div>
                    <span className="text-xs font-medium text-gray-400 w-9 text-right flex-shrink-0">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Acompanhamento por Categoria</h2>
                <p className="text-xs text-gray-500 mt-1">Clique duplo na meta para editar o valor</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Meta</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gasto</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Diferença</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Progresso</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {planningData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.categoryColor }}></div>
                            <span className="text-sm font-medium text-gray-900">{item.categoryName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {editingId === item.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, item.id)}
                                  className="w-24 text-right border border-teal-300 rounded px-6 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                                  autoFocus
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => saveEdit(item.id)} disabled={updating} className="w-6 h-6 flex items-center justify-center rounded text-green-600 hover:bg-green-50 transition-colors cursor-pointer disabled:opacity-50">
                                  {updating ? <div className="w-3 h-3 border-2 border-green-600/40 border-t-green-600 rounded-full animate-spin"></div> : <i className="ri-check-line text-sm"></i>}
                                </button>
                                <button onClick={cancelEditing} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors cursor-pointer">
                                  <i className="ri-close-line text-sm"></i>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-orange-500 cursor-pointer hover:bg-orange-50 px-2 py-1 rounded transition-colors" onDoubleClick={() => startEditing(item.id, item.budget)} title="Clique duplo para editar">
                              {formatCurrency(item.budget)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right"><span className="text-sm font-semibold text-gray-900">{formatCurrency(item.spent)}</span></td>
                        <td className="px-6 py-4 text-right"><span className="text-sm font-semibold" style={{ color: item.difference >= 0 ? '#22C55E' : '#EF4444' }}>{formatCurrency(item.difference)}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(item.percentage, 100)}%`, backgroundColor: item.progressColor }}></div>
                            </div>
                            <span className="text-xs font-medium text-gray-500 w-10 text-right">{item.percentage.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${item.statusInfo.color}18`, color: item.statusInfo.color }}>
                              {item.statusInfo.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button onClick={() => setDeleteConfirmId(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                              <i className="ri-delete-bin-line text-base"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alertas */}
            {alerts.length > 0 && (
              <div className="mt-4 bg-amber-900/20 border border-amber-700/40 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <i className="ri-alert-line text-base text-amber-400"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-amber-300 mb-1.5">Alertas de Metas</h3>
                    <div className="space-y-1">
                      {alerts.map((alert) => (
                        <div key={alert.id} className="flex items-start gap-2 text-sm text-amber-200/80">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5"></div>
                          <span>
                            <strong>{alert.categoryName}</strong> atingiu {alert.percentage.toFixed(1)}% da meta —{' '}
                            {alert.percentage > 100 ? 'meta estourada!' : 'próximo do limite.'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gráfico de Evolução */}
            <BudgetEvolutionChart />
          </>
        )}
      </div>

      {/* Modal Nova Meta */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 p-4 flex items-start justify-center" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 72px)' }} onClick={closeModal}>
          <div className="bg-[#16122A] border border-white/10 w-full sm:max-w-md shadow-xl rounded-xl max-h-[90vh] flex flex-col overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
              <h2 className="text-base font-semibold text-white">Nova Meta</h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Categoria de Despesa</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer bg-white/5"
                >
                  <option value="" className="bg-[#16122A]">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-[#16122A]">{cat.name}</option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-amber-400 mt-1">Nenhuma categoria de despesa cadastrada ainda.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Mês / Ano</label>
                <input
                  type="month"
                  value={form.month}
                  onChange={(e) => setForm(prev => ({ ...prev, month: e.target.value }))}
                  className="w-full border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer bg-white/5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Valor da Meta (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={form.amount}
                    onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/5"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-white/10 flex-shrink-0">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 bg-white/10 hover:bg-white/15 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.category_id || !form.month || !form.amount}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    Salvando...
                  </span>
                ) : 'Salvar Meta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 z-50 p-4 flex items-start justify-center" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 72px)' }} onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-[#16122A] border border-white/10 w-full sm:max-w-sm shadow-xl rounded-xl p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-11 h-11 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <i className="ri-delete-bin-line text-xl text-red-400"></i>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Excluir Meta</h3>
                <p className="text-sm text-gray-400">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 bg-white/10 hover:bg-white/15 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
