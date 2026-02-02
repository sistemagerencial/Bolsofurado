import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabaseClient';

interface Patrimonio {
  id: number;
  nome: string;
  tipo: string;
  valor: number;
  dataReferencia: string;
  observacoes?: string;
}

export default function PatrimoniosPage() {
  const [showModal, setShowModal] = useState(false);
  const [patrimonios, setPatrimonios] = useState<Patrimonio[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data } = await supabase.from('portfolio_assets').select('*');
        if (!mounted) return;
        if (data && Array.isArray(data)) {
          const mapped = data.map((d: any, i: number) => ({
            id: i + 1,
            nome: d.name || d.code || 'Ativo',
            tipo: d.type || 'Investimentos',
            valor: Number(d.current_value || d.invested || 0),
            dataReferencia: d.created_at || new Date().toISOString(),
            observacoes: d.status || ''
          }));
          setPatrimonios(mapped);
        }
      } catch (err) {
        // ignore
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'Imóvel',
    valor: '',
    dataReferencia: new Date().toISOString().split('T')[0],
    observacoes: ''
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalPatrimonio = patrimonios.reduce((sum, p) => sum + p.valor, 0);
  const totalImoveis = patrimonios.filter(p => p.tipo === 'Imóvel').reduce((sum, p) => sum + p.valor, 0);
  const totalVeiculos = patrimonios.filter(p => p.tipo === 'Veículo').reduce((sum, p) => sum + p.valor, 0);
  const totalInvestimentos = patrimonios.filter(p => p.tipo === 'Investimentos').reduce((sum, p) => sum + p.valor, 0);
  const totalCaixa = patrimonios.filter(p => p.tipo === 'Caixa').reduce((sum, p) => sum + p.valor, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const novoPatrimonio: Patrimonio = {
      id: Date.now(),
      nome: formData.nome,
      tipo: formData.tipo,
      valor: parseFloat(formData.valor),
      dataReferencia: formData.dataReferencia,
      observacoes: formData.observacoes
    };
    setPatrimonios([...patrimonios, novoPatrimonio]);
    setShowModal(false);
    setFormData({
      nome: '',
      tipo: 'Imóvel',
      valor: '',
      dataReferencia: new Date().toISOString().split('T')[0],
      observacoes: ''
    });
  };

  const handleDelete = (id: number) => {
    setPatrimonios(patrimonios.filter(p => p.id !== id));
  };

  const getIconByType = (tipo: string) => {
    switch (tipo) {
      case 'Imóvel': return 'ri-home-4-line';
      case 'Veículo': return 'ri-car-line';
      case 'Investimentos': return 'ri-line-chart-line';
      case 'Caixa': return 'ri-wallet-3-line';
      case 'Negócio': return 'ri-store-2-line';
      case 'Bens de Valor': return 'ri-vip-diamond-line';
      default: return 'ri-archive-line';
    }
  };

  const getColorByType = (tipo: string) => {
    switch (tipo) {
      case 'Imóvel': return '#7C3AED';
      case 'Veículo': return '#EC4899';
      case 'Investimentos': return '#10B981';
      case 'Caixa': return '#F59E0B';
      case 'Negócio': return '#3B82F6';
      case 'Bens de Valor': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  // Dados para o gráfico de evolução
  const evolutionData = [
    { month: 'Jan', value: 620000 },
    { month: 'Fev', value: 635000 },
    { month: 'Mar', value: 650000 },
    { month: 'Abr', value: 660000 },
    { month: 'Mai', value: 670000 },
    { month: 'Jun', value: 675000 },
  ];

  const maxValue = Math.max(...evolutionData.map(d => d.value));

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F9FAFB]">
              Patrimônios
            </h1>
            <p className="text-sm sm:text-base text-[#9CA3AF] mt-1">Controle completo do seu patrimônio</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <i className="ri-add-line text-xl"></i>
            Adicionar Patrimônio
          </button>
        </div>

        {/* Cards Executivos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {/* Total */}
          <div className="bg-gradient-to-br from-[#7C3AED]/10 to-[#EC4899]/5 border border-[#7C3AED]/20 rounded-xl p-4 sm:p-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center mb-3 sm:mb-4">
              <i className="ri-money-dollar-circle-line text-[#7C3AED] text-xl sm:text-2xl"></i>
            </div>
            <h3 className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">Valor Total</h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#7C3AED]">
              {formatCurrency(totalPatrimonio)}
            </p>
          </div>

          {/* Imóveis */}
          <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-4 sm:p-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center mb-3 sm:mb-4">
              <i className="ri-home-4-line text-[#7C3AED] text-xl sm:text-2xl"></i>
            </div>
            <h3 className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">Bens Imóveis</h3>
            <p className="text-xl sm:text-2xl font-bold text-[#F9FAFB]">
              {formatCurrency(totalImoveis)}
            </p>
          </div>

          {/* Veículos */}
          <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-4 sm:p-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#EC4899]/20 flex items-center justify-center mb-3 sm:mb-4">
              <i className="ri-car-line text-[#EC4899] text-xl sm:text-2xl"></i>
            </div>
            <h3 className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">Veículos</h3>
            <p className="text-xl sm:text-2xl font-bold text-[#F9FAFB]">
              {formatCurrency(totalVeiculos)}
            </p>
          </div>

          {/* Investimentos */}
          <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-4 sm:p-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#10B981]/20 flex items-center justify-center mb-3 sm:mb-4">
              <i className="ri-line-chart-line text-[#10B981] text-xl sm:text-2xl"></i>
            </div>
            <h3 className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">Investimentos</h3>
            <p className="text-xl sm:text-2xl font-bold text-[#F9FAFB]">
              {formatCurrency(totalInvestimentos)}
            </p>
          </div>

          {/* Caixa */}
          <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-4 sm:p-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center mb-3 sm:mb-4">
              <i className="ri-wallet-3-line text-[#F59E0B] text-xl sm:text-2xl"></i>
            </div>
            <h3 className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">Caixa / Saldo</h3>
            <p className="text-xl sm:text-2xl font-bold text-[#F9FAFB]">
              {formatCurrency(totalCaixa)}
            </p>
          </div>
        </div>

        {/* Gráfico de Evolução */}
        <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-4 sm:p-6 mb-6 lg:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-[#F9FAFB] mb-4 sm:mb-6">Evolução do Patrimônio</h2>
          <div className="h-64 sm:h-80 flex items-end justify-between gap-2 sm:gap-4">
            {evolutionData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 sm:gap-3">
                <div className="text-xs sm:text-sm font-medium text-[#10B981]">
                  {formatCurrency(item.value)}
                </div>
                <div
                  className="w-full bg-gradient-to-t from-[#7C3AED] to-[#EC4899] rounded-t-lg transition-all duration-500 hover:opacity-80"
                  style={{ height: `${(item.value / maxValue) * 100}%` }}
                ></div>
                <div className="text-xs sm:text-sm text-[#9CA3AF] font-medium">{item.month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Patrimônios */}
        <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-[#F9FAFB] mb-4 sm:mb-6">Meus Patrimônios</h2>
          <div className="grid grid-cols-1 gap-4">
            {patrimonios.map((patrimonio) => (
              <div
                key={patrimonio.id}
                className="bg-[#111827] border border-[#374151] rounded-lg p-4 hover:border-[#7C3AED]/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1">
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${getColorByType(patrimonio.tipo)}20` }}
                    >
                      <i className={`${getIconByType(patrimonio.tipo)} text-xl sm:text-2xl`} style={{ color: getColorByType(patrimonio.tipo) }}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-[#F9FAFB] mb-1">{patrimonio.nome}</h3>
                      <p className="text-xs sm:text-sm text-[#9CA3AF] mb-2">{patrimonio.tipo}</p>
                      <p className="text-xl sm:text-2xl font-bold" style={{ color: getColorByType(patrimonio.tipo) }}>
                        {formatCurrency(patrimonio.valor)}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-2">
                        Atualizado em: {new Date(patrimonio.dataReferencia).toLocaleDateString('pt-BR')}
                      </p>
                      {patrimonio.observacoes && (
                        <p className="text-xs sm:text-sm text-[#9CA3AF] mt-2">{patrimonio.observacoes}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(patrimonio.id)}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#EF4444]/10 hover:bg-[#EF4444]/20 flex items-center justify-center transition-all duration-300 flex-shrink-0"
                  >
                    <i className="ri-delete-bin-line text-[#EF4444] text-base sm:text-lg"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Adicionar Patrimônio */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1F2937] border border-[#374151] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB]">Adicionar Patrimônio</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 rounded-lg bg-[#374151] hover:bg-[#4B5563] flex items-center justify-center transition-all duration-300"
                  >
                    <i className="ri-close-line text-[#F9FAFB] text-xl"></i>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Nome do Patrimônio</label>
                    <input
                      type="text"
                      required
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                      placeholder="Ex: Apartamento Centro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Tipo</label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                    >
                      <option value="Imóvel">🏠 Imóvel</option>
                      <option value="Veículo">🚗 Veículo</option>
                      <option value="Investimentos">📈 Investimentos</option>
                      <option value="Caixa">💵 Caixa / Saldo</option>
                      <option value="Negócio">🏢 Negócio Próprio</option>
                      <option value="Bens de Valor">💎 Bens de Valor</option>
                      <option value="Outros">📦 Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Valor Atual</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                      placeholder="0,00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Data de Referência</label>
                    <input
                      type="date"
                      required
                      value={formData.dataReferencia}
                      onChange={(e) => setFormData({ ...formData, dataReferencia: e.target.value })}
                      className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Observações (opcional)</label>
                    <textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      rows={3}
                      className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300 resize-none"
                      placeholder="Informações adicionais..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-[#374151] hover:bg-[#4B5563] text-[#F9FAFB] px-6 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all duration-300 whitespace-nowrap"
                    >
                      Adicionar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
