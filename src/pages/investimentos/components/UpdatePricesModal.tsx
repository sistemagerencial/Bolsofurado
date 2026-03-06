import { useState, useEffect } from 'react';
import type { Investment } from '../../../hooks/useInvestments';
import { TOP_CRYPTOS } from '../../../mocks/assets';

interface PriceData {
  id: string;
  fetchedPrice: number | null;
  confirmedPrice: string;
  loading: boolean;
  error: string | null;
  source: string;
}

interface UpdatePricesModalProps {
  investments: Investment[];
  onClose: () => void;
  onSave: (updates: Record<string, number>) => Promise<void>;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const calcProfit = (inv: Investment, currentPrice: number) => {
  const invested = inv.amount || 0;
  const entryPrice = inv.entry_price || 0;
  if (entryPrice > 0 && currentPrice > 0) {
    return invested * (currentPrice - entryPrice) / entryPrice;
  }
  return currentPrice - invested;
};

const calcProfitability = (inv: Investment, currentPrice: number) => {
  const invested = inv.amount || 0;
  const entryPrice = inv.entry_price || 0;
  if (entryPrice > 0 && currentPrice > 0) {
    return ((currentPrice - entryPrice) / entryPrice) * 100;
  }
  if (invested > 0) {
    return ((currentPrice - invested) / invested) * 100;
  }
  return 0;
};

const guessCryptoId = (inv: Investment): string | null => {
  const nameLower = (inv.name || '').toLowerCase().trim();
  const notesLower = (inv.notes || '').toLowerCase();
  const codeLower = (inv.code || '').toLowerCase().trim();

  const found = TOP_CRYPTOS.find(
    (c) =>
      c.name.toLowerCase() === nameLower ||
      c.symbol.toLowerCase() === nameLower ||
      c.symbol.toLowerCase() === codeLower ||
      c.id.toLowerCase() === nameLower ||
      notesLower.includes(c.symbol.toLowerCase()) ||
      notesLower.includes(c.id.toLowerCase())
  );
  return found ? found.id : null;
};

// Extrai ticker de ação BR/FII/ETF do nome ou código
const guessTickerBR = (inv: Investment): string | null => {
  const code = (inv.code || '').trim().toUpperCase();
  const name = (inv.name || '').trim().toUpperCase();

  // Prioriza o campo código
  if (/^[A-Z]{4}\d{1,2}$/.test(code)) return code;
  // Tenta extrair do nome
  const matchName = name.match(/^([A-Z]{4}\d{1,2})/);
  if (matchName) return matchName[1];
  // Nome exato como ticker
  if (/^[A-Z]{4}\d{1,2}$/.test(name)) return name;
  return null;
};

// Extrai ticker de ação EUA do nome ou código
const guessTickerUS = (inv: Investment): string | null => {
  const code = (inv.code || '').trim().toUpperCase();
  const name = (inv.name || '').trim().toUpperCase();

  // Código preenchido e parece ticker US (1-5 letras, sem números obrigatórios)
  if (/^[A-Z]{1,5}$/.test(code)) return code;
  // Nome parece ticker US
  if (/^[A-Z]{1,5}$/.test(name)) return name;
  return null;
};

export default function UpdatePricesModal({ investments, onClose, onSave }: UpdatePricesModalProps) {
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({});
  const [fetchingAll, setFetchingAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);

  useEffect(() => {
    const initial: Record<string, PriceData> = {};
    investments.forEach((inv) => {
      initial[inv.id] = {
        id: inv.id,
        fetchedPrice: null,
        confirmedPrice: String(inv.current_value || ''),
        loading: false,
        error: null,
        source: '',
      };
    });
    setPriceData(initial);
  }, [investments]);

  const fetchUsdBrl = async (): Promise<number> => {
    try {
      const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
      const data = await res.json();
      return parseFloat(data.USDBRL?.bid || '5.5');
    } catch {
      return 5.5;
    }
  };

  const fetchCryptoPrice = async (coinId: string, usdBrl: number): Promise<number | null> => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
      );
      const data = await res.json();
      const usdPrice = data[coinId]?.usd;
      if (usdPrice) return usdPrice * usdBrl;
      return null;
    } catch {
      return null;
    }
  };

  // Ações BR, FIIs, ETFs via Brapi
  const fetchBRStockPrice = async (ticker: string): Promise<number | null> => {
    try {
      const res = await fetch(`https://brapi.dev/api/quote/${ticker}?token=demo`);
      const data = await res.json();
      const price = data?.results?.[0]?.regularMarketPrice;
      if (price != null) return price;
      return null;
    } catch {
      return null;
    }
  };

  // Ações EUA via Yahoo Finance (proxy público)
  const fetchUSStockPrice = async (ticker: string, usdBrl: number): Promise<number | null> => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
      const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxy);
      const outer = await res.json();
      const inner = JSON.parse(outer.contents);
      const price = inner?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price != null) return price * usdBrl;
      return null;
    } catch {
      return null;
    }
  };

  // Busca preço de um único ativo
  const fetchSinglePrice = async (inv: Investment, usdBrl: number): Promise<{ price: number | null; source: string; error: string | null }> => {
    const type = inv.type || '';

    if (type === 'Criptomoedas') {
      const coinId = guessCryptoId(inv);
      if (coinId) {
        const price = await fetchCryptoPrice(coinId, usdBrl);
        if (price != null) return { price, source: 'CoinGecko', error: null };
        return { price: null, source: '', error: 'Não foi possível obter cotação da cripto' };
      }
      return { price: null, source: '', error: 'Cripto não identificada — verifique o nome ou código' };
    }

    if (type === 'Ações BR' || type === 'FIIs' || type === 'ETFs') {
      const ticker = guessTickerBR(inv);
      if (ticker) {
        const price = await fetchBRStockPrice(ticker);
        if (price != null) return { price, source: 'Brapi (B3)', error: null };
        return { price: null, source: '', error: `Ticker "${ticker}" não encontrado na B3` };
      }
      return { price: null, source: '', error: 'Ticker BR não identificado — preencha o campo Código (ex: PETR4)' };
    }

    if (type === 'Ações EUA') {
      const ticker = guessTickerUS(inv);
      if (ticker) {
        const price = await fetchUSStockPrice(ticker, usdBrl);
        if (price != null) return { price, source: 'Yahoo Finance (NYSE/NASDAQ)', error: null };
        return { price: null, source: '', error: `Ticker "${ticker}" não encontrado na NYSE/NASDAQ` };
      }
      return { price: null, source: '', error: 'Ticker EUA não identificado — preencha o campo Código (ex: AAPL)' };
    }

    return { price: null, source: '', error: 'Atualização automática não disponível para este tipo — insira manualmente' };
  };

  // Atualiza um único ativo (botão girar individual)
  const fetchSingleInvestment = async (inv: Investment) => {
    setPriceData((prev) => ({
      ...prev,
      [inv.id]: { ...prev[inv.id], loading: true, error: null },
    }));

    const usdBrl = await fetchUsdBrl();
    const { price, source, error } = await fetchSinglePrice(inv, usdBrl);

    setPriceData((prev) => ({
      ...prev,
      [inv.id]: {
        ...prev[inv.id],
        loading: false,
        fetchedPrice: price,
        confirmedPrice: price !== null ? price.toFixed(2) : prev[inv.id].confirmedPrice,
        source,
        error,
      },
    }));
  };

  const fetchAllPrices = async () => {
    setFetchingAll(true);
    setFetchDone(false);

    setPriceData((prev) => {
      const next = { ...prev };
      investments.forEach((inv) => {
        next[inv.id] = { ...next[inv.id], loading: true, error: null };
      });
      return next;
    });

    const usdBrl = await fetchUsdBrl();

    for (const inv of investments) {
      const { price, source, error } = await fetchSinglePrice(inv, usdBrl);

      setPriceData((prev) => ({
        ...prev,
        [inv.id]: {
          ...prev[inv.id],
          loading: false,
          fetchedPrice: price,
          confirmedPrice: price !== null ? price.toFixed(2) : prev[inv.id].confirmedPrice,
          source,
          error,
        },
      }));
    }

    setFetchingAll(false);
    setFetchDone(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const updates: Record<string, number> = {};
    investments.forEach((inv) => {
      const val = parseFloat(priceData[inv.id]?.confirmedPrice || '0');
      if (!isNaN(val) && val > 0) {
        updates[inv.id] = val;
      }
    });
    await onSave(updates);
    setSaving(false);
  };

  const typeLabel: Record<string, string> = {
    'Criptomoedas': '🪙 CoinGecko',
    'Ações BR': '🇧🇷 Brapi (B3)',
    'FIIs': '🇧🇷 Brapi (B3)',
    'ETFs': '🇧🇷 Brapi (B3)',
    'Ações EUA': '🇺🇸 Yahoo Finance',
    'Renda Fixa': '✍️ Manual',
    'Fundos': '✍️ Manual',
    'Outros': '✍️ Manual',
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-white/5 p-5 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-[#F9FAFB]">🔄 Atualizar Preços</h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Cotações em tempo real para todos os tipos de ativos
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
            >
              <i className="ri-close-line text-lg text-[#F9FAFB]" />
            </button>
          </div>

          {/* Legenda de fontes */}
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { label: '🪙 Cripto', sub: 'CoinGecko' },
              { label: '🇧🇷 BR/FII/ETF', sub: 'Brapi (B3)' },
              { label: '🇺🇸 Ações EUA', sub: 'Yahoo Finance' },
              { label: '✍️ Renda Fixa', sub: 'Manual' },
            ].map((s) => (
              <span key={s.label} className="text-xs px-2 py-1 rounded-full bg-white/5 text-[#9CA3AF]">
                {s.label} <span className="text-[#7C3AED]">· {s.sub}</span>
              </span>
            ))}
          </div>

          <button
            onClick={fetchAllPrices}
            disabled={fetchingAll}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 hover:shadow-lg hover:shadow-[#7C3AED]/30 whitespace-nowrap"
          >
            {fetchingAll ? (
              <><i className="ri-loader-4-line animate-spin text-lg" /> Buscando cotações...</>
            ) : (
              <><i className="ri-global-line text-lg" /> Buscar Todos os Preços Atualizados</>
            )}
          </button>

          {fetchDone && (
            <div className="mt-2 flex items-center gap-2 text-xs text-[#22C55E]">
              <i className="ri-check-double-line" />
              Cotações buscadas! Confirme os preços abaixo antes de salvar.
            </div>
          )}
        </div>

        {/* Lista de ativos */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-3">
          {investments.length === 0 ? (
            <p className="text-center text-[#9CA3AF] py-8">Nenhum ativo cadastrado ainda.</p>
          ) : (
            investments.map((inv) => {
              const pd = priceData[inv.id];
              if (!pd) return null;

              const confirmedVal = parseFloat(pd.confirmedPrice || '0');
              const hasPrice = confirmedVal > 0;
              const profit = hasPrice ? calcProfit(inv, confirmedVal) : 0;
              const profitPct = hasPrice ? calcProfitability(inv, confirmedVal) : 0;
              const priceChanged = pd.fetchedPrice !== null && pd.fetchedPrice !== inv.current_value;
              const isManual = ['Renda Fixa', 'Fundos', 'Outros'].includes(inv.type || '');

              return (
                <div
                  key={inv.id}
                  className={`bg-[#0E0B16] rounded-xl p-4 border transition-all ${
                    pd.fetchedPrice !== null && !pd.error
                      ? 'border-[#7C3AED]/30'
                      : 'border-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-sm font-bold text-[#F9FAFB] truncate">{inv.name}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <p className="text-xs text-[#9CA3AF]">{inv.type}</p>
                        {inv.code && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-[#9CA3AF] font-mono">
                            {inv.code}
                          </span>
                        )}
                        <span className="text-xs text-[#7C3AED]/70">
                          {typeLabel[inv.type || ''] || '✍️ Manual'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Botão girar individual */}
                      {!isManual && (
                        <button
                          onClick={() => fetchSingleInvestment(inv)}
                          disabled={pd.loading || fetchingAll}
                          title="Atualizar preço deste ativo"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#7C3AED]/20 hover:bg-[#7C3AED]/40 text-[#7C3AED] transition-all cursor-pointer disabled:opacity-50"
                        >
                          <i className={`ri-refresh-line text-sm ${pd.loading ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                      {pd.source && !pd.loading && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] font-medium hidden sm:inline">
                          {pd.source}
                        </span>
                      )}
                      {hasPrice && (
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-lg ${
                            profitPct >= 0
                              ? 'bg-[#22C55E]/20 text-[#22C55E]'
                              : 'bg-[#EF4444]/20 text-[#EF4444]'
                          }`}
                        >
                          {profitPct >= 0 ? '+' : ''}{profitPct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preço anterior vs novo */}
                  {pd.fetchedPrice !== null && priceChanged && (
                    <div className="flex items-center gap-2 mb-3 text-xs">
                      <span className="text-[#9CA3AF]">Anterior: {formatCurrency(inv.current_value || 0)}</span>
                      <i className="ri-arrow-right-line text-[#7C3AED]" />
                      <span className="text-[#F9FAFB] font-bold">{formatCurrency(pd.fetchedPrice)}</span>
                      <span className={`font-bold ${pd.fetchedPrice >= (inv.current_value || 0) ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                        ({pd.fetchedPrice >= (inv.current_value || 0) ? '+' : ''}
                        {(((pd.fetchedPrice - (inv.current_value || 0)) / (inv.current_value || 1)) * 100).toFixed(2)}%)
                      </span>
                    </div>
                  )}

                  {pd.loading && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-[#7C3AED]">
                      <i className="ri-loader-4-line animate-spin" /> Buscando cotação...
                    </div>
                  )}

                  {pd.error && !pd.loading && (
                    <div className="flex items-start gap-2 mb-2 text-xs text-[#F59E0B] bg-[#F59E0B]/10 rounded-lg px-3 py-2">
                      <i className="ri-information-line mt-0.5 flex-shrink-0" />
                      <span>{pd.error}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-[#9CA3AF] mb-1">
                        {isManual ? 'Preço Atual (R$) — insira manualmente' : 'Preço Atual (R$) — confirme ou edite'}
                      </p>
                      <input
                        type="number"
                        step="0.01"
                        value={pd.confirmedPrice}
                        onChange={(e) =>
                          setPriceData((prev) => ({
                            ...prev,
                            [inv.id]: { ...prev[inv.id], confirmedPrice: e.target.value },
                          }))
                        }
                        className="w-full bg-[#16122A] border border-white/10 rounded-lg px-3 py-2 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                      />
                    </div>
                    {hasPrice && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-[#9CA3AF] mb-1">Lucro / Prejuízo</p>
                        <p className={`text-sm font-bold ${profit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                          {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                        </p>
                      </div>
                    )}
                  </div>

                  {inv.entry_price > 0 && (
                    <p className="text-xs text-[#9CA3AF] mt-2">
                      Entrada: {formatCurrency(inv.entry_price)} · Investido: {formatCurrency(inv.amount)}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {investments.length > 0 && (
          <div className="border-t border-white/5 p-4 sm:p-5 flex gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-[#F9FAFB] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-lg hover:shadow-[#7C3AED]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <><i className="ri-loader-4-line animate-spin" /> Salvando...</>
              ) : (
                <><i className="ri-save-line" /> Confirmar e Salvar</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
