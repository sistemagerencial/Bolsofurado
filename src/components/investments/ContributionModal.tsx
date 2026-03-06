import { useState, useEffect } from 'react';
import type { Investment } from '../../hooks/useInvestments';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment;
  onSave: (contribution: { month: string; value: number; tipo: 'parcela' | 'rentabilidade' }) => void;
}

interface Contribution {
  month: string;
  value: number;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split('-');
  const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${monthNames[parseInt(month) - 1]}/${year}`;
};

const getTypeColor = (type: string) => {
  if (type === 'Previdência Privada') return '#7C3AED';
  if (type === 'Capitalização') return '#22C55E';
  if (type === 'Consórcio') return '#F59E0B';
  return '#7C3AED';
};

const getTypeIcon = (type: string) => {
  if (type === 'Previdência Privada') return 'ri-shield-check-line';
  if (type === 'Capitalização') return 'ri-coin-line';
  if (type === 'Consórcio') return 'ri-group-line';
  return 'ri-wallet-line';
};

export function ContributionModal({ isOpen, onClose, investment, onSave }: ContributionModalProps) {
  const [tipo, setTipo] = useState<'parcela' | 'rentabilidade'>('parcela');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [value, setValue] = useState<number | ''>('');
  const [contributions, setContributions] = useState<Contribution[]>([]);

  // Extrair rentabilidade atual salva nas notas
  const currentRentabilidade = (() => {
    if (!investment.notes) return 0;
    const match = investment.notes.match(/\[RENT_VALUE\]([-\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  })();

  useEffect(() => {
    if (!isOpen) return;
    setValue('');
    setTipo('parcela');
    if (!investment.notes) { setContributions([]); return; }
    const regex = /\[CONTRIB\](\{.*?\})/g;
    const matches = [...investment.notes.matchAll(regex)];
    const history: Contribution[] = [];
    matches.forEach((match) => {
      try {
        const data = JSON.parse(match[1]);
        history.push({ month: data.month, value: data.value });
      } catch { /* ignorar */ }
    });
    setContributions(history.sort((a, b) => b.month.localeCompare(a.month)));
  }, [isOpen, investment]);

  const handleSave = () => {
    if (value === '' || (tipo === 'parcela' && Number(value) <= 0)) return;
    onSave({ month, value: Number(value), tipo });
    setValue('');
  };

  const totalAccumulated = contributions.reduce((s, c) => s + c.value, 0);
  const color = getTypeColor(investment.type);
  const icon = getTypeIcon(investment.type);

  const saldoAcumulado = investment.amount || 0;

  // Para parcela: novo saldo = saldo atual + valor
  // Para rentabilidade: saldo não muda, apenas atualiza o lucro/prejuízo
  const rentabilidadeValor = tipo === 'rentabilidade' ? Number(value || 0) : currentRentabilidade;
  const rentabilidadePct = saldoAcumulado > 0 ? (rentabilidadeValor / saldoAcumulado) * 100 : 0;
  const valorTotal = saldoAcumulado + rentabilidadeValor;

  const novoSaldoParcela = saldoAcumulado + Number(value || 0);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#16122A] border-b border-white/5 p-5 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${color}20` }}
              >
                <i className={`${icon} text-xl`} style={{ color }}></i>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F9FAFB]">Lançar</h2>
                <p className="text-xs text-[#9CA3AF]">{investment.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
            >
              <i className="ri-close-line text-lg text-[#F9FAFB]"></i>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Resumo atual */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl p-4 border"
              style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
            >
              <p className="text-xs text-[#9CA3AF] mb-1">Saldo acumulado (parcelas)</p>
              <p className="text-xl font-bold" style={{ color }}>
                {formatCurrency(saldoAcumulado)}
              </p>
            </div>
            <div className="rounded-xl p-4 border bg-[#0E0B16] border-white/5">
              <p className="text-xs text-[#9CA3AF] mb-1">Rentabilidade atual</p>
              <p className={`text-xl font-bold ${currentRentabilidade >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {currentRentabilidade >= 0 ? '+' : ''}{formatCurrency(currentRentabilidade)}
              </p>
              {saldoAcumulado > 0 && (
                <p className={`text-xs mt-0.5 ${currentRentabilidade >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {currentRentabilidade >= 0 ? '+' : ''}{((currentRentabilidade / saldoAcumulado) * 100).toFixed(2)}%
                </p>
              )}
            </div>
          </div>

          {/* Valor total */}
          <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#9CA3AF]">Valor Total (saldo + rentabilidade)</p>
              <p className="text-2xl font-bold text-[#F9FAFB]">
                {formatCurrency(saldoAcumulado + currentRentabilidade)}
              </p>
            </div>
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5">
              <i className="ri-wallet-3-line text-[#9CA3AF] text-lg"></i>
            </div>
          </div>

          {/* Seletor de tipo */}
          <div className="bg-[#0E0B16] rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setTipo('parcela')}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
                tipo === 'parcela'
                  ? 'bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white shadow-md'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              <i className="ri-add-circle-line text-base"></i>
              Parcela
            </button>
            <button
              onClick={() => setTipo('rentabilidade')}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
                tipo === 'rentabilidade'
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-md'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              <i className="ri-percent-line text-base"></i>
              Rentabilidade
            </button>
          </div>

          {/* Descrição do tipo selecionado */}
          <div
            className="rounded-xl p-3 border flex items-start gap-3"
            style={{
              backgroundColor: tipo === 'parcela' ? 'rgba(34,197,94,0.08)' : 'rgba(124,58,237,0.08)',
              borderColor: tipo === 'parcela' ? 'rgba(34,197,94,0.2)' : 'rgba(124,58,237,0.2)',
            }}
          >
            <i
              className={`text-lg mt-0.5 ${tipo === 'parcela' ? 'ri-add-circle-line text-[#22C55E]' : 'ri-percent-line text-[#7C3AED]'}`}
            ></i>
            <div>
              <p className="text-sm font-semibold text-[#F9FAFB] mb-0.5">
                {tipo === 'parcela' ? 'Lançar Parcela' : 'Lançar Rentabilidade'}
              </p>
              <p className="text-xs text-[#9CA3AF]">
                {tipo === 'parcela'
                  ? 'O valor informado será somado ao saldo acumulado. O saldo cresce a cada parcela.'
                  : 'Informe o lucro (+) ou prejuízo (−) em R$. O saldo das parcelas não muda. A rentabilidade % é calculada sobre o saldo acumulado.'}
              </p>
            </div>
          </div>

          {/* Formulário */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                Mês de referência
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                {tipo === 'parcela' ? 'Valor da parcela (R$)' : 'Lucro / Prejuízo em R$ (use − para prejuízo)'}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder={tipo === 'parcela' ? 'Ex: 500,00' : 'Ex: 4000,00 ou -1200,00'}
                value={value}
                onChange={(e) => setValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none text-sm"
              />
              {tipo === 'rentabilidade' && saldoAcumulado > 0 && value !== '' && (
                <p className="text-xs text-[#9CA3AF] mt-1">
                  Isso corresponde a{' '}
                  <span className={`font-bold ${Number(value) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {Number(value) >= 0 ? '+' : ''}{((Number(value) / saldoAcumulado) * 100).toFixed(2)}%
                  </span>{' '}
                  sobre o saldo de {formatCurrency(saldoAcumulado)}
                </p>
              )}
            </div>
          </div>

          {/* Preview */}
          {value !== '' && (
            <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5 space-y-3">
              <p className="text-xs text-[#9CA3AF] font-semibold uppercase tracking-wide">Prévia após lançamento</p>

              {tipo === 'parcela' ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Novo saldo acumulado</p>
                    <p className="text-xl font-bold text-[#22C55E]">{formatCurrency(novoSaldoParcela)}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      {formatCurrency(saldoAcumulado)} + {formatCurrency(Number(value))}
                    </p>
                  </div>
                  <i className="ri-arrow-right-line text-[#9CA3AF] text-xl"></i>
                  <div className="text-right">
                    <p className="text-xs text-[#9CA3AF]">Valor total</p>
                    <p className="text-xl font-bold text-[#F9FAFB]">
                      {formatCurrency(novoSaldoParcela + currentRentabilidade)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <p className="text-xs text-[#9CA3AF]">Saldo acumulado (sem alteração)</p>
                    <p className="text-sm font-bold" style={{ color }}>{formatCurrency(saldoAcumulado)}</p>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <p className="text-xs text-[#9CA3AF]">Rentabilidade (lucro/prejuízo)</p>
                    <p className={`text-sm font-bold ${Number(value) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      {Number(value) >= 0 ? '+' : ''}{formatCurrency(Number(value))}
                    </p>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <p className="text-xs text-[#9CA3AF]">Rentabilidade %</p>
                    <p className={`text-sm font-bold ${Number(value) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      {saldoAcumulado > 0
                        ? `${Number(value) >= 0 ? '+' : ''}${((Number(value) / saldoAcumulado) * 100).toFixed(2)}%`
                        : '-'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-sm font-semibold text-[#F9FAFB]">Valor Total</p>
                    <p className="text-xl font-bold text-[#F9FAFB]">
                      {formatCurrency(saldoAcumulado + Number(value))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botão confirmar */}
          <button
            onClick={handleSave}
            disabled={value === '' || (tipo === 'parcela' && Number(value) <= 0)}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all cursor-pointer whitespace-nowrap text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background:
                tipo === 'parcela'
                  ? 'linear-gradient(to right, #22C55E, #16A34A)'
                  : 'linear-gradient(to right, #7C3AED, #EC4899)',
            }}
          >
            <i className={`text-lg ${tipo === 'parcela' ? 'ri-add-circle-line' : 'ri-percent-line'}`}></i>
            {tipo === 'parcela' ? 'Confirmar Parcela' : 'Confirmar Rentabilidade'}
          </button>

          {/* Histórico de parcelas */}
          {contributions.length > 0 && (
            <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[#F9FAFB]">Histórico de parcelas</p>
                <p className="text-sm font-bold" style={{ color }}>
                  {formatCurrency(totalAccumulated)}
                </p>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {contributions.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 bg-[#16122A] rounded-lg border border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <i className="ri-calendar-check-line text-xs" style={{ color }}></i>
                      </div>
                      <p className="text-sm text-[#F9FAFB]">{formatMonth(c.month)}</p>
                    </div>
                    <p className="text-sm font-bold" style={{ color }}>
                      {formatCurrency(c.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-[#F9FAFB] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
