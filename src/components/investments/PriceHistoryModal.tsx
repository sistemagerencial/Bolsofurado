import { useState, useEffect } from 'react';

interface PriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: {
    id: string;
    name: string;
    ticker?: string;
    type: string;
    entry_price: number;
    current_value: number;
    quantity?: number;
  };
}

interface PricePoint {
  date: string;
  price: number;
}

interface HistoryData {
  prices: PricePoint[];
  min: number;
  max: number;
  variation: number;
}

export default function PriceHistoryModal({ isOpen, onClose, investment }: PriceHistoryModalProps) {
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && investment) {
      fetchPriceHistory();
    }
  }, [isOpen, investment]);

  const fetchPriceHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      let prices: PricePoint[] = [];

      // Criptomoedas via CoinGecko
      if (investment.type === 'Criptomoeda') {
        const cryptoId = getCryptoId(investment.ticker || investment.name);
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=brl&days=30&interval=daily`
        );
        
        if (response.ok) {
          const data = await response.json();
          prices = data.prices.map((p: [number, number]) => ({
            date: new Date(p[0]).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            price: p[1]
          }));
        }
      }
      
      // Ações BR via Brapi
      else if (investment.type === 'Ação BR' || investment.type === 'FII' || investment.type === 'ETF') {
        const ticker = investment.ticker?.toUpperCase();
        if (ticker) {
          const response = await fetch(
            `https://brapi.dev/api/quote/${ticker}?range=1mo&interval=1d&fundamental=false`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results[0]?.historicalDataPrice) {
              prices = data.results[0].historicalDataPrice.map((p: any) => ({
                date: new Date(p.date * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                price: p.close
              }));
            }
          }
        }
      }
      
      // Ações EUA via Yahoo Finance
      else if (investment.type === 'Ação EUA') {
        const ticker = investment.ticker?.toUpperCase();
        if (ticker) {
          const period1 = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
          const period2 = Math.floor(Date.now() / 1000);
          
          const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d`;
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`;
          
          const response = await fetch(proxyUrl);
          
          if (response.ok) {
            const data = await response.json();
            if (data.chart?.result?.[0]) {
              const timestamps = data.chart.result[0].timestamp;
              const closePrices = data.chart.result[0].indicators.quote[0].close;
              
              // Buscar cotação USD/BRL
              const usdBrlResponse = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
              const usdBrlData = await usdBrlResponse.json();
              const usdToBrl = parseFloat(usdBrlData.USDBRL.bid);
              
              prices = timestamps.map((ts: number, i: number) => ({
                date: new Date(ts * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                price: closePrices[i] * usdToBrl
              })).filter((p: PricePoint) => p.price);
            }
          }
        }
      }

      // Fallback: apenas preço de entrada e atual
      if (prices.length === 0) {
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        prices = [
          {
            date: thirtyDaysAgo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            price: investment.entry_price
          },
          {
            date: today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            price: investment.current_value
          }
        ];
      }

      // Calcular estatísticas
      const priceValues = prices.map(p => p.price);
      const min = Math.min(...priceValues);
      const max = Math.max(...priceValues);
      const variation = ((investment.current_value - investment.entry_price) / investment.entry_price) * 100;

      setHistoryData({ prices, min, max, variation });
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
      setError('Não foi possível carregar o histórico de preços. Mostrando dados básicos.');
      
      // Fallback em caso de erro
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const fallbackPrices = [
        {
          date: thirtyDaysAgo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          price: investment.entry_price
        },
        {
          date: today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          price: investment.current_value
        }
      ];

      const variation = ((investment.current_value - investment.entry_price) / investment.entry_price) * 100;
      
      setHistoryData({
        prices: fallbackPrices,
        min: Math.min(investment.entry_price, investment.current_value),
        max: Math.max(investment.entry_price, investment.current_value),
        variation
      });
    } finally {
      setLoading(false);
    }
  };

  const getCryptoId = (name: string): string => {
    const cryptoMap: { [key: string]: string } = {
      'BTC': 'bitcoin',
      'BITCOIN': 'bitcoin',
      'ETH': 'ethereum',
      'ETHEREUM': 'ethereum',
      'BNB': 'binancecoin',
      'BINANCE COIN': 'binancecoin',
      'SOL': 'solana',
      'SOLANA': 'solana',
      'ADA': 'cardano',
      'CARDANO': 'cardano',
      'XRP': 'ripple',
      'RIPPLE': 'ripple',
      'DOT': 'polkadot',
      'POLKADOT': 'polkadot',
      'DOGE': 'dogecoin',
      'DOGECOIN': 'dogecoin',
      'AVAX': 'avalanche-2',
      'AVALANCHE': 'avalanche-2',
      'MATIC': 'matic-network',
      'POLYGON': 'matic-network',
      'LINK': 'chainlink',
      'CHAINLINK': 'chainlink',
      'UNI': 'uniswap',
      'UNISWAP': 'uniswap'
    };

    const key = name.toUpperCase();
    return cryptoMap[key] || 'bitcoin';
  };

  const renderChart = () => {
    if (!historyData || historyData.prices.length === 0) return null;

    const { prices, min, max } = historyData;
    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Escala Y (preço)
    const priceRange = max - min;
    const yScale = (price: number) => {
      return chartHeight - ((price - min) / priceRange) * chartHeight;
    };

    // Escala X (tempo)
    const xScale = (index: number) => {
      return (index / (prices.length - 1)) * chartWidth;
    };

    // Linha do gráfico
    const pathData = prices
      .map((point, i) => {
        const x = xScale(i) + padding.left;
        const y = yScale(point.price) + padding.top;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    // Linha do preço de entrada
    const entryY = yScale(investment.entry_price) + padding.top;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid horizontal */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight * ratio;
          const price = max - (max - min) * ratio;
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                {price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </text>
            </g>
          );
        })}

        {/* Linha do preço de entrada (tracejada) */}
        <line
          x1={padding.left}
          y1={entryY}
          x2={width - padding.right}
          y2={entryY}
          stroke="#f59e0b"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        <text
          x={width - padding.right - 10}
          y={entryY - 5}
          textAnchor="end"
          fontSize="12"
          fill="#f59e0b"
          fontWeight="600"
        >
          Preço de Entrada
        </text>

        {/* Linha do gráfico */}
        <path
          d={pathData}
          fill="none"
          stroke="#14b8a6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pontos no gráfico */}
        {prices.map((point, i) => {
          const x = xScale(i) + padding.left;
          const y = yScale(point.price) + padding.top;
          const isFirst = i === 0;
          const isLast = i === prices.length - 1;
          
          if (isFirst || isLast) {
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="5" fill="#14b8a6" stroke="white" strokeWidth="2" />
                <text
                  x={x}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {point.date}
                </text>
              </g>
            );
          }
          return null;
        })}

        {/* Ponto atual destacado */}
        {prices.length > 0 && (
          <g>
            <circle
              cx={xScale(prices.length - 1) + padding.left}
              cy={yScale(prices[prices.length - 1].price) + padding.top}
              r="7"
              fill="#14b8a6"
              stroke="white"
              strokeWidth="3"
            />
          </g>
        )}
      </svg>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Histórico de Preço</h2>
            <p className="text-sm text-gray-600 mt-1">
              {investment.name} {investment.ticker && `(${investment.ticker})`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <i className="ri-close-line text-xl text-gray-600"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Carregando histórico de preços...</p>
            </div>
          )}

          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <i className="ri-information-line text-xl text-amber-600 mt-0.5"></i>
                <p className="text-sm text-amber-800">{error}</p>
              </div>
            </div>
          )}

          {!loading && historyData && (
            <>
              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-arrow-down-line text-blue-600"></i>
                    <span className="text-sm font-medium text-blue-900">Preço Mínimo</span>
                  </div>
                  <p className="text-xl font-bold text-blue-900">
                    {historyData.min.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-arrow-up-line text-purple-600"></i>
                    <span className="text-sm font-medium text-purple-900">Preço Máximo</span>
                  </div>
                  <p className="text-xl font-bold text-purple-900">
                    {historyData.max.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-price-tag-3-line text-amber-600"></i>
                    <span className="text-sm font-medium text-amber-900">Preço de Entrada</span>
                  </div>
                  <p className="text-xl font-bold text-amber-900">
                    {investment.entry_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>

                <div className={`bg-gradient-to-br rounded-lg p-4 ${
                  historyData.variation >= 0 
                    ? 'from-green-50 to-green-100' 
                    : 'from-red-50 to-red-100'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <i className={`ri-line-chart-line ${
                      historyData.variation >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}></i>
                    <span className={`text-sm font-medium ${
                      historyData.variation >= 0 ? 'text-green-900' : 'text-red-900'
                    }`}>
                      Variação
                    </span>
                  </div>
                  <p className={`text-xl font-bold ${
                    historyData.variation >= 0 ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {historyData.variation >= 0 ? '+' : ''}{historyData.variation.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Gráfico */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Evolução de Preço (Últimos 30 dias)
                </h3>
                <div className="bg-white rounded-lg p-4">
                  {renderChart()}
                </div>
              </div>

              {/* Legenda */}
              <div className="flex flex-wrap items-center gap-6 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-teal-500 rounded"></div>
                  <span className="text-gray-700">Preço Histórico</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 border-2 border-dashed border-amber-500 rounded"></div>
                  <span className="text-gray-700">Preço de Entrada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-teal-500 rounded-full border-2 border-white shadow"></div>
                  <span className="text-gray-700">Preço Atual</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium whitespace-nowrap"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}