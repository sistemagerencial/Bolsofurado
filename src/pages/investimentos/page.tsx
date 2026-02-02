import { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { portfolioAssets, tradeHistory, monthlyEvolution } from '../../mocks/investmentData';

export default function InvestimentosPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'trade' | 'reports'>('overview');
  const [showNewInvestmentModal, setShowNewInvestmentModal] = useState(false);
  const [showNewTradeModal, setShowNewTradeModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 0, 1)); // Janeiro 2025
  const [tradeMode, setTradeMode] = useState<'detailed' | 'simple'>('simple');
  const [tradeResultType, setTradeResultType] = useState<'gain' | 'loss'>('gain');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Cálculos
  const totalInvested = portfolioAssets.reduce((sum, asset) => sum + asset.invested, 0);
  const totalCurrent = portfolioAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalProfit = totalCurrent - totalInvested;
  const totalProfitability = ((totalProfit / totalInvested) * 100).toFixed(2);

  const tradeResultDay = tradeHistory
    .filter(t => t.date === '2025-01-15')
    .reduce((sum, t) => sum + t.result, 0);

  const tradeResultMonth = tradeHistory.reduce((sum, t) => sum + t.result, 0);

  const groupedAssets = portfolioAssets.reduce((acc: any, asset) => {
    if (!acc[asset.type]) acc[asset.type] = [];
    acc[asset.type].push(asset);
    return acc;
  }, {});

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Funções do Calendário
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getTradeResultForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTrades = tradeHistory.filter(t => t.date === dateStr);
    if (dayTrades.length === 0) return null;
    return dayTrades.reduce((sum, t) => sum + t.result, 0);
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Dias vazios antes do primeiro dia do mês
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 sm:h-20 lg:h-24" />);
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const result = getTradeResultForDay(day);
      const hasResult = result !== null;
      const isPositive = result !== null && result >= 0;

      days.push(
        <div
          key={day}
          className={`h-16 sm:h-20 lg:h-24 rounded-lg border transition-all ${
            hasResult
              ? isPositive
                ? 'bg-[#22C55E]/10 border-[#22C55E]/30 hover:border-[#22C55E]/50'
                : 'bg-[#EF4444]/10 border-[#EF4444]/30 hover:border-[#EF4444]/50'
              : 'bg-[#0E0B16] border-white/5 hover:border-white/10'
          } p-1.5 sm:p-2 flex flex-col cursor-pointer`}
        >
          <span className={`text-xs sm:text-sm font-medium ${hasResult ? (isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]') : 'text-[#9CA3AF]'}`}>
            {day}
          </span>
          {hasResult && (
            <div className="flex-1 flex items-center justify-center">
              <span className={`text-xs sm:text-sm lg:text-base font-bold ${isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {isPositive ? '+' : ''}{formatCurrency(result).replace('R$', '').trim()}
              </span>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const handleRegisterTrade = () => {
    // Mostrar mensagem de sucesso
    setShowSuccessMessage(true);
    
    // Fechar o modal
    setShowNewTradeModal(false);
    
    // Esconder mensagem após 3 segundos
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0E0B16] p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F9FAFB] mb-1 sm:mb-2">
            📈 Investimentos
          </h1>
          <p className="text-sm sm:text-base text-[#9CA3AF]">
            Controle completo da sua carteira e operações
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 lg:mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {(['overview', 'portfolio', 'trade', 'reports'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer text-sm sm:text-base ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-lg shadow-[#7C3AED]/30'
                  : 'bg-[#16122A] text-[#9CA3AF] hover:bg-[#16122A]/80'
              }`}
            >
              {tab === 'overview' && '📊 Visão Geral'}
              {tab === 'portfolio' && '💼 Carteira'}
              {tab === 'trade' && '⚡ Trade'}
              {tab === 'reports' && '📈 Relatórios'}
            </button>
          ))}
        </div>

        {/* Visão Geral */}
        {activeTab === 'overview' && (
          <div className="space-y-6 lg:space-y-8">
            {/* Cards Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-[#9CA3AF] text-xs sm:text-sm">
                    💰 Saldo Total Investido
                  </span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#F9FAFB] mb-1">
                  {formatCurrency(totalInvested)}
                </p>
                <p className="text-xs text-[#9CA3AF]">Capital aplicado</p>
              </div>

              <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-[#9CA3AF] text-xs sm:text-sm">
                    📈 Rentabilidade Total
                  </span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#22C55E] mb-1">
                  {totalProfitability}%
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  Retorno sobre investimento
                </p>
              </div>

              <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-[#9CA3AF] text-xs sm:text-sm">
                    💵 Lucro / Prejuízo
                  </span>
                </div>
                <p
                  className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-1 ${
                    totalProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                  }`}
                >
                  {formatCurrency(totalProfit)}
                </p>
                <p className="text-xs text-[#9CA3AF]">Ganho líquido</p>
              </div>

              <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-[#9CA3AF] text-xs sm:text-sm">
                    ⚡ Resultado Trade
                  </span>
                </div>
                <p
                  className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-1 ${
                    tradeResultMonth >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                  }`}
                >
                  {formatCurrency(tradeResultMonth)}
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  Hoje: {formatCurrency(tradeResultDay)}
                </p>
              </div>
            </div>

            {/* Gráfico de Evolução */}
            <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 lg:p-8 border border-white/5 shadow-lg">
              <h3 className="text-lg sm:text-xl font-bold text-[#F9FAFB] mb-4 sm:mb-6">
                📊 Evolução do Patrimônio
              </h3>
              <div className="h-48 sm:h-64 lg:h-80 flex items-end justify-between gap-1 sm:gap-2">
                {monthlyEvolution.map((month, index) => {
                  const maxValue = Math.max(
                    ...monthlyEvolution.map(m => m.total)
                  );
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col gap-0.5 sm:gap-1"
                    >
                      <div
                        className="w-full bg-gradient-to-t from-[#7C3AED] to-[#7C3AED]/50 rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                        style={{
                          height: `${(month.investments / maxValue) * 100}%`,
                        }}
                        title={`Investimentos: ${formatCurrency(
                          month.investments
                        )}`}
                      />
                      <div
                        className="w-full bg-gradient-to-t from-[#EC4899] to-[#EC4899]/50 rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                        style={{
                          height: `${(month.trade / maxValue) * 100 * 5}%`,
                        }}
                        title={`Trade: ${formatCurrency(month.trade)}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#7C3AED] rounded" />
                  <span className="text-xs sm:text-sm text-[#9CA3AF]">
                    Investimentos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#EC4899] rounded" />
                  <span className="text-xs sm:text-sm text-[#9CA3AF]">
                    Trade
                  </span>
                </div>
              </div>
            </div>

            {/* Resumo por Tipo */}
            <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 lg:p-8 border border-white/5 shadow-lg">
              <h3 className="text-lg sm:text-xl font-bold text-[#F9FAFB] mb-4 sm:mb-6">
                📊 Distribuição por Tipo
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {Object.keys(groupedAssets).map((type, index) => {
                  const assets = groupedAssets[type];
                  const typeTotal = assets.reduce(
                    (sum: number, a: any) => sum + a.currentValue,
                    0
                  );
                  const typeInvested = assets.reduce(
                    (sum: number, a: any) => sum + a.invested,
                    0
                  );
                  const typeProfit = ((typeTotal - typeInvested) / typeInvested * 100).toFixed(2);
                  return (
                    <div
                      key={index}
                      className="bg-[#0E0B16] rounded-xl p-3 sm:p-4 border border-white/5"
                    >
                      <p className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2 truncate">
                        {type}
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#F9FAFB] mb-1">
                        {formatCurrency(typeTotal)}
                      </p>
                      <p
                        className={`text-xs sm:text-sm font-medium ${
                          parseFloat(typeProfit) >= 0
                            ? 'text-[#22C55E]'
                            : 'text-[#EF4444]'
                        }`}
                      >
                        {typeProfit}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Carteira */}
        {activeTab === 'portfolio' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB]">
                💼 Minha Carteira
              </h2>
              <button
                onClick={() => setShowNewInvestmentModal(true)}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-lg hover:shadow-[#7C3AED]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base"
              >
                ➕ Novo Investimento
              </button>
            </div>

            {Object.keys(groupedAssets).map((type, typeIndex) => (
              <div
                key={typeIndex}
                className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg"
              >
                <h3 className="text-base sm:text-lg font-bold text-[#F9FAFB] mb-4">
                  {type}
                </h3>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-3">
                  {groupedAssets[type].map((asset: any) => (
                    <div
                      key={asset.id}
                      className="bg-[#0E0B16] rounded-lg p-4 border border-white/5"
                      onClick={() => setSelectedCategory(asset)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-medium text-[#F9FAFB]">
                            {asset.name}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">{asset.code}</p>
                        </div>
                        <p
                          className={`text-sm font-bold ${
                            asset.status === 'positive'
                              ? 'text-[#22C55E]'
                              : 'text-[#EF4444]'
                          }`}
                        >
                          {asset.profitability > 0 ? '+' : ''}
                          {asset.profitability.toFixed(2)}%
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-[#9CA3AF]">Investido</p>
                          <p className="text-sm font-medium text-[#F9FAFB]">
                            {formatCurrency(asset.invested)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#9CA3AF]">Atual</p>
                          <p className="text-sm font-medium text-[#F9FAFB]">
                            {formatCurrency(asset.currentValue)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#9CA3AF]">
                          Ativo
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">
                          Quantidade
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">
                          Investido
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">
                          Valor Atual
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">
                          Rentabilidade
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">
                          Lucro/Prejuízo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedAssets[type].map((asset: any) => (
                        <tr
                          key={asset.id}
                          className="border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer"
                          onClick={() => setSelectedCategory(asset)}
                        >
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-[#F9FAFB] font-medium">
                                {asset.name}
                              </p>
                              <p className="text-xs text-[#9CA3AF]">
                                {asset.code}
                              </p>
                            </div>
                          </td>
                          <td className="text-right py-4 px-4 text-[#F9FAFB]">
                            {asset.quantity}
                          </td>
                          <td className="text-right py-4 px-4 text-[#F9FAFB]">
                            {formatCurrency(asset.invested)}
                          </td>
                          <td className="text-right py-4 px-4 text-[#F9FAFB]">
                            {formatCurrency(asset.currentValue)}
                          </td>
                          <td
                            className={`text-right py-4 px-4 font-medium ${
                              asset.status === 'positive'
                                ? 'text-[#22C55E]'
                                : 'text-[#EF4444]'
                            }`}
                          >
                            {asset.profitability > 0 ? '+' : ''}
                            {asset.profitability.toFixed(2)}%
                          </td>
                          <td
                            className={`text-right py-4 px-4 font-medium ${
                              asset.status === 'positive'
                                ? 'text-[#22C55E]'
                                : 'text-[#EF4444]'
                            }`}
                          >
                            {formatCurrency(asset.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trade */}
        {activeTab === 'trade' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB]">
                ⚡ Operações de Trade
              </h2>
              <button
                onClick={() => setShowNewTradeModal(true)}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-lg hover:shadow-[#7C3AED]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base"
              >
                ➕ Novo Trade
              </button>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
                <p className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">
                  Resultado do Dia
                </p>
                <p
                  className={`text-lg sm:text-xl lg:text-2xl font-bold ${
                    tradeResultDay >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                  }`}
                >
                  {formatCurrency(tradeResultDay)}
                </p>
              </div>
              <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
                <p className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">
                  Resultado do Mês
                </p>
                <p
                  className={`text-lg sm:text-xl lg:text-2xl font-bold ${
                    tradeResultMonth >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                  }`}
                >
                  {formatCurrency(tradeResultMonth)}
                </p>
              </div>
              <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
                <p className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">
                  Total de Trades
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#F9FAFB]">
                  {tradeHistory.length}
                </p>
              </div>
              <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
                <p className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">
                  Taxa de Acerto
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#7C3AED]">
                  {(
                    (tradeHistory.filter(t => t.result > 0).length /
                      tradeHistory.length) *
                    100
                  ).toFixed(0)}
                  %
                </p>
              </div>
            </div>

            {/* Calendário de Trades */}
            <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold text-[#F9FAFB]">
                  📅 Calendário de Resultados
                </h3>
                <div className="flex items-center gap-2 sm:gap-4">
                  <button
                    onClick={prevMonth}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#0E0B16] hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <i className="ri-arrow-left-s-line text-lg sm:text-xl text-[#F9FAFB]" />
                  </button>
                  <span className="text-sm sm:text-base font-medium text-[#F9FAFB] min-w-[120px] sm:min-w-[150px] text-center">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </span>
                  <button
                    onClick={nextMonth}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#0E0B16] hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <i className="ri-arrow-right-s-line text-lg sm:text-xl text-[#F9FAFB]" />
                  </button>
                </div>
              </div>

              {/* Dias da Semana */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-xs sm:text-sm font-medium text-[#9CA3AF] py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid do Calendário */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {renderCalendar()}
              </div>

              {/* Legenda */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#22C55E] rounded" />
                  <span className="text-xs sm:text-sm text-[#9CA3AF]">Dia Positivo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#EF4444] rounded" />
                  <span className="text-xs sm:text-sm text-[#9CA3AF]">Dia Negativo</span>
                </div>
              </div>
            </div>

            {/* Histórico de Trades */}
            <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
              <h3 className="text-base sm:text-lg font-bold text-[#F9FAFB] mb-4">
                📊 Histórico de Operações
              </h3>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {tradeHistory.map(trade => (
                  <div
                    key={trade.id}
                    className="bg-[#0E0B16] rounded-lg p-4 border border-white/5"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-medium text-[#F9FAFB]">
                          {trade.asset}
                        </p>
                        <p className="text-xs text-[#9CA3AF]">
                          {new Date(trade.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <p
                        className={`text-base font-bold ${
                          trade.result >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                        }`}
                      >
                        {formatCurrency(trade.result)}
                      </p>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <span className="px-2 py-1 bg-[#7C3AED]/20 text-[#7C3AED] rounded text-xs font-medium">
                        {trade.type}
                      </span>
                      <span className="px-2 py-1 bg-white/5 text-[#9CA3AF] rounded text-xs">
                        {trade.market}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[#9CA3AF]">Entrada: </span>
                        <span className="text-[#F9FAFB]">
                          {formatCurrency(trade.entryPrice)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF]">Saída: </span>
                        <span className="text-[#F9FAFB]">
                          {formatCurrency(trade.exitPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#9CA3AF]">
                        Data
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#9CA3AF]">
                        Ativo
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#9CA3AF]">
                        Tipo
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#9CA3AF]">
                        Mercado
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">
                        Qtd
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">
                        Entrada
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">
                        Saída
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">
                        Resultado
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeHistory.map(trade => (
                      <tr
                        key={trade.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-all"
                      >
                        <td className="py-4 px-4 text-[#F9FAFB]">
                          {new Date(trade.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-4 px-4 text-[#F9FAFB] font-medium">
                          {trade.asset}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-[#7C3AED]/20 text-[#7C3AED] rounded-lg text-xs font-medium">
                            {trade.type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-[#9CA3AF] text-sm">
                          {trade.market}
                        </td>
                        <td className="text-right py-4 px-4 text-[#F9FAFB]">
                          {trade.quantity}
                        </td>
                        <td className="text-right py-4 px-4 text-[#F9FAFB]">
                          {formatCurrency(trade.entryPrice)}
                        </td>
                        <td className="text-right py-4 px-4 text-[#F9FAFB]">
                          {formatCurrency(trade.exitPrice)}
                        </td>
                        <td
                          className={`text-right py-4 px-4 font-bold ${
                            trade.result >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                          }`}
                        >
                          {formatCurrency(trade.result)}
                        </td>
                        <td
                          className={`text-right py-4 px-4 font-medium ${
                            trade.profitability >= 0
                              ? 'text-[#22C55E]'
                              : 'text-[#EF4444]'
                          }`}
                        >
                          {trade.profitability > 0 ? '+' : ''}
                          {trade.profitability.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Relatórios */}
        {activeTab === 'reports' && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB] mb-4 sm:mb-6">
              📈 Relatórios
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {[
                {
                  title: 'Rentabilidade por Ativo',
                  icon: '📊',
                  desc: 'Análise detalhada de cada investimento',
                },
                {
                  title: 'Rentabilidade por Tipo',
                  icon: '📈',
                  desc: 'Comparativo entre categorias',
                },
                {
                  title: 'Evolução do Patrimônio',
                  icon: '💰',
                  desc: 'Crescimento ao longo do tempo',
                },
                {
                  title: 'Comparativo Invest × Trade',
                  icon: '⚖️',
                  desc: 'Qual estratégia rende mais',
                },
                {
                  title: 'Histórico de Trades',
                  icon: '⚡',
                  desc: 'Todas as operações realizadas',
                },
                {
                  title: 'Análise de Performance',
                  icon: '🎯',
                  desc: 'Métricas e indicadores',
                },
              ].map((report, index) => (
                <div
                  key={index}
                  className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg hover:border-[#7C3AED]/30 transition-all cursor-pointer group"
                >
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">
                    {report.icon}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#F9FAFB] mb-1 sm:mb-2 group-hover:text-[#7C3AED] transition-all">
                    {report.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#9CA3AF] mb-3 sm:mb-4">
                    {report.desc}
                  </p>
                  <button className="w-full px-4 py-2 bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 text-[#7C3AED] rounded-xl font-medium transition-all whitespace-nowrap text-sm">
                    Gerar Relatório
                  </button>
                </div>
              ))}
            </div>

            {/* Filtros */}
            <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
              <h3 className="text-base sm:text-lg font-bold text-[#F9FAFB] mb-4">
                🔍 Filtros
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#9CA3AF] mb-2">
                    Período
                  </label>
                  <select className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all cursor-pointer text-sm">
                    <option>Último mês</option>
                    <option>Últimos 3 meses</option>
                    <option>Últimos 6 meses</option>
                    <option>Último ano</option>
                    <option>Personalizado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#9CA3AF] mb-2">
                    Tipo de Ativo
                  </label>
                  <select className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all cursor-pointer text-sm">
                    <option>Todos</option>
                    <option>Criptomoedas</option>
                    <option>Ações BR</option>
                    <option>Ações EUA</option>
                    <option>Renda Fixa</option>
                    <option>Fundos</option>
                  </select>
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-[#9CA3AF] mb-2">
                    Exportar
                  </label>
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-3 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm">
                      📄 PDF
                    </button>
                    <button className="flex-1 px-4 py-3 bg-[#22C55E]/20 hover:bg-[#22C55E]/30 text-[#22C55E] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm">
                      📊 Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mensagem de Sucesso */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in">
            <div className="bg-[#22C55E] text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
              <i className="ri-check-line text-2xl" />
              <div>
                <p className="font-bold">Trade Registrado!</p>
                <p className="text-sm opacity-90">Operação adicionada com sucesso</p>
              </div>
            </div>
          </div>
        )}

        {/* Botão Atualizar Preços - Flutuante */}
        <button
          className="fixed bottom-20 lg:bottom-24 right-4 lg:right-6 w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-2xl hover:shadow-[#7C3AED]/50 text-white rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg z-40 group"
          title="Atualizar Preços"
        >
          <i className="ri-refresh-line text-xl lg:text-2xl group-hover:rotate-180 transition-transform duration-500" />
        </button>

        {/* Modal Novo Investimento */}
        {showNewInvestmentModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewInvestmentModal(false)}
          >
            <div
              className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-[#16122A] border-b border-white/5 p-4 sm:p-6 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB] mb-1">
                      ➕ Novo Investimento
                    </h2>
                    <p className="text-xs sm:text-sm text-[#9CA3AF]">
                      Adicione um novo ativo à sua carteira
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewInvestmentModal(false)}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <i className="ri-close-line text-lg sm:text-xl text-[#F9FAFB]" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-3">
                      Tipo de Investimento
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                      {[
                        '🪙 Cripto',
                        '📈 Ação BR',
                        '🇺🇸 Ação EUA',
                        '🏦 LCI/LCA',
                        '💳 Renda Fixa',
                        '🏛️ Tesouro',
                        '📊 Fundos',
                        '🧾 Outros',
                      ].map((type, i) => (
                        <button
                          key={i}
                          className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[#0E0B16] hover:bg-[#7C3AED]/20 border border-white/5 hover:border-[#7C3AED]/50 rounded-xl text-[#F9FAFB] text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                      Ativo
                    </label>
                    <input
                      type="text"
                      placeholder="Buscar ativo..."
                      className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                        Valor Investido
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          className="w-full bg-[#0E0B16] border border-white/5 rounded-xl pl-12 pr-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                      Data
                    </label>
                    <input
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                      Observações
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Informações adicionais..."
                      className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all resize-none text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <button
                    onClick={() => setShowNewInvestmentModal(false)}
                    className="flex-1 px-4 sm:px-6 py-3 bg-white/5 hover:bg-white/10 text-[#F9FAFB] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-lg hover:shadow-[#7C3AED]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base">
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Novo Trade */}
        {showNewTradeModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewTradeModal(false)}
          >
            <div
              className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-[#16122A] border-b border-white/5 p-4 sm:p-6 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB] mb-1">
                      ⚡ Novo Trade
                    </h2>
                    <p className="text-xs sm:text-sm text-[#9CA3AF]">
                      Registre uma nova operação
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewTradeModal(false)}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <i className="ri-close-line text-lg sm:text-xl text-[#F9FAFB]" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {/* Toggle Modo de Lançamento */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-3">
                    Modo de Lançamento
                  </label>
                  <div className="flex gap-2 p-1 bg-[#0E0B16] rounded-xl">
                    <button
                      onClick={() => setTradeMode('simple')}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all cursor-pointer text-sm flex items-center justify-center gap-2 ${
                        tradeMode === 'simple'
                          ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white'
                          : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                      }`}
                    >
                      <i className="ri-arrow-up-line text-lg" />
                      Gain
                    </button>
                    <button
                      onClick={() => setTradeMode('loss')}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all cursor-pointer text-sm flex items-center justify-center gap-2 ${
                        tradeMode === 'loss'
                          ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white'
                          : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                      }`}
                    >
                      <i className="ri-arrow-down-line text-lg" />
                      Loss
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                        Data
                      </label>
                      <input
                        type="date"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                        Tipo
                      </label>
                      <select className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all cursor-pointer text-sm">
                        <option>Day Trade</option>
                        <option>Swing Trade</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                        Mercado
                      </label>
                      <select className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all cursor-pointer text-sm">
                        <option>Ações</option>
                        <option>Mini Índice</option>
                        <option>Mini Dólar</option>
                        <option>Bitcoin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                        Ativo
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: PETR4"
                        className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Modo Simplificado */}
                  {tradeMode === 'simple' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-3">
                          Resultado
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setTradeResultType('gain')}
                            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer text-sm flex items-center justify-center gap-2 ${
                              tradeResultType === 'gain'
                                ? 'bg-[#22C55E] text-white shadow-lg shadow-[#22C55E]/30'
                                : 'bg-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/30'
                            }`}
                          >
                            <i className="ri-arrow-up-line text-lg" />
                            Gain
                          </button>
                          <button
                            onClick={() => setTradeResultType('loss')}
                            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer text-sm flex items-center justify-center gap-2 ${
                              tradeResultType === 'loss'
                                ? 'bg-[#EF4444] text-white shadow-lg shadow-[#EF4444]/30'
                                : 'bg-[#EF4444]/20 text-[#EF4444] hover:bg-[#EF4444]/30'
                            }`}
                          >
                            <i className="ri-arrow-down-line text-lg" />
                            Loss
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                          Valor do {tradeResultType === 'gain' ? 'Ganho' : 'Prejuízo'}
                        </label>
                        <div className="relative">
                          <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-medium ${
                            tradeResultType === 'gain' ? 'text-[#22C55E]' : 'text-[#EF4444]'
                          }`}>
                            {tradeResultType === 'gain' ? '+' : '-'} R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className={`w-full bg-[#0E0B16] border rounded-xl pl-16 pr-4 py-3 placeholder-[#9CA3AF] focus:outline-none transition-all text-sm font-bold ${
                              tradeResultType === 'gain' 
                                ? 'border-[#22C55E]/30 text-[#22C55E] focus:border-[#22C55E]/50' 
                                : 'border-[#EF4444]/30 text-[#EF4444] focus:border-[#EF4444]/50'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                          Contratos (opcional)
                        </label>
                        <input
                          type="number"
                          placeholder="Quantidade de contratos"
                          className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                        />
                      </div>
                    </>
                  )}

                  {/* Modo Detalhado */}
                  {tradeMode === 'detailed' && (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                            Qtd
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-3 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                            Entrada
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-3 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                            Saída
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-3 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                          Custos (Corretagem)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className="w-full bg-[#0E0B16] border border-white/5 rounded-xl pl-12 pr-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                      Observações (opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Anotações sobre a operação..."
                      maxLength={500}
                      className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all resize-none text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <button
                    onClick={() => setShowNewTradeModal(false)}
                    className="flex-1 px-4 sm:px-6 py-3 bg-white/5 hover:bg-white/10 text-[#F9FAFB] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleRegisterTrade}
                    className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-lg hover:shadow-[#7C3AED]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base"
                  >
                    Registrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detalhes do Ativo */}
        {selectedCategory && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedCategory(null)}
          >
            <div
              className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="border-b border-white/5 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#F9FAFB] mb-1">
                      {selectedCategory.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#9CA3AF]">
                      {selectedCategory.code} • {selectedCategory.type}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <i className="ri-close-line text-lg sm:text-xl text-[#F9FAFB]" />
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <p className="text-xs sm:text-sm text-[#9CA3AF] mb-1">
                      Quantidade
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-[#F9FAFB]">
                      {selectedCategory.quantity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-[#9CA3AF] mb-1">
                      Valor Investido
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-[#F9FAFB]">
                      {formatCurrency(selectedCategory.invested)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-[#9CA3AF] mb-1">
                      Valor Atual
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-[#F9FAFB]">
                      {formatCurrency(selectedCategory.currentValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-[#9CA3AF] mb-1">
                      Rentabilidade
                    </p>
                    <p
                      className={`text-xl sm:text-2xl font-bold ${
                        selectedCategory.status === 'positive'
                          ? 'text-[#22C55E]'
                          : 'text-[#EF4444]'
                      }`}
                    >
                      {selectedCategory.profitability > 0 ? '+' : ''}
                      {selectedCategory.profitability.toFixed(2)}%
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs sm:text-sm text-[#9CA3AF] mb-1">
                      Lucro / Prejuízo
                    </p>
                    <p
                      className={`text-2xl sm:text-3xl font-bold ${
                        selectedCategory.status === 'positive'
                          ? 'text-[#22C55E]'
                          : 'text-[#EF4444]'
                      }`}
                    >
                      {formatCurrency(selectedCategory.profit)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="w-full mt-6 sm:mt-8 px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-lg hover:shadow-[#7C3AED]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
