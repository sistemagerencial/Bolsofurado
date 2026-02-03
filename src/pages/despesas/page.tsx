
import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabaseClient';

export default function DespesasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: ''
  });
  const [newCategory, setNewCategory] = useState('');

  // ---------- Utility Functions ----------
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Guard against invalid dates
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('pt-BR');
  };

  // ---------- Data Calculations ----------
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [thisMonthExpenses, setThisMonthExpenses] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data } = await supabase.from('expenses').select('*');
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        setExpenses(list);
        setTotalExpenses(list.reduce((s: number, e: any) => s + Number(e.amount || 0), 0));
        const month = new Date().toISOString().slice(0,7);
        setThisMonthExpenses(list.filter((e: any) => (e.date||'').toString().startsWith(month)).length);
      } catch (err) {
        // ignore
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const filteredExpenses = expenses.filter(expense =>
    (expense.description || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    (expense.category || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Pessoal': '#7C3AED',
      'Marketing': '#EC4899',
      'Infraestrutura': '#22C55E',
      'Tecnologia': '#FACC15',
      'Operacional': '#3B82F6',
      'Administrativo': '#8B5CF6'
    };
    return colors[category] || '#9CA3AF';
  };

  // ---------- Handlers ----------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.category || !formData.description || !formData.amount) {
      alert('Preencha todos os campos antes de salvar.');
      return;
    }

    // Parse amount safely
    const amountNumber = parseFloat(
      typeof formData.amount === 'string'
        ? formData.amount.replace(',', '.')
        : String(formData.amount)
    );

    if (isNaN(amountNumber) || amountNumber <= 0) {
      alert('Informe um valor válido para a despesa.');
      return;
    }

    const newExpense = {
      id: Date.now(),
      date: formData.date,
      category: formData.category,
      description: formData.description,
      amount: amountNumber
    };

    console.log('Nova despesa:', newExpense);
    // TODO: Persist the new expense (e.g., send to API or update state)

    setShowModal(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      amount: ''
    });
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      console.log('Nova categoria:', newCategory);
      // TODO: Persist the new category if needed
      setShowCategoryModal(false);
      setNewCategory('');
    } else {
      alert('Informe um nome para a categoria.');
    }
  };

  // ---------- Render ----------
  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F9FAFB] mb-1 sm:mb-2">
              Despesas
            </h1>
            <p className="text-sm sm:text-base text-[#9CA3AF]">
              Controle completo de todas as despesas
            </p>
          </div>
        </div>

        {/* Resumo Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {/* Total */}
          <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg shadow-[#EC4899]/10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#EC4899]/20 to-[#7C3AED]/20 flex items-center justify-center">
                <i className="ri-arrow-down-circle-line text-xl sm:text-2xl text-[#EC4899]"></i>
              </div>
            </div>
            <h3 className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">
              Total de Despesas
            </h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#EC4899]">
              {formatCurrency(totalExpenses)}
            </p>
          </div>

          {/* Este Mês */}
          <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg shadow-[#7C3AED]/10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#EC4899]/20 flex items-center justify-center">
                <i className="ri-calendar-line text-xl sm:text-2xl text-[#7C3AED]"></i>
              </div>
            </div>
            <h3 className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">
              Despesas Este Mês
            </h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#F9FAFB]">
              {thisMonthExpenses}
            </p>
          </div>

          {/* Média Mensal */}
          <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg shadow-[#FACC15]/10 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#FACC15]/20 to-[#EF4444]/20 flex items-center justify-center">
                <i className="ri-line-chart-line text-xl sm:text-2xl text-[#FACC15]"></i>
              </div>
            </div>
            <h3 className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">
              Média Mensal
            </h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#F9FAFB]">
              {formatCurrency(totalExpenses / 6)}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 mb-4 sm:mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar despesas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#0E0B16] border border-white/5 rounded-xl pl-4 pr-4 py-2.5 sm:py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
            />
          </div>
        </div>

        {/* Mobile List */}
        <div className="lg:hidden space-y-3">
          {filteredExpenses.map(expense => (
            <div key={expense.id} className="bg-[#16122A] rounded-xl p-4 border border-white/5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F9FAFB] truncate">
                    {expense.description}
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-1">{formatDate(expense.date)}</p>
                </div>
                <p className="text-base font-bold text-[#EC4899] ml-3">
                  {formatCurrency(expense.amount)}
                </p>
              </div>
              <span
                className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: `${getCategoryColor(expense.category)}20`,
                  color: getCategoryColor(expense.category)
                }}
              >
                {expense.category}
              </span>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block bg-[#16122A] rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-[#0E0B16]">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF]">
                    Data
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF]">
                    Categoria
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF]">
                    Descrição
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-[#9CA3AF]">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(expense => (
                  <tr key={expense.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="py-4 px-6 text-sm text-[#F9FAFB]">
                      {formatDate(expense.date)}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${getCategoryColor(expense.category)}20`,
                          color: getCategoryColor(expense.category)
                        }}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-[#F9FAFB]">
                      {expense.description}
                    </td>
                    <td className="py-4 px-6 text-right text-sm font-semibold text-[#EC4899]">
                      {formatCurrency(expense.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-[#7C3AED] to-[#EC4899] rounded-full shadow-2xl shadow-[#7C3AED]/30 flex items-center justify-center hover:scale-110 transition-all cursor-pointer group z-40"
        >
          <i className="ri-add-line text-2xl lg:text-3xl text-white group-hover:rotate-90 transition-transform"></i>
        </button>
      </div>

      {/* Modal - Nova Despesa */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#16122A] border-b border-white/5 p-4 sm:p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB] mb-1">
                    Nova Despesa
                  </h2>
                  <p className="text-xs sm:text-sm text-[#9CA3AF]">
                    Registre uma nova saída financeira
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
                >
                  <i className="ri-close-line text-lg sm:text-xl text-[#F9FAFB]"></i>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Data */}
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                    required
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                    Categoria
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="flex-1 bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm cursor-pointer"
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      <option value="Pessoal">Pessoal</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Infraestrutura">Infraestrutura</option>
                      <option value="Tecnologia">Tecnologia</option>
                      <option value="Operacional">Operacional</option>
                      <option value="Administrativo">Administrativo</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="w-12 h-12 bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 rounded-xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                    >
                      <i className="ri-add-line text-xl text-[#7C3AED]"></i>
                    </button>
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Pagamento de fornecedor"
                    className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                    required
                  />
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                    Valor
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0,00"
                      className="w-full bg-[#0E0B16] border border-white/5 rounded-xl pl-12 pr-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 sm:px-6 py-3 bg-white/5 hover:bg-white/10 text-[#F9FAFB] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-lg hover:shadow-[#7C3AED]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base"
                >
                  Salvar
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
                <h3 className="text-lg sm:text-xl font-bold text-[#F9FAFB]">
                  Nova Categoria
                </h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
                >
                  <i className="ri-close-line text-lg text-[#F9FAFB]"></i>
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                Nome da Categoria
              </label>
              <input
                type="text"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                placeholder="Ex: Educação"
                className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/5 transition-all text-sm mb-6"
              />
              <div className="flex gap-3">
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
