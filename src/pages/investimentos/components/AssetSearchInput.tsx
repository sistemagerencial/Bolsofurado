import { useState, useRef, useEffect, useCallback } from 'react';
import {
  TOP_CRYPTOS,
  TOP_ACOES_BR,
  TOP_ACOES_EUA,
  TOP_FIIS,
  TOP_ETFS,
  TOP_RENDA_FIXA,
  TOP_FUNDOS,
} from '../../../mocks/assets';

interface AssetOption {
  symbol: string;
  name: string;
  id: string;
}

interface AssetSearchInputProps {
  assetType: string;
  value: string;
  onChange: (name: string, symbol: string) => void;
  onPriceFound?: (price: number) => void;
}

const getAssetList = (type: string): AssetOption[] => {
  switch (type) {
    case 'Criptomoedas': return TOP_CRYPTOS;
    case 'Ações BR': return TOP_ACOES_BR;
    case 'Ações EUA': return TOP_ACOES_EUA;
    case 'FIIs': return TOP_FIIS;
    case 'ETFs': return TOP_ETFS;
    case 'Renda Fixa': return TOP_RENDA_FIXA;
    case 'Fundos': return TOP_FUNDOS;
    default: return [];
  }
};

const fetchUsdBrl = async (): Promise<number> => {
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
    const data = await res.json();
    return parseFloat(data.USDBRL?.bid || '5.5');
  } catch {
    return 5.5;
  }
};

const fetchPriceForAsset = async (asset: AssetOption, assetType: string): Promise<number | null> => {
  try {
    if (assetType === 'Criptomoedas') {
      const usdBrl = await fetchUsdBrl();
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${asset.id}&vs_currencies=usd`
      );
      const data = await res.json();
      const usdPrice = data[asset.id]?.usd;
      if (usdPrice) return usdPrice * usdBrl;
      return null;
    }

    if (assetType === 'Ações BR' || assetType === 'FIIs' || assetType === 'ETFs') {
      const res = await fetch(`https://brapi.dev/api/quote/${asset.symbol}?token=demo`);
      const data = await res.json();
      const price = data?.results?.[0]?.regularMarketPrice;
      if (price != null) return price;
      return null;
    }

    if (assetType === 'Ações EUA') {
      const usdBrl = await fetchUsdBrl();
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${asset.symbol}?interval=1d&range=1d`;
      const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxy);
      const outer = await res.json();
      const inner = JSON.parse(outer.contents);
      const price = inner?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price != null) return price * usdBrl;
      return null;
    }

    return null;
  } catch {
    return null;
  }
};

export default function AssetSearchInput({ assetType, value, onChange, onPriceFound }: AssetSearchInputProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<AssetOption[]>([]);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [priceStatus, setPriceStatus] = useState<'idle' | 'loading' | 'found' | 'error'>('idle');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const list = getAssetList(assetType);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (query.trim().length === 0) {
      setFiltered(list.slice(0, 30));
    } else {
      const q = query.toLowerCase();
      setFiltered(
        list.filter(
          (a) =>
            a.symbol.toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q)
        ).slice(0, 30)
      );
    }
  }, [query, assetType]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = useCallback(async (asset: AssetOption) => {
    // Salva o SÍMBOLO/TICKER como nome principal
    setQuery(asset.symbol);
    onChange(asset.symbol, asset.symbol);
    setOpen(false);

    // Busca preço automático se suportado
    const supportsAutoPrice = ['Criptomoedas', 'Ações BR', 'Ações EUA', 'FIIs', 'ETFs'].includes(assetType);
    if (supportsAutoPrice && onPriceFound) {
      setFetchingPrice(true);
      setPriceStatus('loading');
      const price = await fetchPriceForAsset(asset, assetType);
      setFetchingPrice(false);
      if (price !== null) {
        onPriceFound(price);
        setPriceStatus('found');
        setTimeout(() => setPriceStatus('idle'), 4000);
      } else {
        setPriceStatus('error');
        setTimeout(() => setPriceStatus('idle'), 4000);
      }
    }
  }, [assetType, onChange, onPriceFound]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange(e.target.value, '');
    setOpen(true);
    setPriceStatus('idle');
  };

  const placeholder =
    assetType === 'Criptomoedas' ? 'Buscar cripto... ex: Bitcoin, BTC' :
    assetType === 'Ações BR' ? 'Buscar ação... ex: Petrobras, PETR4' :
    assetType === 'Ações EUA' ? 'Buscar ação... ex: Apple, AAPL' :
    assetType === 'FIIs' ? 'Buscar FII... ex: MXRF11' :
    assetType === 'ETFs' ? 'Buscar ETF... ex: BOVA11, SPY' :
    assetType === 'Renda Fixa' ? 'Buscar... ex: Tesouro Selic, CDB' :
    assetType === 'Fundos' ? 'Buscar fundo... ex: Verde, Alaska' :
    'Nome do ativo...';

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          className="w-full bg-[#0E0B16] border border-white/5 rounded-xl pl-9 pr-10 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {priceStatus === 'loading' && (
            <i className="ri-loader-4-line animate-spin text-[#7C3AED] text-sm" title="Buscando preço..." />
          )}
          {priceStatus === 'found' && (
            <i className="ri-check-line text-[#22C55E] text-sm" title="Preço encontrado!" />
          )}
          {priceStatus === 'error' && (
            <i className="ri-error-warning-line text-[#F59E0B] text-sm" title="Preço não encontrado" />
          )}
          {priceStatus === 'idle' && list.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="w-6 h-6 flex items-center justify-center cursor-pointer"
            >
              <i className={`ri-arrow-${open ? 'up' : 'down'}-s-line text-[#9CA3AF] text-sm`} />
            </button>
          )}
        </div>
      </div>

      {/* Status de busca de preço */}
      {priceStatus === 'loading' && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-[#7C3AED]">
          <i className="ri-loader-4-line animate-spin" />
          Buscando preço atual do ativo...
        </div>
      )}
      {priceStatus === 'found' && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-[#22C55E]">
          <i className="ri-check-double-line" />
          Preço atual encontrado e preenchido automaticamente!
        </div>
      )}
      {priceStatus === 'error' && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-[#F59E0B]">
          <i className="ri-information-line" />
          Preço não encontrado — preencha manualmente se necessário.
        </div>
      )}

      {open && list.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1A1530] border border-white/10 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-[#9CA3AF]">Nenhum resultado encontrado</div>
          ) : (
            filtered.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => handleSelect(asset)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#7C3AED]/20 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#7C3AED] bg-[#7C3AED]/10 px-2 py-0.5 rounded-md min-w-[52px] text-center">
                    {asset.symbol}
                  </span>
                  <span className="text-sm text-[#F9FAFB]">{asset.name}</span>
                </div>
                {['Criptomoedas', 'Ações BR', 'Ações EUA', 'FIIs', 'ETFs'].includes(assetType) && (
                  <span className="text-xs text-[#9CA3AF] flex items-center gap-1">
                    <i className="ri-refresh-line text-xs" /> preço auto
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
