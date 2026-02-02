
import { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';

export default function RelatoriosPage() {
  const [selectedReport, setSelectedReport] = useState('planejado-realizado');
  const [selectedPeriod, setSelectedPeriod] = useState('mensal');

  const reports = [
    { id: 'planejado-realizado', name: 'Planejado × Realizado', icon: 'ri-line-chart-line' },
    { id: 'por-categoria', name: 'Despesas por Categoria', icon: 'ri-pie-chart-line' },
    { id: 'por-centro', name: 'Despesas por Centro de Custo', icon: 'ri-bar-chart-box-line' },
    { id: 'evolucao', name: 'Evolução Mensal', icon: 'ri-stock-line' },
    { id: 'ranking', name: 'Ranking de Despesas', icon: 'ri-trophy-line' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Dados para os relatórios
  const planejadoRealizadoData = [
    { mes: 'Jan', planejado: 150000, realizado: 142000 },
    { mes: 'Fev', planejado: 150000, realizado: 138000 },
    { mes: 'Mar', planejado: 150000, realizado: 145000 },
    { mes: 'Abr', planejado: 150000, realizado: 148000 },
    { mes: 'Mai', planejado: 150000, realizado: 135000 },
    { mes: 'Jun', planejado: 150000, realizado: 98750 },
  ];

  const categoriaData = [
    { categoria: 'Pessoal', valor: 45000, cor: '#7C3AED', percentual: 45.6 },
    { categoria: 'Marketing', valor: 18500, cor: '#EC4899', percentual: 18.7 },
    { categoria: 'Infraestrutura', valor: 15200, cor: '#22C55E', percentual: 15.4 },
    { categoria: 'Tecnologia', valor: 12300, cor: '#F59E0B', percentual: 12.5 },
    { categoria: 'Operacional', valor: 7750, cor: '#3B82F6', percentual: 7.8 },
  ];

  const centroCustoData = [
    { centro: 'Administrativo', valor: 35000, percentual: 35.4 },
    { centro: 'Marketing', valor: 22000, percentual: 22.3 },
    { centro: 'TI', valor: 18500, percentual: 18.7 },
    { centro: 'RH', valor: 15250, percentual: 15.4 },
    { centro: 'Operacional', valor: 8000, percentual: 8.1 },
  ];

  const evolucaoData = [
    { mes: 'Jan', valor: 142000 },
    { mes: 'Fev', valor: 138000 },
    { mes: 'Mar', valor: 145000 },
    { mes: 'Abr', valor: 148000 },
    { mes: 'Mai', valor: 135000 },
    { mes: 'Jun', valor: 98750 },
  ];

  const rankingData = [
    { item: 'Salários e Encargos', valor: 45000, categoria: 'Pessoal' },
    { item: 'Campanhas Digitais', valor: 18500, categoria: 'Marketing' },
    { item: 'Aluguel e Condomínio', valor: 15200, categoria: 'Infraestrutura' },
    { item: 'Licenças de Software', valor: 12300, categoria: 'Tecnologia' },
    { item: 'Manutenção', valor: 7750, categoria: 'Operacional' },
  ];

  const renderPlanejadoRealizado = () => {
    const maxValue = Math.max(...planejadoRealizadoData.map(d => Math.max(d.planejado, d.realizado)));
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-6 gap-4">
          {planejadoRealizadoData.map((item) => (
            <div key={item.mes} className="space-y-2">
              <div className="text-xs sm:text-sm text-[#9CA3AF] text-center font-medium">{item.mes}</div>
              <div className="flex items-end justify-center gap-2 h-48">
                {/* Planejado */}
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div 
                    className="w-full bg-gradient-to-t from-[#7C3AED] to-[#7C3AED]/60 rounded-t-lg transition-all hover:shadow-lg hover:shadow-[#7C3AED]/30"
                    style={{ height: `${(item.planejado / maxValue) * 100}%` }}
                  ></div>
                  <span className="text-[10px] text-[#7C3AED] font-medium">Plan</span>
                </div>
                {/* Realizado */}
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div 
                    className="w-full bg-gradient-to-t from-[#EC4899] to-[#EC4899]/60 rounded-t-lg transition-all hover:shadow-lg hover:shadow-[#EC4899]/30"
                    style={{ height: `${(item.realizado / maxValue) * 100}%` }}
                  ></div>
                  <span className="text-[10px] text-[#EC4899] font-medium">Real</span>
                </div>
              </div>
              <div className="text-center space-y-0.5">
                <div className="text-[10px] text-[#7C3AED]">{formatCurrency(item.planejado)}</div>
                <div className="text-[10px] text-[#EC4899]">{formatCurrency(item.realizado)}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#7C3AED]"></div>
            <span className="text-xs sm:text-sm text-[#9CA3AF]">Planejado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#EC4899]"></div>
            <span className="text-xs sm:text-sm text-[#9CA3AF]">Realizado</span>
          </div>
        </div>
      </div>
    );
  };

  const renderPorCategoria = () => {
    const total = categoriaData.reduce((sum, item) => sum + item.valor, 0);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Pizza Visual */}
          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64">
              {categoriaData.map((item, index) => {
                const previousPercentage = categoriaData.slice(0, index).reduce((sum, cat) => sum + cat.percentual, 0);
                const rotation = (previousPercentage / 100) * 360;
                const angle = (item.percentual / 100) * 360;
                
                return (
                  <div
                    key={item.categoria}
                    className="absolute inset-0 rounded-full transition-all hover:scale-105"
                    style={{
                      background: `conic-gradient(from ${rotation}deg, ${item.cor} 0deg, ${item.cor} ${angle}deg, transparent ${angle}deg)`,
                      clipPath: 'circle(50%)',
                    }}
                  ></div>
                );
              })}
              <div className="absolute inset-8 bg-[#0E0B16] rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#F9FAFB]">{formatCurrency(total)}</div>
                  <div className="text-xs text-[#9CA3AF]">Total</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Lista de Categorias */}
          <div className="space-y-3">
            {categoriaData.map((item) => (
              <div key={item.categoria} className="bg-[#0E0B16] rounded-lg p-4 border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: item.cor }}></div>
                    <span className="text-sm font-medium text-[#F9FAFB]">{item.categoria}</span>
                  </div>
                  <span className="text-sm font-bold text-[#F9FAFB]">{item.percentual}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 bg-white/5 rounded-full h-2 mr-3">
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{ 
                        width: `${item.percentual}%`,
                        backgroundColor: item.cor
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-[#9CA3AF]">{formatCurrency(item.valor)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPorCentro = () => {
    const maxValue = Math.max(...centroCustoData.map(d => d.valor));
    
    return (
      <div className="space-y-6">
        {centroCustoData.map((item) => (
          <div key={item.centro} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#F9FAFB]">{item.centro}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[#7C3AED]">{item.percentual}%</span>
                <span className="text-sm text-[#9CA3AF]">{formatCurrency(item.valor)}</span>
              </div>
            </div>
            <div className="relative bg-white/5 rounded-full h-8 overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] rounded-full transition-all duration-500 hover:shadow-lg hover:shadow-[#7C3AED]/30"
                style={{ width: `${item.percentual}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEvolucao = () => {
    const maxValue = Math.max(...evolucaoData.map(d => d.valor));
    const minValue = Math.min(...evolucaoData.map(d => d.valor));
    
    return (
      <div className="space-y-6">
        <div className="relative h-64 flex items-end justify-between gap-2 px-4">
          {/* Linhas de grade */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-white/5"></div>
            ))}
          </div>
          
          {/* Barras */}
          {evolucaoData.map((item, index) => {
            const prevValue = index > 0 ? evolucaoData[index - 1].valor : item.valor;
            const isUp = item.valor >= prevValue;
            
            return (
              <div key={item.mes} className="flex-1 flex flex-col items-center gap-2 relative z-10">
                <div 
                  className={`w-full rounded-t-lg transition-all hover:shadow-lg ${
                    isUp 
                      ? 'bg-gradient-to-t from-[#22C55E] to-[#22C55E]/60 hover:shadow-[#22C55E]/30' 
                      : 'bg-gradient-to-t from-[#EF4444] to-[#EF4444]/60 hover:shadow-[#EF4444]/30'
                  }`}
                  style={{ height: `${((item.valor - minValue) / (maxValue - minValue)) * 100}%` }}
                >
                  <div className="flex items-center justify-center h-full">
                    <i className={`${isUp ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} text-white text-xs`}></i>
                  </div>
                </div>
                <span className="text-xs text-[#9CA3AF] font-medium">{item.mes}</span>
                <span className="text-[10px] text-[#F9FAFB]">{formatCurrency(item.valor)}</span>
              </div>
            );
          })}
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
          <div className="text-center">
            <div className="text-xs text-[#9CA3AF] mb-1">Média</div>
            <div className="text-lg font-bold text-[#F9FAFB]">
              {formatCurrency(evolucaoData.reduce((sum, item) => sum + item.valor, 0) / evolucaoData.length)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-[#9CA3AF] mb-1">Maior</div>
            <div className="text-lg font-bold text-[#22C55E]">{formatCurrency(maxValue)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-[#9CA3AF] mb-1">Menor</div>
            <div className="text-lg font-bold text-[#EF4444]">{formatCurrency(minValue)}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderRanking = () => {
    return (
      <div className="space-y-3">
        {rankingData.map((item, index) => (
          <div 
            key={item.item}
            className="bg-[#0E0B16] rounded-lg p-4 border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                index === 0 ? 'bg-gradient-to-br from-[#F59E0B] to-[#F59E0B]/60 text-white' :
                index === 1 ? 'bg-gradient-to-br from-[#9CA3AF] to-[#9CA3AF]/60 text-white' :
                index === 2 ? 'bg-gradient-to-br from-[#CD7F32] to-[#CD7F32]/60 text-white' :
                'bg-white/5 text-[#9CA3AF]'
              }`}>
                {index + 1}
              </div>
              
              <div className="flex-1">
                <div className="text-sm font-medium text-[#F9FAFB] mb-1">{item.item}</div>
                <div className="text-xs text-[#9CA3AF]">{item.categoria}</div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-[#F9FAFB]">{formatCurrency(item.valor)}</div>
                <div className="text-xs text-[#9CA3AF]">
                  {((item.valor / rankingData.reduce((sum, i) => sum + i.valor, 0)) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'planejado-realizado':
        return renderPlanejadoRealizado();
      case 'por-categoria':
        return renderPorCategoria();
      case 'por-centro':
        return renderPorCentro();
      case 'evolucao':
        return renderEvolucao();
      case 'ranking':
        return renderRanking();
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F9FAFB] mb-2">Relatórios Executivos</h1>
          <p className="text-sm sm:text-base text-[#9CA3AF]">Análises detalhadas para tomada de decisão</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Sidebar de Relatórios */}
          <div className="lg:col-span-3">
            <div className="bg-[#16122A] rounded-xl lg:rounded-2xl p-4 border border-white/5">
              <h3 className="text-xs sm:text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3 lg:mb-4 px-2">
                Tipos de Relatório
              </h3>
              <div className="space-y-1">
                {reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg lg:rounded-xl transition-all cursor-pointer ${
                      selectedReport === report.id
                        ? 'bg-gradient-to-r from-[#7C3AED]/20 to-[#EC4899]/20 text-[#F9FAFB]'
                        : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'
                    }`}
                  >
                    <i className={`${report.icon} text-base sm:text-lg`}></i>
                    <span className="text-xs sm:text-sm font-medium">{report.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Área Principal */}
          <div className="lg:col-span-9">
            {/* Filtros */}
            <div className="bg-[#16122A] rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-white/5 mb-4 lg:mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-bold text-[#F9FAFB]">Filtros</h3>
                <button className="px-3 sm:px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs sm:text-sm text-[#F9FAFB] font-medium transition-all cursor-pointer whitespace-nowrap">
                  Limpar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#9CA3AF] mb-2">Período</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full bg-[#0E0B16] border border-white/10 rounded-lg lg:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all cursor-pointer"
                  >
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#9CA3AF] mb-2">Categoria</label>
                  <select className="w-full bg-[#0E0B16] border border-white/10 rounded-lg lg:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all cursor-pointer">
                    <option>Todas</option>
                    <option>Pessoal</option>
                    <option>Marketing</option>
                    <option>Infraestrutura</option>
                    <option>Tecnologia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#9CA3AF] mb-2">Centro de Custo</label>
                  <select className="w-full bg-[#0E0B16] border border-white/10 rounded-lg lg:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all cursor-pointer">
                    <option>Todos</option>
                    <option>Administrativo</option>
                    <option>Marketing</option>
                    <option>TI</option>
                    <option>RH</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Conteúdo do Relatório */}
            <div className="bg-[#16122A] rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB] mb-1">
                    {reports.find(r => r.id === selectedReport)?.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#9CA3AF]">Período: Junho 2024</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg lg:rounded-xl bg-white/5 hover:bg-white/10 text-xs sm:text-sm text-[#F9FAFB] font-medium transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2">
                    <i className="ri-file-pdf-line text-base sm:text-lg"></i>
                    <span className="hidden sm:inline">Exportar</span> PDF
                  </button>
                  <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg lg:rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-lg hover:shadow-[#7C3AED]/50 text-white text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2">
                    <i className="ri-file-excel-line text-base sm:text-lg"></i>
                    <span className="hidden sm:inline">Exportar</span> Excel
                  </button>
                </div>
              </div>

              {/* Área de Visualização */}
              <div className="bg-[#0E0B16] rounded-lg lg:rounded-xl p-4 sm:p-6 lg:p-8 border border-white/5">
                {renderReportContent()}
              </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mt-4 lg:mt-6">
              <div className="bg-[#16122A] rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-white/5">
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#7C3AED]/20 to-[#EC4899]/20 flex items-center justify-center">
                    <i className="ri-arrow-up-line text-lg sm:text-xl text-[#7C3AED]"></i>
                  </div>
                  <span className="text-xs sm:text-sm text-[#9CA3AF]">Maior Despesa</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-[#F9FAFB]">{formatCurrency(45000)}</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Categoria: Pessoal</p>
              </div>

              <div className="bg-[#16122A] rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-white/5">
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#EC4899]/20 to-[#7C3AED]/20 flex items-center justify-center">
                    <i className="ri-percent-line text-lg sm:text-xl text-[#EC4899]"></i>
                  </div>
                  <span className="text-xs sm:text-sm text-[#9CA3AF]">Economia</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-[#22C55E]">{formatCurrency(51250)}</p>
                <p className="text-xs text-[#9CA3AF] mt-1">34.2% do planejado</p>
              </div>

              <div className="bg-[#16122A] rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-white/5 sm:col-span-3 lg:col-span-1">
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#22C55E]/20 to-[#22C55E]/10 flex items-center justify-center">
                    <i className="ri-trophy-line text-lg sm:text-xl text-[#22C55E]"></i>
                  </div>
                  <span className="text-xs sm:text-sm text-[#9CA3AF]">Melhor Desempenho</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-[#F9FAFB]">Operacional</p>
                <p className="text-xs text-[#9CA3AF] mt-1">65% do orçamento</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
