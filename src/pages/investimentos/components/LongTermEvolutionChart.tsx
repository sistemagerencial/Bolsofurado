import { useState, useMemo } from 'react';
import type { Investment } from '../../../hooks/useInvestments';

interface LongTermEvolutionChartProps {
  investments: Investment[];
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const TYPE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  'Previdência Privada': { color: '#7C3AED', icon: 'ri-shield-check-line', label: 'Previdência' },
  'Capitalização': { color: '#22C55E', icon: 'ri-coin-line', label: 'Capitalização' },
  'Consórcio': { color: '#F59E0B', icon: 'ri-group-line', label: 'Consórcio' },
};

interface InvestmentData {
  investment: Investment;
  termMonths: number;
  startDate: Date;
  contributions: Array<{ month: string; value: number }>;
  totalAccumulated: number;
  avgMonthlyContrib: number;
}

function parseInvestmentData(inv: Investment): InvestmentData | null {
  if (!['Previdência Privada', 'Capitalização', 'Consórcio'].includes(inv.type)) return null;

  const notes = inv.notes || '';

  // Extrair prazo em meses
  let termMonths = 0;
  const previdMatch = notes.match(/\[PREVIDENCIA\](\{.*?\})/);
  const capMatch = notes.match(/\[CAPITALIZACAO\](\{.*?\})/);
  const consMatch = notes.match(/\[CONSORCIO\](\{.*?\})/);

  try {
    if (previdMatch) termMonths = JSON.parse(previdMatch[1]).termMonths || 0;
    else if (capMatch) termMonths = JSON.parse(capMatch[1]).termMonths || 0;
    else if (consMatch) termMonths = JSON.parse(consMatch[1]).termMonths || 0;
  } catch {
    termMonths = 0;
  }

  // Extrair contribuições
  const contribRegex = /\[CONTRIB\](\{.*?\})/g;
  const contribMatches = [...notes.matchAll(contribRegex)];
  const contributions: Array<{ month: string; value: number }> = [];
  contribMatches.forEach((m) => {
    try {
      const d = JSON.parse(m[1]);
      contributions.push({ month: d.month, value: d.value });
    } catch {
      // ignorar
    }
  });

  const totalAccumulated = inv.amount || 0;
  const avgMonthlyContrib =
    contributions.length > 0
      ? contributions.reduce((s, c) => s + c.value, 0) / contributions.length
      : 0;

  const startDate = inv.purchase_date ? new Date(inv.purchase_date) : new Date();

  return { investment: inv, termMonths, startDate, contributions, totalAccumulated, avgMonthlyContrib };
}

function buildEvolutionPoints(data: InvestmentData): Array<{ label: string; value: number; isProjection: boolean }> {
  const { contributions, startDate, termMonths, avgMonthlyContrib, totalAccumulated } = data;

  // Montar mapa de contribuições reais por mês
  const contribMap: Record<string, number> = {};
  contributions.forEach((c) => {
    contribMap[c.month] = (contribMap[c.month] || 0) + c.value;
  });

  const now = new Date();
  const points: Array<{ label: string; value: number; isProjection: boolean }> = [];

  // Calcular meses passados desde o início
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const monthsPassed = (nowYear - startYear) * 12 + (nowMonth - startMonth);

  // Meses totais a exibir: passados + futuros até o fim do prazo
  const totalMonthsToShow = Math.max(termMonths, monthsPassed + 1);

  let accumulated = 0;

  for (let i = 0; i <= totalMonthsToShow; i++) {
    const d = new Date(startYear, startMonth + i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const isPast = i <= monthsPassed;
    const isProjection = !isPast;

    if (isPast) {
      accumulated += contribMap[monthKey] || 0;
    } else {
      // Projeção: usa média das contribuições reais ou 0 se não houver
      accumulated += avgMonthlyContrib;
    }

    // Só adicionar pontos a cada 3 meses para não poluir o gráfico
    if (i % 3 === 0 || i === totalMonthsToShow) {
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      points.push({ label, value: accumulated, isProjection });
    }
  }

  // Ajustar o valor atual real (pode diferir da soma das contribuições)
  if (points.length > 0 && !points[points.length - 1].isProjection) {
    // Encontrar o último ponto real e ajustar para o saldo real
    const lastRealIdx = points.reduce((last, p, i) => (!p.isProjection ? i : last), -1);
    if (lastRealIdx >= 0) {
      const diff = totalAccumulated - points[lastRealIdx].value;
      // Ajustar todos os pontos reais proporcionalmente
      for (let i = 0; i <= lastRealIdx; i++) {
        points[i].value = Math.max(0, points[i].value + (diff * (i + 1)) / (lastRealIdx + 1));
      }
    }
  }

  return points;
}

function MiniLineChart({
  points,
  color,
  height = 120,
}: {
  points: Array<{ label: string; value: number; isProjection: boolean }>;
  color: string;
  height?: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (points.length < 2) return null;

  const maxVal = Math.max(...points.map((p) => p.value), 1);
  const minVal = 0;
  const range = maxVal - minVal;

  const width = 100;
  const padX = 2;
  const padY = 8;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const toX = (i: number) => padX + (i / (points.length - 1)) * chartW;
  const toY = (v: number) => padY + chartH - ((v - minVal) / range) * chartH;

  // Separar pontos reais e projeção
  const lastRealIdx = points.reduce((last, p, i) => (!p.isProjection ? i : last), -1);

  const realPoints = points.slice(0, lastRealIdx + 1);
  const projPoints = lastRealIdx >= 0 ? points.slice(lastRealIdx) : points;

  const buildPath = (pts: typeof points, startIdx: number) => {
    if (pts.length < 2) return '';
    return pts
      .map((p, i) => {
        const x = toX(startIdx + i);
        const y = toY(p.value);
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');
  };

  const buildArea = (pts: typeof points, startIdx: number) => {
    if (pts.length < 2) return '';
    const line = buildPath(pts, startIdx);
    const lastX = toX(startIdx + pts.length - 1);
    const firstX = toX(startIdx);
    return `${line} L ${lastX} ${padY + chartH} L ${firstX} ${padY + chartH} Z`;
  };

  const hovered = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id={`grad-real-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={`grad-proj-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Área real */}
        {realPoints.length >= 2 && (
          <path
            d={buildArea(realPoints, 0)}
            fill={`url(#grad-real-${color.replace('#', '')})`}
          />
        )}

        {/* Área projeção */}
        {projPoints.length >= 2 && (
          <path
            d={buildArea(projPoints, lastRealIdx >= 0 ? lastRealIdx : 0)}
            fill={`url(#grad-proj-${color.replace('#', '')})`}
          />
        )}

        {/* Linha real */}
        {realPoints.length >= 2 && (
          <path
            d={buildPath(realPoints, 0)}
            fill="none"
            stroke={color}
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Linha projeção (tracejada) */}
        {projPoints.length >= 2 && (
          <path
            d={buildPath(projPoints, lastRealIdx >= 0 ? lastRealIdx : 0)}
            fill="none"
            stroke={color}
            strokeWidth="0.8"
            strokeDasharray="2 1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
        )}

        {/* Pontos interativos */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={toX(i)}
            cy={toY(p.value)}
            r="1.5"
            fill={p.isProjection ? 'transparent' : color}
            stroke={color}
            strokeWidth="0.5"
            opacity={p.isProjection ? 0.4 : 1}
            className="cursor-pointer"
            onMouseEnter={() => setHoveredIdx(i)}
          />
        ))}

        {/* Tooltip */}
        {hovered && hoveredIdx !== null && (
          <>
            <line
              x1={toX(hoveredIdx)}
              y1={padY}
              x2={toX(hoveredIdx)}
              y2={padY + chartH}
              stroke={color}
              strokeWidth="0.4"
              strokeDasharray="1 1"
              opacity="0.5"
            />
          </>
        )}
      </svg>

      {/* Tooltip flutuante */}
      {hovered && hoveredIdx !== null && (
        <div
          className="absolute pointer-events-none z-10 px-2 py-1.5 rounded-lg text-xs font-medium shadow-lg border"
          style={{
            left: `${(hoveredIdx / (points.length - 1)) * 100}%`,
            top: 0,
            transform: 'translateX(-50%)',
            backgroundColor: '#16122A',
            borderColor: `${color}40`,
            color: '#F9FAFB',
            whiteSpace: 'nowrap',
          }}
        >
          <p style={{ color }} className="font-bold">{formatCurrency(hovered.value)}</p>
          <p className="text-[#9CA3AF] text-[10px]">
            {hovered.label} {hovered.isProjection ? '(projeção)' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

export default function LongTermEvolutionChart({ investments }: LongTermEvolutionChartProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const longTermInvestments = useMemo(
    () =>
      investments
        .filter((inv) => ['Previdência Privada', 'Capitalização', 'Consórcio'].includes(inv.type))
        .map(parseInvestmentData)
        .filter((d): d is InvestmentData => d !== null),
    [investments]
  );

  if (longTermInvestments.length === 0) return null;

  const selected = selectedId
    ? longTermInvestments.find((d) => d.investment.id === selectedId) || longTermInvestments[0]
    : longTermInvestments[0];

  const points = buildEvolutionPoints(selected);
  const cfg = TYPE_CONFIG[selected.investment.type] || TYPE_CONFIG['Previdência Privada'];

  // Calcular projeção final
  const lastPoint = points[points.length - 1];
  const projectedFinal = lastPoint?.value || 0;
  const currentReal = selected.totalAccumulated;
  const termMonths = selected.termMonths;
  const now = new Date();
  const start = selected.startDate;
  const monthsPassed = Math.max(
    0,
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  );
  const monthsRemaining = Math.max(0, termMonths - monthsPassed);
  const progressPct = termMonths > 0 ? Math.min(100, (monthsPassed / termMonths) * 100) : 0;

  return (
    <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
      {/* Título */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center">
          <i className="ri-line-chart-line text-[#7C3AED] text-xl"></i>
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#F9FAFB]">📈 Evolução & Projeção</h3>
          <p className="text-xs text-[#9CA3AF]">Previdência · Capitalização · Consórcio</p>
        </div>
      </div>

      {/* Seletor de investimento */}
      <div className="flex gap-2 flex-wrap mb-5">
        {longTermInvestments.map((d) => {
          const c = TYPE_CONFIG[d.investment.type] || TYPE_CONFIG['Previdência Privada'];
          const isActive = (selectedId || longTermInvestments[0].investment.id) === d.investment.id;
          return (
            <button
              key={d.investment.id}
              onClick={() => setSelectedId(d.investment.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap border"
              style={{
                backgroundColor: isActive ? `${c.color}20` : 'transparent',
                borderColor: isActive ? `${c.color}50` : 'rgba(255,255,255,0.08)',
                color: isActive ? c.color : '#9CA3AF',
              }}
            >
              <i className={c.icon}></i>
              <span>{d.investment.name}</span>
            </button>
          );
        })}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-[#0E0B16] rounded-xl p-3 border border-white/5">
          <p className="text-xs text-[#9CA3AF] mb-1">Acumulado Atual</p>
          <p className="text-base font-bold" style={{ color: cfg.color }}>
            {formatCurrency(currentReal)}
          </p>
        </div>
        <div className="bg-[#0E0B16] rounded-xl p-3 border border-white/5">
          <p className="text-xs text-[#9CA3AF] mb-1">Projeção Final</p>
          <p className="text-base font-bold text-[#F9FAFB]">
            {formatCurrency(projectedFinal)}
          </p>
          {selected.avgMonthlyContrib > 0 && (
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">
              ≈ {formatCurrency(selected.avgMonthlyContrib)}/mês
            </p>
          )}
        </div>
        <div className="bg-[#0E0B16] rounded-xl p-3 border border-white/5">
          <p className="text-xs text-[#9CA3AF] mb-1">Meses Restantes</p>
          <p className="text-base font-bold text-[#F9FAFB]">
            {monthsRemaining > 0 ? monthsRemaining : '—'}
          </p>
          {monthsRemaining > 0 && (
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">
              {(monthsRemaining / 12).toFixed(1)} anos
            </p>
          )}
        </div>
        <div className="bg-[#0E0B16] rounded-xl p-3 border border-white/5">
          <p className="text-xs text-[#9CA3AF] mb-1">Aportes Lançados</p>
          <p className="text-base font-bold text-[#F9FAFB]">
            {selected.contributions.length}
          </p>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">parcelas</p>
        </div>
      </div>

      {/* Barra de progresso do prazo */}
      {termMonths > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-[#9CA3AF]">Progresso do prazo</p>
            <p className="text-xs font-semibold" style={{ color: cfg.color }}>
              {progressPct.toFixed(0)}% — {monthsPassed}/{termMonths} meses
            </p>
          </div>
          <div className="h-2 bg-[#0E0B16] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(to right, ${cfg.color}, ${cfg.color}99)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Gráfico */}
      {points.length >= 2 ? (
        <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[#9CA3AF]">Evolução do saldo acumulado</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded" style={{ backgroundColor: cfg.color }}></div>
                <span className="text-[10px] text-[#9CA3AF]">Real</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-4 h-0.5 rounded"
                  style={{
                    backgroundColor: cfg.color,
                    opacity: 0.5,
                    backgroundImage: `repeating-linear-gradient(to right, ${cfg.color} 0, ${cfg.color} 3px, transparent 3px, transparent 6px)`,
                  }}
                ></div>
                <span className="text-[10px] text-[#9CA3AF]">Projeção</span>
              </div>
            </div>
          </div>

          <MiniLineChart points={points} color={cfg.color} height={140} />

          {/* Eixo X — labels */}
          <div className="flex justify-between mt-1">
            {[points[0], points[Math.floor(points.length / 2)], points[points.length - 1]].map(
              (p, i) => (
                <span key={i} className="text-[10px] text-[#9CA3AF]">
                  {p?.label}
                </span>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#0E0B16] rounded-xl p-6 border border-white/5 text-center">
          <i className="ri-bar-chart-2-line text-3xl text-[#9CA3AF] mb-2 block"></i>
          <p className="text-sm text-[#9CA3AF]">
            Lance a primeira parcela para visualizar a evolução
          </p>
        </div>
      )}

      {/* Projeção detalhada */}
      {selected.avgMonthlyContrib > 0 && monthsRemaining > 0 && (
        <div
          className="mt-4 rounded-xl p-4 border"
          style={{ backgroundColor: `${cfg.color}08`, borderColor: `${cfg.color}25` }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${cfg.color}20` }}
            >
              <i className="ri-magic-line text-sm" style={{ color: cfg.color }}></i>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F9FAFB] mb-1">
                Projeção baseada nos seus aportes
              </p>
              <p className="text-xs text-[#9CA3AF]">
                Mantendo a média de{' '}
                <span className="font-semibold" style={{ color: cfg.color }}>
                  {formatCurrency(selected.avgMonthlyContrib)}/mês
                </span>
                , você acumulará{' '}
                <span className="font-semibold text-[#F9FAFB]">
                  {formatCurrency(projectedFinal)}
                </span>{' '}
                ao final dos {termMonths} meses.
              </p>
            </div>
          </div>
        </div>
      )}

      {selected.avgMonthlyContrib === 0 && (
        <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <i className="ri-information-line text-amber-500 text-lg"></i>
            <p className="text-xs text-[#9CA3AF]">
              Lance parcelas mensais para ativar a projeção automática de quanto você vai acumular até o fim do prazo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
