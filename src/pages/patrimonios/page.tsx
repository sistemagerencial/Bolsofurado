import { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { usePatrimonios } from '../../hooks/usePatrimonios';

export default function PatrimoniosPage() {
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const { patrimonios, loading, createPatrimonio, deletePatrimonio } = usePatrimonios();

  const [formData, setFormData] = useState({
    name: '',
    type: 'Imóvel',
    value: '',
    acquisition_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar valor enquanto digita
  const formatValueInput = (value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    
    if (!numbers) return '';
    
    // Converte para número e divide por 100 para ter os centavos
    const numberValue = parseFloat(numbers) / 100;
    
    // Formata no padrão brasileiro
    return numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Converter valor formatado para número
  const parseValueInput = (value: string): number => {
    if (!value) return 0;
    
    // Remove pontos de milhar e substitui vírgula por ponto
    const cleanValue = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatValueInput(e.target.value);
    setFormData({ ...formData, value: formatted });
  };

  const totalPatrimonio = patrimonios.reduce((sum, p) => sum + Number(p.value), 0);
  const totalImoveis = patrimonios.filter(p => p.type === 'Imóvel').reduce((sum, p) => sum + Number(p.value), 0);
  const totalVeiculos = patrimonios.filter(p => p.type === 'Veículo').reduce((sum, p) => sum + Number(p.value), 0);
  const totalInvestimentos = patrimonios.filter(p => p.type === 'Investimentos').reduce((sum, p) => sum + Number(p.value), 0);
  const totalCaixa = patrimonios.filter(p => p.type === 'Caixa').reduce((sum, p) => sum + Number(p.value), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const numericValue = parseValueInput(formData.value);
      
      await createPatrimonio({
        name: formData.name,
        type: formData.type,
        value: numericValue,
        acquisition_date: formData.acquisition_date,
        notes: formData.notes || undefined
      });
      
      setShowModal(false);
      setFormData({
        name: '',
        type: 'Imóvel',
        value: '',
        acquisition_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
      setNotification('Patrimônio adicionado com sucesso!');
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Erro ao adicionar patrimônio:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePatrimonio(id);
      setNotification('Patrimônio removido com sucesso!');
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Erro ao deletar patrimônio:', error);
    }
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

  // Dados para o gráfico de evolução (mock temporário)
  const evolutionData = [
    { month: 'Jan', value: totalPatrimonio * 0.92 },
    { month: 'Fev', value: totalPatrimonio * 0.94 },
    { month: 'Mar', value: totalPatrimonio * 0.96 },
    { month: 'Abr', value: totalPatrimonio * 0.98 },
    { month: 'Mai', value: totalPatrimonio * 0.99 },
    { month: 'Jun', value: totalPatrimonio },
  ];

  const maxValue = Math.max(...evolutionData.map(d => d.value));
  const minValue = Math.min(...evolutionData.map(d => d.value));

  // Gera pontos SVG para o gráfico de linha
  const chartWidth = 800;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 20;

  const getX = (index: number) =>
    paddingX + (index / (evolutionData.length - 1)) * (chartWidth - paddingX * 2);

  const getY = (value: number) => {
    const range = maxValue - minValue || 1;
    return chartHeight - paddingY - ((value - minValue) / range) * (chartHeight - paddingY * 2);
  };

  const linePath = evolutionData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`)
    .join(' ');

  const areaPath = `${linePath} L ${getX(evolutionData.length - 1)} ${chartHeight - paddingY} L ${getX(0)} ${chartHeight - paddingY} Z`;

  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#9CA3AF]">Carregando patrimônios...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        {/* Notificação */}
        {notification && (
          <div className="fixed top-4 right-4 lg:top-20 bg-[#22C55E] text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
            <i className="ri-check-line text-xl"></i>
            <span>{notification}</span>
          </div>
        )}

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
            className="w-full sm:w-auto bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
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

        {/* Lista de Patrimônios */}
        <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-[#F9FAFB] mb-4 sm:mb-6">Meus Patrimônios</h2>
          
          {patrimonios.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7C3AED]/20 to-[#EC4899]/20 flex items-center justify-center mx-auto mb-4">
                <i className="ri-safe-line text-4xl text-[#7C3AED]"></i>
              </div>
              <h3 className="text-xl font-bold text-[#F9FAFB] mb-2">Nenhum patrimônio cadastrado</h3>
              <p className="text-[#9CA3AF] mb-6">Comece adicionando seus bens e investimentos</p>
            </div>
          ) : (
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
                        style={{ backgroundColor: `${getColorByType(patrimonio.type)}20` }}
                      >
                        <i className={`${getIconByType(patrimonio.type)} text-xl sm:text-2xl`} style={{ color: getColorByType(patrimonio.type) }}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-[#F9FAFB] mb-1">{patrimonio.name}</h3>
                        <p className="text-xs sm:text-sm text-[#9CA3AF] mb-2">{patrimonio.type}</p>
                        <p className="text-xl sm:text-2xl font-bold" style={{ color: getColorByType(patrimonio.type) }}>
                          {formatCurrency(Number(patrimonio.value))}
                        </p>
                        <p className="text-xs text-[#6B7280] mt-2">
                          Atualizado em: {new Date(patrimonio.acquisition_date).toLocaleDateString('pt-BR')}
                        </p>
                        {patrimonio.notes && (
                          <p className="text-xs sm:text-sm text-[#9CA3AF] mt-2">{patrimonio.notes}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(patrimonio.id)}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#EF4444]/10 hover:bg-[#EF4444]/20 flex items-center justify-center transition-all duration-300 flex-shrink-0 cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-[#EF4444] text-base sm:text-lg"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gráfico de Evolução — Linha Moderna */}
        {patrimonios.length > 0 && (
          <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-4 sm:p-6 mt-6 lg:mt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7C3AED]/20 to-[#EC4899]/20 flex items-center justify-center">
                  <i className="ri-line-chart-line text-[#7C3AED] text-xl"></i>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#F9FAFB]">Evolução do Patrimônio</h2>
                  <p className="text-xs text-[#9CA3AF]">Projeção dos últimos 6 meses</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#9CA3AF]">Total atual</p>
                <p className="text-lg font-bold text-[#7C3AED]">{formatCurrency(totalPatrimonio)}</p>
              </div>
            </div>

            <div className="relative w-full overflow-hidden" style={{ height: '260px' }}>
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <defs>
                  <linearGradient id="patrimonioLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                  <linearGradient id="patrimonioAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Grid lines */}
                {[0, 1, 2, 3].map((i) => {
                  const y = paddingY + (i / 3) * (chartHeight - paddingY * 2);
                  return (
                    <line
                      key={i}
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#374151"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Área preenchida */}
                <path d={areaPath} fill="url(#patrimonioAreaGrad)" />

                {/* Linha principal */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="url(#patrimonioLineGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />

                {/* Pontos interativos */}
                {evolutionData.map((d, i) => (
                  <g key={i}>
                    {/* Área de hover invisível */}
                    <circle
                      cx={getX(i)}
                      cy={getY(d.value)}
                      r="18"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {/* Ponto externo */}
                    <circle
                      cx={getX(i)}
                      cy={getY(d.value)}
                      r={hoveredPoint === i ? 8 : 5}
                      fill={hoveredPoint === i ? '#EC4899' : '#7C3AED'}
                      stroke="#1F2937"
                      strokeWidth="2.5"
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {/* Tooltip */}
                    {hoveredPoint === i && (
                      <g>
                        <rect
                          x={getX(i) - 70}
                          y={getY(d.value) - 52}
                          width="140"
                          height="40"
                          rx="6"
                          fill="#111827"
                          stroke="#7C3AED"
                          strokeWidth="1"
                        />
                        <text
                          x={getX(i)}
                          y={getY(d.value) - 34}
                          textAnchor="middle"
                          fill="#9CA3AF"
                          fontSize="10"
                        >
                          {d.month}
                        </text>
                        <text
                          x={getX(i)}
                          y={getY(d.value) - 18}
                          textAnchor="middle"
                          fill="#EC4899"
                          fontSize="11"
                          fontWeight="bold"
                        >
                          {formatCurrency(d.value)}
                        </text>
                      </g>
                    )}
                  </g>
                ))}
              </svg>
            </div>

            {/* Labels dos meses */}
            <div className="flex justify-between mt-2 px-2">
              {evolutionData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-[#9CA3AF] font-medium">{d.month}</span>
                  <span className="text-xs text-[#10B981] font-semibold hidden sm:block">
                    {formatCurrency(d.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Adicionar Patrimônio */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1F2937] border border-[#374151] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB]">Adicionar Patrimônio</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 rounded-lg bg-[#374151] hover:bg-[#4B5563] flex items-center justify-center transition-all duration-300 cursor-pointer"
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
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                      placeholder="Ex: Apartamento Centro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Tipo</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300 cursor-pointer"
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
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">R$</span>
                      <input
                        type="text"
                        required
                        value={formData.value}
                        onChange={handleValueChange}
                        className="w-full bg-[#111827] border border-[#374151] rounded-lg pl-12 pr-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                        placeholder="0,00"
                      />
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1">Digite o valor (ex: 500000 = R$ 500.000,00)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Data de Referência</label>
                    <input
                      type="date"
                      required
                      value={formData.acquisition_date}
                      onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
                      className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Observações (opcional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300 resize-none"
                      placeholder="Informações adicionais..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-[#374151] hover:bg-[#4B5563] text-[#F9FAFB] px-6 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all duration-300 whitespace-nowrap cursor-pointer"
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