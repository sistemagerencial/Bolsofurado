
import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabaseClient';

export default function ReceitasPage() {
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const [revenues, setRevenues] = useState<any[]>([]);
  const [totalRevenues, setTotalRevenues] = useState(0);
  const [thisMonthRevenues, setThisMonthRevenues] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
        try {
        const { data } = await supabase.from('revenues').select('*');
        const { data: cats } = await supabase.from('categories').select('name');
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        setRevenues(list as any[]);
        setCategories(Array.isArray(cats) ? (cats as any[]).map((c) => c.name) : []);
        const total = list.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
        setTotalRevenues(total);
        const month = new Date().toISOString().slice(0,7); // current YYYY-MM
        const thisMonthTotal = list
          .filter((r: any) => (r.date || '').toString().startsWith(month))
          .reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
        setThisMonthRevenues(thisMonthTotal);
      } catch (err) {
        // ignore
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const filteredRevenues = revenues.filter(revenue =>
    (revenue.description || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    (revenue.category || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Vendas': '#22C55E',
      'Serviços': '#7C3AED',
      'Investimentos': '#EC4899',
      'Outros': '#FACC15'
    };
    return colors[category] || '#9CA3AF';
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validação simples do valor
    const amountNumber = parseFloat(String(formData.amount));
    if (isNaN(amountNumber) || amountNumber <= 0) {
      alert('Por favor, informe um valor válido para a receita.');
      return;
    }

    console.log('Nova receita:', { ...formData, amount: amountNumber });
    // Aqui você poderia chamar um serviço ou atualizar o estado global

    setShowModal(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      amount: ''
    });
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      alert('O nome da categoria não pode ser vazio.');
      return;
    }
    try {
      const { error } = await supabase.from('categories').insert({ name: newCategory.trim() });
      if (error) throw error;
      const { data: cats } = await supabase.from('categories').select('name');
      setCategories(Array.isArray(cats) ? (cats as any[]).map((c) => c.name) : []);
      setShowCategoryModal(false);
      setNewCategory('');
    } catch (err) {
      console.error('Erro ao adicionar categoria', err);
      alert('Erro ao adicionar categoria. Verifique o console.');
    }
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F9FAFB] mb-1 sm:mb-2">Receitas</h1>
            <p className="text-sm sm:text-base text-[#9CA3AF]">Controle completo de todas as receitas</p>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg shadow-[#22C55E]/10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#22C55E]/20 to-[#22C55E]/10 flex items-center justify-center">
                <i className="ri-arrow-up-circle-line text-xl sm:text-2xl text-[#22C55E]"></i>
              </div>
            </div>
            <h3 className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">Total de Receitas</h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#22C55E]">{formatCurrency(totalRevenues)}</p>
          </div>

          <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg shadow-[#7C3AED]/10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#EC4899]/20 flex items-center justify-center">
                <i className="ri-calendar-line text-xl sm:text-2xl text-[#7C3AED]"></i>
              </div>
            </div>
            <h3 className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">Receitas Este Mês</h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#F9FAFB]">{formatCurrency(thisMonthRevenues)}</p>
          </div>

          <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg shadow-[#EC4899]/10 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#EC4899]/20 to-[#7C3AED]/20 flex items-center justify-center">
                <i className="ri-line-chart-line text-xl sm:text-2xl text-[#EC4899]"></i>
              </div>
            </div>
            <h3 className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">Média Mensal</h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#F9FAFB]">{formatCurrency(totalRevenues / 6)}</p>
          </div>
        </div>

        {/* Busca */}
        <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 mb-4 sm:mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar receitas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0E0B16] border border-white/5 rounded-xl pl-4 pr-4 py-2.5 sm:py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
            />
          </div>
        </div>

        {/* Lista Mobile */}
        <div className="lg:hidden space-y-3">
          {filteredRevenues.map((revenue) => (
            <div key={revenue.id} className="bg-[#16122A] rounded-xl p-4 border border-white/5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F9FAFB] truncate">{revenue.description}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">{formatDate(revenue.date)}</p>
                </div>
                <p className="text-base font-bold text-[#22C55E] ml-3">{formatCurrency(revenue.amount)}</p>
              </div>
              <span
                className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: `${getCategoryColor(revenue.category)}20`,
                  color: getCategoryColor(revenue.category)
                }}
              >
                {revenue.category}
              </span>
            </div>
          ))}
        </div>

        {/* Tabela Desktop */}
        <div className="hidden lg:block bg-[#16122A] rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-[#0E0B16]">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF]">Data</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF]">Categoria</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF]">Descrição</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-[#9CA3AF]">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filteredRevenues.map((revenue) => (
                  <tr key={revenue.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="py-4 px-6 text-sm text-[#F9FAFB]">{formatDate(revenue.date)}</td>
                    <td className="py-4 px-6">
                      <span
                        className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${getCategoryColor(revenue.category)}20`,
                          color: getCategoryColor(revenue.category)
                        }}
                      >
                        {revenue.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-[#F9FAFB]">{revenue.description}</td>
                    <td className="py-4 px-6 text-right text-sm font-semibold text-[#22C55E]">
                      {formatCurrency(revenue.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botão Flutuante */}
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-[#22C55E] to-[#22C55E]/80 rounded-full shadow-2xl shadow-[#22C55E]/30 flex items-center justify-center hover:scale-110 transition-all cursor-pointer group z-40"
        >
          <i className="ri-add-line text-2xl lg:text-3xl text-white group-hover:rotate-90 transition-transform"></i>
        </button>
      </div>

      {/* Modal Nova Receita */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#16122A] border-b border-white/5 p-4 sm:p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB] mb-1">Nova Receita</h2>
                  <p className="text-xs sm:text-sm text-[#9CA3AF]">Registre uma nova entrada financeira</p>
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
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Data</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#22C55E]/50 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Categoria</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="flex-1 bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#22C55E]/50 transition-all text-sm cursor-pointer"
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.length === 0 ? (
                        <>
                          <option value="Vendas">Vendas</option>
                          <option value="Serviços">Serviços</option>
                          <option value="Investimentos">Investimentos</option>
                          <option value="Outros">Outros</option>
                        </>
                      ) : (
                        categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="w-12 h-12 bg-[#22C55E]/20 hover:bg-[#22C55E]/30 rounded-xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                    >
                      <i className="ri-add-line text-xl text-[#22C55E]"></i>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Descrição</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Venda de produto X"
                    className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#22C55E]/50 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Valor</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0,00"
                      className="w-full bg-[#0E0B16] border border-white/5 rounded-xl pl-12 pr-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#22C55E]/50 transition-all text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

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
                  className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-[#22C55E] to-[#22C55E]/80 hover:shadow-lg hover:shadow-[#22C55E]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Categoria */}
      {showCategoryModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => setShowCategoryModal(false)}
        >
          <div
            className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
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
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Nome da Categoria</label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Ex: Freelance"
                className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#22C55E]/50 transition-all text-sm mb-6"
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
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#22C55E] to-[#22C55E]/80 hover:shadow-lg hover:shadow-[#22C55E]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm"
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
