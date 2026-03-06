import { useMemo, useState } from 'react';
import type { Investment } from '../../hooks/useInvestments';

interface InvestmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment & {
    profit: number;
    profitability: number;
    currentPosition: number;
    invested: number;
    status: string;
  };
  onLancarParcela?: () => void;
  onResgatar?: () => void;
  onEditar?: () => void;
  onUpdateContribution?: (index: number, newMonth: string, newValue: number) => void;
  onDeleteContribution?: (index: number) => void;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
};

const isLongTermType = (type: string) =>
  ['Previdência Privada', 'Capitalização', 'Consórcio'].includes(type);

const getTypeColor = (type: string) => {
  const map: Record<string, string> = {
    'Previdência Privada': '#7C3AED',
    'Capitalização': '#22C55E',
    'Consórcio': '#F59E0B',
    'Criptomoedas': '#F97316',
    'Ações BR': '#3B82F6',
    'Ações EUA': '#06B6D4',
    'FIIs': '#10B981',
    'Renda Fixa': '#8B5CF6',
    'Fundos': '#EC4899',
    'ETFs': '#14B8A6',
  };
  return map[type] || '#7C3AED';
};

const getTypeIcon = (type: string) => {
  const map: Record<string, string> = {
    'Previdência Privada': 'ri-shield-check-line',
    'Capitalização': 'ri-coin-line',
    'Consórcio': 'ri-group-line',
    'Criptomoedas': 'ri-bit-coin-line',
    'Ações BR': 'ri-stock-line',
    'Ações EUA': 'ri-global-line',
    'FIIs': 'ri-building-2-line',
    'Renda Fixa': 'ri-bank-line',
    'Fundos': 'ri-funds-line',
    'ETFs': 'ri-bar-chart-2-line',
  };
  return map[type] || 'ri-wallet-line';
};

export default function InvestmentDetailModal({
  isOpen,
  onClose,
  investment,
  onLancarParcela,
  onResgatar,
  onEditar,
  onUpdateContribution,
  onDeleteContribution,
}: InvestmentDetailModalProps) {
  const color = getTypeColor(investment.type);
  const icon = getTypeIcon(investment.type);
  const isLongTerm = isLongTermType(investment.type);
  const isEncerrado = investment.notes?.includes('[RESGATE]') ?? false;

  // Estado para edição inline de lançamento
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editMonth, setEditMonth] = useState('');
  const [editValue, setEditValue] = useState<number | ''>('');
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);

  // Extrair dados extras das notas
  const extraData = useMemo(() => {
    if (!investment.notes) return null;
    const patterns: Record<string, RegExp> = {
      'Previdência Privada': /\[PREVIDENCIA\](\{.*?\})/,
      'Capitalização': /\[CAPITALIZACAO\](\{.*?\})/,
      'Consórcio': /\[CONSORCIO\](\{.*?\})/,
    };
    const pattern = patterns[investment.type];
    if (!pattern) return null;
    const match = investment.notes.match(pattern);
    if (!match) return null;
    try { return JSON.parse(match[1]); } catch { return null; }
  }, [investment]);

  // Extrair histórico de contribuições com índice original
  const contributions = useMemo(() => {
    if (!investment.notes) return [];
    const regex = /\[CONTRIB\](\{.*?\})/g;
    const matches = [...investment.notes.matchAll(regex)];
    return matches.map((m, idx) => {
      try {
        const parsed = JSON.parse(m[1]);
        return { ...parsed, _idx: idx };
      } catch { return null; }
    }).filter(Boolean).sort((a: any, b: any) => b.month.localeCompare(a.month));
  }, [investment]);

  // Extrair dados do resgate
  const resgateData = useMemo(() => {
    if (!investment.notes) return null;
    const match = investment.notes.match(/\[RESGATE\](\{.*?\})/);
    if (!match) return null;
    try { return JSON.parse(match[1]); } catch { return null; }
  }, [investment]);

  // Calcular rentabilidade anualizada (aproximada)
  const annualizedReturn = useMemo(() => {
    if (!investment.purchase_date || investment.invested <= 0) return null;
    const start = new Date(investment.purchase_date);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    if (diffYears < 0.08) return null;
    const totalReturn = investment.profitability / 100;
    const annualized = (Math.pow(1 + totalReturn, 1 / diffYears) - 1) * 100;
    return annualized;
  }, [investment]);

  // Dias desde o início
  const daysSinceStart = useMemo(() => {
    if (!investment.purchase_date) return null;
    const start = new Date(investment.purchase_date);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [investment]);

  // Progresso do prazo (para longo prazo)
  const termProgress = useMemo(() => {
    if (!extraData?.termMonths || !investment.purchase_date) return null;
    const start = new Date(investment.purchase_date);
    const now = new Date();
    const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const pct = Math.min((monthsElapsed / extraData.termMonths) * 100, 100);
    return { elapsed: monthsElapsed, total: extraData.termMonths, pct, remaining: Math.max(extraData.termMonths - monthsElapsed, 0) };
  }, [extraData, investment]);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${names[parseInt(month) - 1]}/${year}`;
  };

  const startEdit = (c: any) => {
    setEditingIndex(c._idx);
    setEditMonth(c.month);
    setEditValue(c.value);
    setConfirmDeleteIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditMonth('');
    setEditValue('');
  };

  const confirmEdit = (c: any) => {
    if (editValue === '' || Number(editValue) <= 0) return;
    onUpdateContribution?.(c._idx, editMonth, Number(editValue));
    cancelEdit();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#16122A] border-b border-white/5 p-5 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}20` }}
              >
                <i className={`${icon} text-2xl`} style={{ color }}></i>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-[#F9FAFB]">{investment.name}</h2>
                  {isEncerrado && (
                    <span className="px-2 py-0.5 bg-[#EF4444]/20 text-[#EF4444] rounded text-xs font-bold">Encerrado</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {investment.type}
                  </span>
                  {investment.code && (
                    <span className="text-xs text-[#9CA3AF] font-mono">{investment.code}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
            >
              <i className="ri-close-line text-lg text-[#F9FAFB]"></i>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">

          {/* Rentabilidade em destaque */}
          <div
            className="rounded-xl p-5 border"
            style={{
              backgroundColor: investment.profitability >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              borderColor: investment.profitability >= 0 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
            }}
          >
            <p className="text-xs text-[#9CA3AF] mb-1">📈 Rentabilidade até o momento</p>
            <div className="flex items-end justify-between">
              <div>
                <p
                  className="text-4xl font-bold"
                  style={{ color: investment.profitability >= 0 ? '#22C55E' : '#EF4444' }}
                >
                  {investment.profitability >= 0 ? '+' : ''}{investment.profitability.toFixed(2)}%
                </p>
                {annualizedReturn !== null && (
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    ≈ {annualizedReturn >= 0 ? '+' : ''}{annualizedReturn.toFixed(2)}% ao ano
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-[#9CA3AF]">Lucro / Prejuízo</p>
                <p
                  className="text-xl font-bold"
                  style={{ color: investment.profit >= 0 ? '#22C55E' : '#EF4444' }}
                >
                  {investment.profit >= 0 ? '+' : ''}{formatCurrency(investment.profit)}
                </p>
              </div>
            </div>
          </div>

          {/* Cards de resumo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
              <p className="text-xs text-[#9CA3AF] mb-1">💰 {isLongTerm ? 'Saldo Acumulado' : 'Valor Investido'}</p>
              <p className="text-lg font-bold text-[#F9FAFB]">{formatCurrency(investment.invested)}</p>
            </div>
            <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
              <p className="text-xs text-[#9CA3AF] mb-1">📊 Posição Atual</p>
              <p className="text-lg font-bold text-[#F9FAFB]">{formatCurrency(investment.currentPosition)}</p>
            </div>
            {!isLongTerm && investment.quantity > 0 && (
              <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
                <p className="text-xs text-[#9CA3AF] mb-1">🔢 Quantidade</p>
                <p className="text-lg font-bold text-[#F9FAFB]">
                  {investment.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 8 })}
                </p>
              </div>
            )}
            {!isLongTerm && (investment.average_cost || investment.entry_price) > 0 && (
              <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
                <p className="text-xs text-[#9CA3AF] mb-1">📌 Custo Médio</p>
                <p className="text-lg font-bold" style={{ color }}>
                  {formatCurrency(investment.average_cost || investment.entry_price || 0)}
                </p>
              </div>
            )}
            {!isLongTerm && investment.current_value > 0 && (
              <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
                <p className="text-xs text-[#9CA3AF] mb-1">💵 Preço Atual</p>
                <p className="text-lg font-bold text-[#F9FAFB]">
                  {formatCurrency(investment.current_value)}
                </p>
              </div>
            )}
            {daysSinceStart !== null && (
              <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
                <p className="text-xs text-[#9CA3AF] mb-1">📅 Tempo investido</p>
                <p className="text-lg font-bold text-[#F9FAFB]">
                  {daysSinceStart >= 365
                    ? `${(daysSinceStart / 365).toFixed(1)} anos`
                    : `${daysSinceStart} dias`}
                </p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">desde {formatDate(investment.purchase_date)}</p>
              </div>
            )}
          </div>

          {/* Barra de progresso do prazo (longo prazo) */}
          {termProgress && (
            <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[#F9FAFB]">⏳ Progresso do Prazo</p>
                <span className="text-xs font-bold" style={{ color }}>
                  {termProgress.pct.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5 mb-3">
                <div
                  className="h-2.5 rounded-full transition-all"
                  style={{ width: `${termProgress.pct}%`, backgroundColor: color }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#9CA3AF]">
                <span>{termProgress.elapsed} meses decorridos</span>
                <span>{termProgress.remaining} meses restantes</span>
              </div>
            </div>
          )}

          {/* Dados extras — Previdência */}
          {extraData && investment.type === 'Previdência Privada' && (
            <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-[#F9FAFB] mb-3 flex items-center gap-2">
                <i className="ri-shield-check-line text-[#7C3AED]"></i> Dados da Previdência
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {extraData.planType && (
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Tipo de Plano</p>
                    <p className="font-semibold text-[#F9FAFB]">{extraData.planType}</p>
                  </div>
                )}
                {extraData.taxRegime && (
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Tributação</p>
                    <p className="font-semibold text-[#F9FAFB]">{extraData.taxRegime}</p>
                  </div>
                )}
                {extraData.termMonths > 0 && (
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Prazo Total</p>
                    <p className="font-semibold text-[#F9FAFB]">{extraData.termMonths} meses ({(extraData.termMonths / 12).toFixed(1)} anos)</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dados extras — Capitalização */}
          {extraData && investment.type === 'Capitalização' && (
            <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-[#F9FAFB] mb-3 flex items-center gap-2">
                <i className="ri-coin-line text-[#22C55E]"></i> Dados da Capitalização
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {extraData.institution && (
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Instituição</p>
                    <p className="font-semibold text-[#F9FAFB]">{extraData.institution}</p>
                  </div>
                )}
                {extraData.termMonths > 0 && (
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Prazo Total</p>
                    <p className="font-semibold text-[#F9FAFB]">{extraData.termMonths} meses</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dados extras — Consórcio */}
          {extraData && investment.type === 'Consórcio' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-[#F9FAFB] mb-3 flex items-center gap-2">
                <i className="ri-group-line text-amber-500"></i> Dados do Consórcio
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {extraData.administrator && (
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Administradora</p>
                    <p className="font-semibold text-[#F9FAFB]">{extraData.administrator}</p>
                  </div>
                )}
                {extraData.totalValue > 0 && (
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Valor Total</p>
                    <p className="font-semibold text-[#F9FAFB]">{formatCurrency(extraData.totalValue)}</p>
                  </div>
                )}
                {extraData.termMonths > 0 && (
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Prazo Total</p>
                    <p className="font-semibold text-[#F9FAFB]">{extraData.termMonths} meses ({(extraData.termMonths / 12).toFixed(1)} anos)</p>
                  </div>
                )}
                {extraData.totalValue > 0 && extraData.termMonths > 0 && (
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Parcela Estimada</p>
                    <p className="font-semibold text-amber-400">{formatCurrency(extraData.totalValue / extraData.termMonths)}/mês</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Histórico de contribuições com edição/exclusão */}
          {isLongTerm && contributions.length > 0 && (
            <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[#F9FAFB]">📋 Histórico de Parcelas</p>
                <span className="text-xs font-bold" style={{ color }}>
                  {contributions.length} lançamento{contributions.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {contributions.map((c: any) => (
                  <div key={c._idx}>
                    {/* Modo edição */}
                    {editingIndex === c._idx ? (
                      <div className="bg-[#16122A] rounded-xl border p-3 space-y-3" style={{ borderColor: `${color}40` }}>
                        <p className="text-xs font-semibold text-[#F9FAFB]">✏️ Editar lançamento</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-[#9CA3AF] mb-1 block">Mês</label>
                            <input
                              type="month"
                              value={editMonth}
                              onChange={(e) => setEditMonth(e.target.value)}
                              className="w-full bg-[#0E0B16] border border-white/10 rounded-lg px-3 py-2 text-[#F9FAFB] text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-[#9CA3AF] mb-1 block">Valor (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                              className="w-full bg-[#0E0B16] border border-white/10 rounded-lg px-3 py-2 text-[#F9FAFB] text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => confirmEdit(c)}
                            disabled={editValue === '' || Number(editValue) <= 0}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer whitespace-nowrap disabled:opacity-40"
                            style={{ background: `linear-gradient(to right, ${color}, ${color}cc)` }}
                          >
                            <i className="ri-check-line mr-1"></i>Salvar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex-1 py-2 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-[#9CA3AF] transition-all cursor-pointer whitespace-nowrap"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : confirmDeleteIndex === c._idx ? (
                      /* Confirmação de exclusão */
                      <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-semibold text-[#EF4444]">⚠️ Excluir este lançamento?</p>
                        <p className="text-xs text-[#9CA3AF]">
                          {formatMonth(c.month)} — <span className="font-bold text-[#F9FAFB]">{formatCurrency(c.value)}</span>
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              onDeleteContribution?.(c._idx);
                              setConfirmDeleteIndex(null);
                            }}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-[#EF4444] hover:bg-[#EF4444]/80 text-white transition-all cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-delete-bin-line mr-1"></i>Excluir
                          </button>
                          <button
                            onClick={() => setConfirmDeleteIndex(null)}
                            className="flex-1 py-2 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-[#9CA3AF] transition-all cursor-pointer whitespace-nowrap"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Linha normal */
                      <div
                        className="flex items-center justify-between py-2 px-3 bg-[#16122A] rounded-lg border border-white/5 group hover:border-white/10 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${color}20` }}
                          >
                            <i className="ri-calendar-check-line text-xs" style={{ color }}></i>
                          </div>
                          <p className="text-sm text-[#F9FAFB]">{formatMonth(c.month)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold" style={{ color }}>
                            {formatCurrency(c.value)}
                          </p>
                          {/* Botões aparecem no hover */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => startEdit(c)}
                              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 transition-all cursor-pointer"
                              title="Editar lançamento"
                            >
                              <i className="ri-edit-line text-xs text-[#9CA3AF] hover:text-[#F9FAFB]"></i>
                            </button>
                            <button
                              onClick={() => { setConfirmDeleteIndex(c._idx); setEditingIndex(null); }}
                              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#EF4444]/20 transition-all cursor-pointer"
                              title="Excluir lançamento"
                            >
                              <i className="ri-delete-bin-line text-xs text-[#9CA3AF] hover:text-[#EF4444]"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dados do resgate */}
          {isEncerrado && resgateData && (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-[#F9FAFB] mb-3 flex items-center gap-2">
                <i className="ri-hand-coin-line text-[#EF4444]"></i> Dados do Resgate
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-[#9CA3AF]">Data do Resgate</p>
                  <p className="font-semibold text-[#F9FAFB]">{formatDate(resgateData.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF]">Valor Resgatado</p>
                  <p className="font-semibold text-[#22C55E]">{formatCurrency(resgateData.value)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF]">Motivo</p>
                  <p className="font-semibold text-[#F9FAFB]">{resgateData.reason}</p>
                </div>
                {resgateData.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-[#9CA3AF]">Observações</p>
                    <p className="font-medium text-[#F9FAFB]">{resgateData.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observações gerais */}
          {investment.notes && !investment.notes.startsWith('[') && (
            <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
              <p className="text-xs text-[#9CA3AF] mb-1">📝 Observações</p>
              <p className="text-sm text-[#F9FAFB]">
                {investment.notes.replace(/\[(PREVIDENCIA|CAPITALIZACAO|CONSORCIO|CONTRIB|RESGATE|RENT_VALUE|RENT)\](\{.*?\}|[-\d.]+)\n?/g, '').trim() || '-'}
              </p>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex flex-col gap-2 pt-1">
            {isLongTerm && !isEncerrado && (
              <div className="flex gap-2">
                <button
                  onClick={() => { onClose(); onLancarParcela?.(); }}
                  className="flex-1 py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(to right, #22C55E, #16A34A)' }}
                >
                  <i className="ri-add-circle-line text-base"></i> Lançar
                </button>
                <button
                  onClick={() => { onClose(); onResgatar?.(); }}
                  className="flex-1 py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(to right, #EF4444, #DC2626)' }}
                >
                  <i className="ri-hand-coin-line text-base"></i> Resgatar
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { onClose(); onEditar?.(); }}
                className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap transition-all"
                style={{ backgroundColor: `${color}20`, color }}
              >
                <i className="ri-edit-line text-base"></i> Editar
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-[#F9FAFB] rounded-xl font-medium text-sm cursor-pointer whitespace-nowrap transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
