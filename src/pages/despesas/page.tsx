import { useState, useMemo } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useExpenses } from '../../hooks/useExpenses';
import { useCategories } from '../../hooks/useCategories';
import type { Expense } from '../../hooks/useExpenses';

export default function DespesasPage() {
  const { expenses, loading: loadingExpenses, createExpense, updateExpense, deleteExpense } = useExpenses();
  const { categories, loading: loadingCategories, createCategory } = useCategories('despesa');

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [filterAll, setFilterAll] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Despesa salva com sucesso!');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: ''
  });
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    color: '#7C3AED'
  });

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    setFilterAll(false);
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    setFilterAll(false);
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('pt-BR');
  };

  const selectedPeriod = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  const periodExpenses = useMemo(() => {
    if (filterAll) return expenses;
    return expenses.filter(exp => exp.date.startsWith(selectedPeriod));
  }, [expenses, selectedPeriod, filterAll]);

  const totalExpenses = periodExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const averageMonthly = expenses.length > 0
    ? expenses.reduce((sum, exp) => sum + Number(exp.amount), 0) / 6
    : 0;

  const filteredExpenses = periodExpenses.filter(expense =>
    categories.find(cat => cat.id === expense.category_id)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatDate(expense.date).includes(searchTerm)
  );

  const getCategoryById = (categoryId: string | null) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const openNewModal = () => {
    setEditingExpense(null);
    setFormData({ date: new Date().toISOString().split('T')[0], category: '', amount: '' });
    setShowModal(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date,
      category: expense.category_id || '',
      amount: String(expense.amount)
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setFormData({ date: new Date().toISOString().split('T')[0], category: '', amount: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNumber = parseFloat(
      typeof formData.amount === 'string' ? formData.amount.replace(',', '.') : String(formData.amount)
    );
    if (isNaN(amountNumber) || amountNumber <= 0) return;
    setSaving(true);
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          date: formData.date,
          category_id: formData.category || null,
          description: editingExpense.description || '',
          amount: amountNumber
        });
        setSuccessMessage('Despesa atualizada com sucesso!');
      } else {
        await createExpense({
          date: formData.date,
          category_id: formData.category || null,
          description: '',
          amount: amountNumber
        });
        setSuccessMessage('Despesa salva com sucesso!');
      }
      handleCloseModal();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await deleteExpense(confirmDeleteId);
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryData.name.trim()) return;
    try {
      const created = await createCategory({ name: newCategoryData.name, type: 'despesa', color: newCategoryData.color });
      if (created && created.id) {
        setFormData(prev => ({ ...prev, category: created.id }));
      }
      setShowCategoryModal(false);
      setNewCategoryData({ name: '', color: '#7C3AED' });
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
    }
  };

  const colorOptions = ['#7C3AED', '#EC4899', '#22C55E', '#FACC15', '#3B82F6', '#EF4444', '#8B5CF6', '#10B981'];

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F9FAFB] mb-1 sm:mb-2">Despesas</h1>
            <p className="text-sm sm:text-base text-[#9CA3AF]">Controle completo de todas as despesas</p>
          </div>
        </div>

        {/* Filtro de Período */}
        <div className="bg-[#16122A] rounded-xl p-3 sm:p-4 border border-white/5 mb-6">
          {/* Linha 1: Navegação de mês */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <button
              onClick={handlePrevMonth}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer flex-shrink-0"
            >
              <i className="ri-arrow-left-s-line text-[#F9FAFB] text-xl"></i>
            </button>
            <div className="flex-1 max-w-[200px] text-center">
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-full transition-all inline-block whitespace-nowrap ${filterAll ? 'text-[#9CA3AF]' : 'text-[#F9FAFB] bg-[#EC4899]/15 border border-[#EC4899]/30'}`}>
                {filterAll ? 'Todos os períodos' : `${monthNames[selectedMonth]} ${selectedYear}`}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer flex-shrink-0"
            >
              <i className="ri-arrow-right-s-line text-[#F9FAFB] text-xl"></i>
            </button>
          </div>
          {/* Linha 2: Botões de atalho */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setFilterAll(f => !f);
                if (!filterAll) {
                  setSelectedMonth(now.getMonth());
                  setSelectedYear(now.getFullYear());
                }
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${filterAll ? 'bg-[#EC4899]/20 text-[#EC4899] border border-[#EC4899]/30' : 'bg-white/5 text-[#9CA3AF] hover:bg-white/10'}`}
            >
              Todos
            </button>
            <button
              onClick={() => { setSelectedMonth(now.getMonth()); setSelectedYear(now.getFullYear()); setFilterAll(false); }}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-[#9CA3AF] hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap"
            >
              Mês Atual
            </button>
          </div>
        </div>

        {/* Resumo Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg shadow-[#EC4899]/10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#EC4899]/20 to-[#7C3AED]/20 flex items-center justify-center mb-3 sm:mb-4">
              <i className="ri-arrow-down-circle-line text-xl sm:text-2xl text-[#EC4899]"></i>
            </div>
            <h3 className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">
              {filterAll ? 'Total de Despesas' : `Despesas em ${monthNames[selectedMonth]}`}
            </h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#EC4899]">
              {loadingExpenses ? '...' : formatCurrency(totalExpenses)}
            </p>
          </div>
          <div className="bg-[#16122A] rounded-xl p-3 sm:p-4 border border-white/5 shadow-md shadow-[#7C3AED]/8">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#7C3AED]/20 to-[#EC4899]/20 flex items-center justify-center mb-2 sm:mb-3">
              <i className="ri-bar-chart-line text-lg sm:text-xl text-[#7C3AED]"></i>
            </div>
            <h3 className="text-xs sm:text-xs text-[#9CA3AF] mb-1">Lançamentos no Período</h3>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#F9FAFB]">
              {loadingExpenses ? '...' : filteredExpenses.length}
            </p>
          </div>
          <div className="bg-[#16122A] rounded-xl p-3 sm:p-4 border border-white/5 shadow-md shadow-[#FACC15]/8 sm:col-span-2 lg:col-span-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#FACC15]/20 to-[#EF4444]/20 flex items-center justify-center mb-2 sm:mb-3">
              <i className="ri-line-chart-line text-lg sm:text-xl text-[#FACC15]"></i>
            </div>
            <h3 className="text-xs sm:text-xs text-[#9CA3AF] mb-1">Média Mensal</h3>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#F9FAFB]">
              {loadingExpenses ? '...' : formatCurrency(averageMonthly)}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 mb-4 sm:mb-6">
          <div className="relative">
            <i className="ri-search-line absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-base sm:text-lg"></i>
            <input
              type="text"
              placeholder="Buscar despesas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#0E0B16] border border-white/5 rounded-xl pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
            />
          </div>
        </div>

        {/* Mobile List */}
        <div className="lg:hidden space-y-3">
          {loadingExpenses ? (
            <div className="text-center py-8 text-[#9CA3AF]">Carregando...</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="bg-[#16122A] rounded-xl p-8 border border-white/5 text-center">
              <i className="ri-inbox-line text-4xl text-[#9CA3AF] mb-3"></i>
              <p className="text-[#9CA3AF]">Nenhuma despesa encontrada</p>
            </div>
          ) : (
            filteredExpenses.map(expense => {
              const category = getCategoryById(expense.category_id);
              return (
                <div key={expense.id} className="bg-[#16122A] rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-[#9CA3AF]">{formatDate(expense.date)}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-[#EC4899]">{formatCurrency(Number(expense.amount))}</p>
                      <button
                        onClick={() => openEditModal(expense)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 transition-all cursor-pointer"
                        title="Editar despesa"
                      >
                        <i className="ri-pencil-line text-sm text-[#7C3AED]"></i>
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(expense.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#EF4444]/10 hover:bg-[#EF4444]/20 transition-all cursor-pointer"
                        title="Excluir despesa"
                      >
                        <i className="ri-delete-bin-line text-sm text-[#EF4444]"></i>
                      </button>
                    </div>
                  </div>
                  {category && (
                    <span
                      className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      {category.name}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block bg-[#16122A] rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-[#0E0B16]">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF]">Data</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF]">Categoria</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-[#9CA3AF]">Valor</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-[#9CA3AF]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loadingExpenses ? (
                  <tr><td colSpan={4} className="py-8 text-center text-[#9CA3AF]">Carregando...</td></tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-[#9CA3AF]">Nenhuma despesa encontrada</td></tr>
                ) : (
                  filteredExpenses.map(expense => {
                    const category = getCategoryById(expense.category_id);
                    return (
                      <tr key={expense.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                        <td className="py-4 px-6 text-sm text-[#F9FAFB]">{formatDate(expense.date)}</td>
                        <td className="py-4 px-6">
                          {category && (
                            <span
                              className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                              style={{ backgroundColor: `${category.color}20`, color: category.color }}
                            >
                              {category.name}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right text-sm font-semibold text-[#EC4899]">
                          {formatCurrency(Number(expense.amount))}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => openEditModal(expense)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 transition-all cursor-pointer"
                              title="Editar despesa"
                            >
                              <i className="ri-pencil-line text-sm text-[#7C3AED]"></i>
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(expense.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#EF4444]/10 hover:bg-[#EF4444]/20 transition-all cursor-pointer"
                              title="Excluir despesa"
                            >
                              <i className="ri-delete-bin-line text-sm text-[#EF4444]"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={openNewModal}
          className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-[#7C3AED] to-[#EC4899] rounded-full shadow-2xl shadow-[#7C3AED]/30 flex items-center justify-center hover:scale-110 transition-all cursor-pointer group z-40"
        >
          <i className="ri-add-line text-2xl lg:text-3xl text-white group-hover:rotate-90 transition-transform"></i>
        </button>
      </div>

      {/* Notificação de Sucesso */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-[#7C3AED] text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3">
          <i className="ri-check-line text-xl"></i>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-sm shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
                <i className="ri-delete-bin-line text-2xl text-[#EF4444]"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F9FAFB] mb-1">Excluir Despesa</h3>
                <p className="text-sm text-[#9CA3AF]">Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.</p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-[#F9FAFB] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-[#EF4444] hover:bg-[#EF4444]/80 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm disabled:opacity-50"
                >
                  {deleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Nova / Editar Despesa */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b border-white/5 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/15 flex items-center justify-center">
                    <i className={`${editingExpense ? 'ri-pencil-line' : 'ri-add-line'} text-lg text-[#7C3AED]`}></i>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB]">
                    {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
                  </h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
                >
                  <i className="ri-close-line text-lg sm:text-xl text-[#F9FAFB]"></i>
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Data</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Categoria</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="flex-1 bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm cursor-pointer"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="w-12 h-12 bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 rounded-xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                    >
                      <i className="ri-add-line text-xl text-[#7C3AED]"></i>
                    </button>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-1">Cadastre uma nova categoria clicando no +</p>
                  </div>
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Valor</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0,00"
                      className="w-full bg-[#0E0B16] border border-white/5 rounded-xl pl-12 pr-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 sm:px-6 py-3 bg-white/5 hover:bg-white/10 text-[#F9FAFB] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-lg hover:shadow-[#7C3AED]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingExpense ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Nova Categoria */}
      {showCategoryModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => setShowCategoryModal(false)}
        >
          <div
            className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b border-white/5 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-[#F9FAFB]">Nova Categoria</h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
                >
                  <i className="ri-close-line text-lg text-[#F9FAFB]"></i>
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Nome da Categoria</label>
                  <input
                    type="text"
                    value={newCategoryData.name}
                    onChange={e => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
                    placeholder="Ex: Educação"
                    className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Cor</label>
                  <div className="grid grid-cols-8 gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCategoryData({ ...newCategoryData, color })}
                        className={`w-8 h-8 rounded-lg cursor-pointer transition-all ${newCategoryData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#16122A]' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-[#F9FAFB] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddCategory}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-lg hover:shadow-[#7C3AED]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
