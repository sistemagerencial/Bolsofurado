import { useState, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useRevenues } from '../../hooks/useRevenues';
import { useExpenses } from '../../hooks/useExpenses';
import { useBudgets } from '../../hooks/useBudgets';
import { useCategories } from '../../hooks/useCategories';
import { useInvestments } from '../../hooks/useInvestments';
import { useDividends } from '../../hooks/useDividends';

export default function RelatoriosPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [whatsappModal, setWhatsappModal] = useState(false);
  const [whatsappMsg, setWhatsappMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { revenues, loading: loadingRevenues } = useRevenues();
  const { expenses, loading: loadingExpenses } = useExpenses();
  const { budgets, loading: loadingBudgets } = useBudgets();
  const { categories } = useCategories();
  const { investments, loading: loadingInvestments } = useInvestments();
  const { getTotalDividendsByInvestment, getTotalThisMonth, getTotalThisYear } = useDividends();

  const loading = loadingRevenues || loadingExpenses || loadingBudgets || loadingInvestments;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthNamesFull = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const availableMonths =
    selectedYear < currentYear
      ? Array.from({ length: 12 }, (_, i) => i)
      : selectedYear === currentYear
      ? Array.from({ length: currentMonth + 1 }, (_, i) => i)
      : Array.from({ length: 12 }, (_, i) => i);

  const getMonthlyData = () => {
    return availableMonths.map((m) => {
      const yearStr = String(selectedYear);
      const monthStr = String(m + 1).padStart(2, '0');
      const prefix = `${yearStr}-${monthStr}`;

      const monthRevenues = revenues.filter((r) => {
        const d = r.date ? String(r.date).substring(0, 7) : '';
        return d === prefix;
      });
      const monthExpenses = expenses.filter((e) => {
        const d = e.date ? String(e.date).substring(0, 7) : '';
        return d === prefix;
      });

      const totalRev = monthRevenues.reduce((s, r) => s + Number(r.amount), 0);
      const totalExp = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
      const saldo = totalRev - totalExp;
      const economia = totalRev > 0 ? ((totalRev - totalExp) / totalRev) * 100 : 0;

      return {
        month: m,
        label: monthNames[m],
        labelFull: monthNamesFull[m],
        totalRev,
        totalExp,
        saldo,
        economia,
      };
    });
  };

  const monthlyData = getMonthlyData();

  const totalRevYear = monthlyData.reduce((s, d) => s + d.totalRev, 0);
  const totalExpYear = monthlyData.reduce((s, d) => s + d.totalExp, 0);
  const saldoYear = totalRevYear - totalExpYear;
  const economiaYear = totalRevYear > 0 ? ((totalRevYear - totalExpYear) / totalRevYear) * 100 : 0;

  const getCategoriaData = () => {
    const yearStr = String(selectedYear);
    const yearExpenses = expenses.filter((e) => e.date && String(e.date).startsWith(yearStr));
    const map = new Map<string, { categoria: string; valor: number; cor: string }>();
    yearExpenses.forEach((exp) => {
      const cat = categories.find((c) => c.id === exp.category_id);
      const key = cat?.id || 'sem-cat';
      const cur =
        map.get(key) ||
        ({
          categoria: cat?.name || 'Sem categoria',
          valor: 0,
          cor: cat?.color || '#7C3AED',
        } as const);
      cur.valor += Number(exp.amount);
      map.set(key, cur);
    });
    const arr = Array.from(map.values()).sort((a, b) => b.valor - a.valor);
    const total = arr.reduce((s, i) => s + i.valor, 0);
    return arr.map((i) => ({
      ...i,
      percentual: total > 0 ? (i.valor / total) * 100 : 0,
    }));
  };

  const categoriaData = getCategoriaData();

  // ── RANKING: agrupado por CATEGORIA (não por descrição) ──
  const getRankingData = () => {
    const yearStr = String(selectedYear);
    const yearExpenses = expenses.filter((e) => e.date && String(e.date).startsWith(yearStr));
    const map = new Map<string, { item: string; valor: number; cor: string }>();
    yearExpenses.forEach((exp) => {
      const cat = categories.find((c) => c.id === exp.category_id);
      const key = cat?.id || 'sem-cat';
      const cur =
        map.get(key) ||
        ({
          item: cat?.name || 'Sem categoria',
          valor: 0,
          cor: cat?.color || '#7C3AED',
        } as const);
      cur.valor += Number(exp.amount);
      map.set(key, cur);
    });
    return Array.from(map.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);
  };

  const rankingData = getRankingData();

  const getReceitaCategoriaData = () => {
    const yearStr = String(selectedYear);
    const yearRevenues = revenues.filter((r) => r.date && String(r.date).startsWith(yearStr));
    const map = new Map<string, { categoria: string; valor: number; cor: string }>();
    yearRevenues.forEach((rev) => {
      const cat = categories.find((c) => c.id === rev.category_id);
      const key = cat?.id || 'sem-cat';
      const cur =
        map.get(key) ||
        ({
          categoria: cat?.name || 'Sem categoria',
          valor: 0,
          cor: cat?.color || '#22C55E',
        } as const);
      cur.valor += Number(rev.amount);
      map.set(key, cur);
    });
    const arr = Array.from(map.values()).sort((a, b) => b.valor - a.valor);
    const total = arr.reduce((s, i) => s + i.valor, 0);
    return arr.map((i) => ({
      ...i,
      percentual: total > 0 ? (i.valor / total) * 100 : 0,
    }));
  };

  const receitaCatData = getReceitaCategoriaData();

  const getSaldoAcumulado = () => {
    let acc = 0;
    return monthlyData.map((d) => {
      acc += d.saldo;
      return { ...d, acumulado: acc };
    });
  };

  const saldoAcumulado = getSaldoAcumulado();

  const maxBarValue = Math.max(...monthlyData.map((d) => Math.max(d.totalRev, d.totalExp)), 1);
  const maxAcumulado = Math.max(...saldoAcumulado.map((d) => Math.abs(d.acumulado)), 1);

  const getGoalsManagementData = () => {
    const yearBudgets = budgets.filter((b) => b.year === selectedYear);
    const categoryMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        categoryColor: string;
        months: Array<{
          month: number;
          monthName: string;
          budget: number;
          spent: number;
          difference: number;
          percentage: number;
          status: string;
          statusColor: string;
        }>;
      }
    >();

    yearBudgets.forEach((budget) => {
      const cat = categories.find((c) => c.id === budget.category_id);
      if (!cat) return;

      const monthIndex = budget.month - 1;
      const yearStr = String(selectedYear);
      const monthStr = String(budget.month).padStart(2, '0');
      const monthPrefix = `${yearStr}-${monthStr}`;

      const monthExpenses = expenses.filter((e) => {
        const expDate = e.date ? String(e.date).substring(0, 7) : '';
        return expDate === monthPrefix && e.category_id === budget.category_id;
      });
      const spent = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);

      const budgetAmount = Number(budget.amount);
      const difference = budgetAmount - spent;
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

      let status = '';
      let statusColor = '';
      if (percentage <= 70) {
        status = 'Ótimo';
        statusColor = '#22C55E';
      } else if (percentage <= 85) {
        status = 'Bom';
        statusColor = '#84CC16';
      } else if (percentage <= 100) {
        status = 'Atenção';
        statusColor = '#F59E0B';
      } else if (percentage <= 120) {
        status = 'Crítico';
        statusColor = '#EF4444';
      } else {
        status = 'Estourado';
        statusColor = '#DC2626';
      }

      if (!categoryMap.has(cat.id)) {
        categoryMap.set(cat.id, {
          categoryId: cat.id,
          categoryName: cat.name,
          categoryColor: cat.color || '#7C3AED',
          months: [],
        });
      }

      categoryMap.get(cat.id)!.months.push({
        month: monthIndex,
        monthName: monthNamesFull[monthIndex],
        budget: budgetAmount,
        spent,
        difference,
        percentage,
        status,
        statusColor,
      });
    });

    categoryMap.forEach((cat) => {
      cat.months.sort((a, b) => a.month - b.month);
    });

    return Array.from(categoryMap.values());
  };

  const goalsData = getGoalsManagementData();

  const getGoalsSummary = () => {
    let totalMonthsWithGoals = 0;
    let monthsWithinBudget = 0;
    let monthsOverBudget = 0;
    let totalBudget = 0;
    let totalSpent = 0;

    const categoryPerformance = new Map<
      string,
      { name: string; withinBudget: number; overBudget: number }
    >();

    goalsData.forEach((cat) => {
      cat.months.forEach((m) => {
        totalMonthsWithGoals++;
        totalBudget += m.budget;
        totalSpent += m.spent;

        if (m.percentage <= 100) {
          monthsWithinBudget++;
        } else {
          monthsOverBudget++;
        }

        if (!categoryPerformance.has(cat.categoryId)) {
          categoryPerformance.set(cat.categoryId, {
            name: cat.categoryName,
            withinBudget: 0,
            overBudget: 0,
          });
        }

        const perf = categoryPerformance.get(cat.categoryId)!;
        if (m.percentage <= 100) {
          perf.withinBudget++;
        } else {
          perf.overBudget++;
        }
      });
    });

    const perfArray = Array.from(categoryPerformance.values());
    const bestCategory =
      perfArray.reduce(
        (best, curr) => {
          const bestRate = best.withinBudget / (best.withinBudget + best.overBudget);
          const currRate = curr.withinBudget / (curr.withinBudget + curr.overBudget);
          return currRate > bestRate ? curr : best;
        },
        perfArray[0] || { name: '-', withinBudget: 0, overBudget: 0 }
      ).name || '-';

    const worstCategory =
      perfArray.reduce(
        (worst, curr) => {
          const worstRate = worst.withinBudget / (worst.withinBudget + worst.overBudget);
          const currRate = curr.withinBudget / (curr.withinBudget + curr.overBudget);
          return currRate < worstRate ? curr : worst;
        },
        perfArray[0] || { name: '-', withinBudget: 0, overBudget: 0 }
      ).name || '-';

    return {
      totalMonthsWithGoals,
      monthsWithinBudget,
      monthsOverBudget,
      totalBudget,
      totalSpent,
      totalDifference: totalBudget - totalSpent,
      bestCategory,
      worstCategory,
    };
  };

  const goalsSummary = getGoalsSummary();

  const getGoalsChartData = () => {
    return goalsData
      .map((cat) => {
        const totalBudget = cat.months.reduce((s, m) => s + m.budget, 0);
        const totalSpent = cat.months.reduce((s, m) => s + m.spent, 0);
        return {
          categoryName: cat.categoryName,
          categoryColor: cat.categoryColor,
          totalBudget,
          totalSpent,
          percentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  };

  const goalsChartData = getGoalsChartData();
  const maxGoalsValue = Math.max(...goalsChartData.flatMap((d) => [d.totalBudget, d.totalSpent]), 1);

  // ── Função auxiliar para extrair dados extras de investimentos ──
  const getInvestmentExtraData = (investment: any) => {
    if (!investment.notes) return null;

    if (investment.type === 'Previdência Privada') {
      const match = investment.notes.match(/\[PREVIDENCIA\]({.*?})/);
      if (match) {
        try {
          return JSON.parse(match[1]);
        } catch {
          return null;
        }
      }
    } else if (investment.type === 'Capitalização') {
      const match = investment.notes.match(/\[CAPITALIZACAO\]({.*?})/);
      if (match) {
        try {
          return JSON.parse(match[1]);
        } catch {
          return null;
        }
      }
    } else if (investment.type === 'Consórcio') {
      const match = investment.notes.match(/\[CONSORCIO\]({.*?})/);
      if (match) {
        try {
          return JSON.parse(match[1]);
        } catch {
          return null;
        }
      }
    }
    return null;
  };

  // ── Processar investimentos com dados extras ──
  const processedInvestments = investments.map((inv) => {
    const extraData = getInvestmentExtraData(inv);
    const isLongTerm = ['Previdência Privada', 'Capitalização', 'Consórcio'].includes(inv.type);

    let profit = 0;
    let profitability = 0;
    let currentPosition = 0;

    if (isLongTerm) {
      // Para tipos de longo prazo, o lucro vem do campo [RENT_VALUE] nas notas
      if (inv.notes) {
        const match = inv.notes.match(/\[RENT_VALUE\]([-\d.]+)/);
        if (match) {
          const rentValue = parseFloat(match[1]);
          profit = Math.round(rentValue * 100) / 100;
          const invested = inv.amount || 0;
          profitability = invested > 0 ? Math.round((rentValue / invested) * 100 * 100) / 100 : 0;
          currentPosition = Math.round(((inv.amount || 0) + rentValue) * 100) / 100;
        } else {
          profit = 0;
          profitability = 0;
          currentPosition = inv.amount || 0;
        }
      } else {
        profit = 0;
        profitability = 0;
        currentPosition = inv.amount || 0;
      }
    } else {
      const averageCost = inv.average_cost || inv.entry_price || 0;
      const currentPrice = inv.current_value || 0;
      const quantity = inv.quantity || 0;

      if (quantity > 0 && averageCost > 0 && currentPrice > 0) {
        profit = Math.round(quantity * (currentPrice - averageCost) * 100) / 100;
      } else {
        const invested = inv.amount || 0;
        if (averageCost > 0 && currentPrice > 0) {
          profit = Math.round(invested * ((currentPrice - averageCost) / averageCost) * 100) / 100;
        } else {
          profit = Math.round((currentPrice - (inv.amount || 0)) * 100) / 100;
        }
      }

      if (averageCost > 0 && currentPrice > 0) {
        profitability = Math.round(((currentPrice - averageCost) / averageCost) * 100 * 100) / 100;
      } else {
        const invested = inv.amount || 0;
        if (invested > 0) {
          profitability = Math.round(((currentPrice - invested) / invested) * 100 * 100) / 100;
        }
      }

      if (quantity > 0 && currentPrice > 0) {
        currentPosition = Math.round(quantity * currentPrice * 100) / 100;
      } else {
        currentPosition = inv.amount || 0;
      }
    }

    return {
      ...inv,
      profit,
      profitability,
      currentPosition,
      invested: inv.amount || 0,
      status: profit >= 0 ? 'positive' : 'negative',
      extraData,
    };
  });

  // ── Agrupar investimentos por tipo ──
  const groupedInvestments: Record<string, typeof processedInvestments> = {};
  processedInvestments.forEach((inv) => {
    const type = inv.type || 'Outros';
    if (!groupedInvestments[type]) groupedInvestments[type] = [];
    groupedInvestments[type].push(inv);
  });

  // ── Calcular totais de investimentos ──
  const totalInvested = processedInvestments.reduce((sum, inv) => sum + inv.invested, 0);
  const totalProfitInvestments = processedInvestments.reduce((sum, inv) => sum + inv.profit, 0);
  const totalProfitabilityInvestments = totalInvested > 0
    ? ((totalProfitInvestments / totalInvested) * 100).toFixed(2)
    : '0.00';

  // ── Calcular resumo mensal de contribuições ──
  const getMonthlyContributionsSummary = () => {
    const previdenciaAssets = processedInvestments.filter((inv) => inv.type === 'Previdência Privada');
    const capitalizacaoAssets = processedInvestments.filter((inv) => inv.type === 'Capitalização');
    const consorcioAssets = processedInvestments.filter((inv) => inv.type === 'Consórcio');

    const totalPrevidenciaMensal = previdenciaAssets.reduce((sum, inv) => {
      const extra = inv.extraData;
      return sum + (extra?.monthlyContribution || 0);
    }, 0);

    const totalCapitalizacaoMensal = capitalizacaoAssets.reduce((sum, inv) => {
      const extra = inv.extraData;
      return sum + (extra?.monthlyPayment || 0);
    }, 0);

    const totalConsorcioMensal = consorcioAssets.reduce((sum, inv) => {
      const extra = inv.extraData;
      if (extra?.totalValue && extra?.termMonths && extra.termMonths > 0) {
        return sum + extra.totalValue / extra.termMonths;
      }
      return sum;
    }, 0);

    const totalMensal = totalPrevidenciaMensal + totalCapitalizacaoMensal + totalConsorcioMensal;

    return {
      previdencia: { total: totalPrevidenciaMensal, count: previdenciaAssets.length },
      capitalizacao: { total: totalCapitalizacaoMensal, count: capitalizacaoAssets.length },
      consorcio: { total: totalConsorcioMensal, count: consorcioAssets.length },
      totalMensal,
      totalAnual: totalMensal * 12,
      hasData: totalMensal > 0,
    };
  };

  const monthlyContributions = getMonthlyContributionsSummary();

  // ── EXPORTAR PDF ──
  const handlePrintPdf = () => {
    setExportingPdf(true);
    setTimeout(() => {
      window.print();
      setExportingPdf(false);
    }, 300);
  };

  // ── EXPORTAR EXCEL (CSV) ──
  const handleExportExcel = () => {
    setExportingExcel(true);
    try {
      const rows: string[][] = [];
      rows.push([`Relatório Financeiro ${selectedYear}`]);
      rows.push([]);
      rows.push(['RESUMO ANUAL']);
      rows.push(['Métrica', 'Valor']);
      rows.push(['Total Receitas', formatCurrency(totalRevYear)]);
      rows.push(['Total Despesas', formatCurrency(totalExpYear)]);
      rows.push(['Saldo', formatCurrency(saldoYear)]);
      rows.push(['Taxa de Economia', `${economiaYear.toFixed(1)}%`]);
      rows.push([]);
      // ── SEÇÃO DE INVESTIMENTOS ──
      rows.push(['RESUMO DE INVESTIMENTOS']);
      rows.push(['Total Investido', formatCurrency(totalInvested)]);
      rows.push(['Rentabilidade Total', `${totalProfitabilityInvestments}%`]);
      rows.push(['Lucro/Prejuízo', formatCurrency(totalProfitInvestments)]);
      rows.push([]);

      // ── DISTRIBUIÇÃO POR TIPO DE INVESTIMENTO ──
      rows.push(['DISTRIBUIÇÃO POR TIPO DE INVESTIMENTO']);
      rows.push(['Tipo', 'Quantidade', 'Investido', 'Rentabilidade %', 'Lucro/Prejuízo']);
      Object.keys(groupedInvestments).forEach((type) => {
        const assets = groupedInvestments[type];
        const typeInvested = assets.reduce((sum, a) => sum + a.invested, 0);
        const typeProfit = assets.reduce((sum, a) => sum + a.profit, 0);
        const typeProfitability = typeInvested > 0 ? (typeProfit / typeInvested) * 100 : 0;
        rows.push([
          type,
          String(assets.length),
          formatCurrency(typeInvested),
          `${typeProfitability.toFixed(2)}%`,
          formatCurrency(typeProfit),
        ]);
      });
      rows.push([]);

      // ── RESUMO MENSAL DE CONTRIBUIÇÕES ──
      if (monthlyContributions.hasData) {
        rows.push(['📅 Resumo Mensal de Contribuições']);
        rows.push(['Tipo', 'Valor Mensal', 'Valor Anual']);
        if (monthlyContributions.previdencia.count > 0) {
          rows.push([
            '🛡️ Previdência Privada',
            formatCurrency(monthlyContributions.previdencia.total),
            formatCurrency(monthlyContributions.previdencia.total * 12),
          ]);
        }
        if (monthlyContributions.capitalizacao.count > 0) {
          rows.push([
            '🪙 Capitalização',
            formatCurrency(monthlyContributions.capitalizacao.total),
            formatCurrency(monthlyContributions.capitalizacao.total * 12),
          ]);
        }
        if (monthlyContributions.consorcio.count > 0) {
          rows.push([
            '🤝 Consórcio',
            formatCurrency(monthlyContributions.consorcio.total),
            formatCurrency(monthlyContributions.consorcio.total * 12),
          ]);
        }
        rows.push([
          '📊 Total de Compromissos Mensais',
          formatCurrency(monthlyContributions.totalMensal),
          formatCurrency(monthlyContributions.totalAnual),
        ]);
      }

      const csvContent = rows.map((r) => r.map((cell) => `"${cell}"`).join(';')).join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-financeiro-${selectedYear}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Excel exportado com sucesso!');
    } catch {
      showToast('Erro ao exportar Excel.');
    } finally {
      setExportingExcel(false);
    }
  };

  // ── WHATSAPP: abre modal com mensagem ──
  const handleWhatsApp = () => {
    const mesesComDados = monthlyData.filter((d) => d.totalRev > 0 || d.totalExp > 0);
    const linhasMeses = mesesComDados
      .map(
        (d) =>
          `📅 *${d.labelFull}*: Receita ${formatCurrency(d.totalRev)} | Despesa ${formatCurrency(
            d.totalExp
          )} | Saldo ${formatCurrency(d.saldo)}`
      )
      .join('\n');

    const topCat = categoriaData
      .slice(0, 3)
      .map(
        (c, i) => `${i + 1}. ${c.categoria}: ${formatCurrency(c.valor)} (${c.percentual.toFixed(1)}%)`
      )
      .join('\n');

    const topRanking = rankingData
      .slice(0, 3)
      .map((r, i) => `${i + 1}. ${r.item}: ${formatCurrency(r.valor)}`)
      .join('\n');

    const metasInfo =
      goalsSummary.totalMonthsWithGoals > 0
        ? `\n🎯 *Gestão de Metas*\n✅ Dentro da meta: ${goalsSummary.monthsWithinBudget} meses\n❌ Estourados: ${goalsSummary.monthsOverBudget} meses\n🏆 Melhor: ${goalsSummary.bestCategory}\n⚠️ Atenção: ${goalsSummary.worstCategory}\n`
        : '';

    // ── ADICIONAR INFORMAÇÕES DE INVESTIMENTOS ──
    let investmentInfo = '';
    if (processedInvestments.length > 0) {
      investmentInfo = `\n💼 *Investimentos*\n💰 Total Investido: ${formatCurrency(totalInvested)}\n📈 Rentabilidade: ${totalProfitabilityInvestments}%\n💵 Lucro/Prejuízo: ${formatCurrency(totalProfitInvestments)}\n`;

      const topTypes = Object.keys(groupedInvestments)
        .map((type) => ({
          type,
          invested: groupedInvestments[type].reduce((s, a) => s + a.invested, 0),
          profit: groupedInvestments[type].reduce((s, a) => s + a.profit, 0),
        }))
        .sort((a, b) => b.invested - a.invested)
        .slice(0, 3);

      if (topTypes.length > 0) {
        investmentInfo += `\n📊 *Top Tipos de Investimento*\n`;
        topTypes.forEach((t, i) => {
          const profitability = t.invested > 0 ? (t.profit / t.invested) * 100 : 0;
          investmentInfo += `${i + 1}. ${t.type}: ${formatCurrency(t.invested)} (${profitability >= 0 ? '+' : ''}${profitability.toFixed(
            2
          )}%)\n`;
        });
      }

      const previdenciaAssets = processedInvestments.filter((inv) => inv.type === 'Previdência Privada');
      if (previdenciaAssets.length > 0) {
        const totalPrevidencia = previdenciaAssets.reduce((s, a) => s + a.invested, 0);
        const profitPrevidencia = previdenciaAssets.reduce((s, a) => s + a.profit, 0);
        investmentInfo += `\n🛡️ *Previdência Privada*\nInvestido: ${formatCurrency(totalPrevidencia)}\nLucro/Prejuízo: ${formatCurrency(
          profitPrevidencia
        )}\nAtivos: ${previdenciaAssets.length}\n`;
      }

      const capitalizacaoAssets = processedInvestments.filter((inv) => inv.type === 'Capitalização');
      if (capitalizacaoAssets.length > 0) {
        const totalCapitalizacao = capitalizacaoAssets.reduce((s, a) => s + a.invested, 0);
        const profitCapitalizacao = capitalizacaoAssets.reduce((s, a) => s + a.profit, 0);
        investmentInfo += `\n🪙 *Capitalização*\nInvestido: ${formatCurrency(totalCapitalizacao)}\nLucro/Prejuízo: ${formatCurrency(
          profitCapitalizacao
        )}\nAtivos: ${capitalizacaoAssets.length}\n`;
      }
    }

    const msg =
      `💰 *Resumo Financeiro ${selectedYear}*\n\n📊 *Totais do Ano*\n✅ Receitas: ${formatCurrency(
        totalRevYear
      )}\n❌ Despesas: ${formatCurrency(totalExpYear)}\n💵 Saldo: ${formatCurrency(
        saldoYear
      )}\n📈 Economia: ${economiaYear.toFixed(1)}%\n` +
      investmentInfo +
      (linhasMeses ? `\n📆 *Evolução Mensal*\n${linhasMeses}\n` : '') +
      (topCat ? `\n🏷️ *Top Categorias de Despesa*\n${topCat}\n` : '') +
      (topRanking ? `\n🏆 *Ranking de Gastos*\n${topRanking}\n` : '') +
      metasInfo +
      `\n_Gerado pelo Bolso Furado_`;

    setWhatsappMsg(msg);
    setWhatsappModal(true);
    setCopied(false);
  };

  const handleCopyWhatsapp = () => {
    navigator.clipboard.writeText(whatsappMsg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSendWhatsapp = () => {
    const encoded = encodeURIComponent(whatsappMsg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#9CA3AF]">Carregando relatórios...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 lg:top-16 z-50 bg-[#22C55E] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          <i className="ri-checkbox-circle-line mr-2"></i>
          {toastMsg}
        </div>
      )}

      {/* Modal WhatsApp */}
      {whatsappModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center bg-[#25D366]/20 rounded-xl">
                  <i className="ri-whatsapp-line text-xl text-[#25D366]"></i>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F9FAFB]">Compartilhar via WhatsApp</h3>
                  <p className="text-xs text-[#9CA3AF]">Copie ou envie diretamente</p>
                </div>
              </div>
              <button
                onClick={() => setWhatsappModal(false)}
                className="w-8 h-8 flex items-center justify-center text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors cursor-pointer rounded-lg hover:bg-white/5"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="p-5">
              <div className="bg-[#0E0B16] rounded-xl border border-white/5 p-4 max-h-64 overflow-y-auto mb-4">
                <pre className="text-xs text-[#D1D5DB] whitespace-pre-wrap font-sans leading-relaxed">{whatsappMsg}</pre>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopyWhatsapp}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-[#F9FAFB] py-3 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
                >
                  <i className={`${copied ? 'ri-checkbox-circle-line' : 'ri-file-copy-line'} text-base`}></i>
                  {copied ? 'Copiado!' : 'Copiar mensagem'}
                </button>
                <button
                  onClick={handleSendWhatsapp}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] py-3 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-whatsapp-line text-base"></i>
                  Abrir WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        ref={printRef}
        className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6 lg:space-y-8 print:p-4 print:space-y-4"
      >
        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F9FAFB]">Relatórios Financeiros</h1>
            <p className="text-sm text-[#9CA3AF] mt-1">Visão completa das suas finanças</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 print:hidden">
            <div className="flex items-center gap-1 bg-[#16122A] border border-white/10 rounded-xl px-3 py-2">
              <button
                onClick={() => setSelectedYear((y) => y - 1)}
                className="w-6 h-6 flex items-center justify-center text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors cursor-pointer"
              >
                <i className="ri-arrow-left-s-line text-lg"></i>
              </button>
              <span className="text-sm font-bold text-[#F9FAFB] px-2 min-w-[48px] text-center">{selectedYear}</span>
              <button
                onClick={() => setSelectedYear((y) => y + 1)}
                className="w-6 h-6 flex items-center justify-center text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors cursor-pointer"
              >
                <i className="ri-arrow-right-s-line text-lg"></i>
              </button>
            </div>

            <button
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="flex items-center gap-2 bg-[#16122A] border border-white/10 hover:border-[#22C55E]/50 hover:bg-[#22C55E]/10 text-[#22C55E] px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-file-excel-2-line text-base"></i>
              <span className="hidden sm:inline">{exportingExcel ? 'Exportando...' : 'Excel'}</span>
            </button>

            <button
              onClick={handlePrintPdf}
              disabled={exportingPdf}
              className="flex items-center gap-2 bg-[#16122A] border border-white/10 hover:border-[#EC4899]/50 hover:bg-[#EC4899]/10 text-[#EC4899] px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-file-pdf-2-line text-base"></i>
              <span className="hidden sm:inline">{exportingPdf ? 'Gerando...' : 'PDF'}</span>
            </button>

            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 text-[#25D366] px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-whatsapp-line text-base"></i>
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          </div>
        </div>

        {/* ── CARDS RESUMO ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[
            {
              label: 'Total Receitas',
              value: totalRevYear,
              icon: 'ri-arrow-up-circle-line',
              color: '#22C55E',
              bg: 'from-[#22C55E]/20 to-[#22C55E]/5',
            },
            {
              label: 'Total Despesas',
              value: totalExpYear,
              icon: 'ri-arrow-down-circle-line',
              color: '#EF4444',
              bg: 'from-[#EF4444]/20 to-[#EF4444]/5',
            },
            {
              label: 'Saldo do Ano',
              value: saldoYear,
              icon: 'ri-wallet-3-line',
              color: saldoYear >= 0 ? '#22C55E' : '#EF4444',
              bg: saldoYear >= 0 ? 'from-[#22C55E]/20 to-[#22C55E]/5' : 'from-[#EF4444]/20 to-[#EF4444]/5',
            },
            {
              label: 'Taxa de Economia',
              value: null,
              icon: 'ri-percent-line',
              color: '#7C3AED',
              bg: 'from-[#7C3AED]/20 to-[#7C3AED]/5',
              extra: `${economiaYear.toFixed(1)}%`,
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`bg-gradient-to-br ${card.bg} bg-[#16122A] rounded-xl p-4 border border-white/5`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <i className={`${card.icon} text-xl`} style={{ color: card.color }}></i>
                </div>
                <span className="text-xs text-[#9CA3AF]">{card.label}</span>
              </div>
              <p className="text-lg sm:text-xl font-bold" style={{ color: card.color }}>
                {card.extra ?? formatCurrency(card.value!)}
              </p>
            </div>
          ))}
        </div>

        {/* ── SEÇÃO DE INVESTIMENTOS ── */}
        {processedInvestments.length > 0 && (
          <section className="bg-[#16122A] rounded-2xl p-5 sm:p-6 border border-white/5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#F9FAFB]">💼 Resumo de Investimentos</h2>
                <p className="text-xs text-[#9CA3AF]">Visão geral da carteira</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
                <p className="text-xs text-[#9CA3AF] mb-1">💰 Total Investido</p>
                <p className="text-2xl font-bold text-[#F9FAFB]">{formatCurrency(totalInvested)}</p>
              </div>
              <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
                <p className="text-xs text-[#9CA3AF] mb-1">📈 Rentabilidade</p>
                <p
                  className={`text-2xl font-bold ${
                    parseFloat(totalProfitabilityInvestments) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                  }`}
                >
                  {totalProfitabilityInvestments}%
                </p>
              </div>
              <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
                <p className="text-xs text-[#9CA3AF] mb-1">💵 Lucro/Prejuízo</p>
                <p
                  className={`text-2xl font-bold ${
                    totalProfitInvestments >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                  }`}
                >
                  {formatCurrency(totalProfitInvestments)}
                </p>
              </div>
            </div>

            {/* ── RESUMO MENSAL DE CONTRIBUIÇÕES ── */}
            {monthlyContributions.hasData && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-calendar-line text-[#F59E0B] text-base"></i>
                  </div>
                  <h3 className="text-sm font-bold text-[#F9FAFB]">📅 Resumo Mensal de Contribuições</h3>
                </div>
                <div className="bg-[#0E0B16] rounded-xl border border-white/5 overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
                    {monthlyContributions.previdencia.count > 0 && (
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 flex items-center justify-center bg-[#7C3AED]/20 rounded-lg">
                            <i className="ri-shield-check-line text-[#7C3AED] text-sm"></i>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#F9FAFB]">Previdência Privada</p>
                            <p className="text-[10px] text-[#9CA3AF]">
                              {monthlyContributions.previdencia.count} plano
                              {monthlyContributions.previdencia.count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-[#7C3AED]">
                          {formatCurrency(monthlyContributions.previdencia.total)}
                          <span className="text-xs font-normal text-[#9CA3AF]">/mês</span>
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">
                          {formatCurrency(monthlyContributions.previdencia.total * 12)}/ano
                        </p>
                      </div>
                    )}
                    {monthlyContributions.capitalizacao.count > 0 && (
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 flex items-center justify-center bg-[#22C55E]/20 rounded-lg">
                            <i className="ri-coin-line text-[#22C55E] text-sm"></i>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#F9FAFB]">Capitalização</p>
                            <p className="text-[10px] text-[#9CA3AF]">
                              {monthlyContributions.capitalizacao.count} título
                              {monthlyContributions.capitalizacao.count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-[#22C55E]">
                          {formatCurrency(monthlyContributions.capitalizacao.total)}
                          <span className="text-xs font-normal text-[#9CA3AF]">/mês</span>
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">
                          {formatCurrency(monthlyContributions.capitalizacao.total * 12)}/ano
                        </p>
                      </div>
                    )}
                    {monthlyContributions.consorcio.count > 0 && (
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 flex items-center justify-center bg-amber-500/20 rounded-lg">
                            <i className="ri-group-line text-amber-500 text-sm"></i>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#F9FAFB]">Consórcio</p>
                            <p className="text-[10px] text-[#9CA3AF]">
                              {monthlyContributions.consorcio.count} cota
                              {monthlyContributions.consorcio.count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-amber-500">
                          {formatCurrency(monthlyContributions.consorcio.total)}
                          <span className="text-xs font-normal text-[#9CA3AF]">/mês</span>
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">
                          {formatCurrency(monthlyContributions.consorcio.total * 12)}/ano
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-white/5 px-4 py-3 flex items-center justify-between bg-white/2">
                    <div className="flex items-center gap-2">
                      <i className="ri-money-cny-circle-line text-[#F59E0B] text-base"></i>
                      <span className="text-sm font-bold text-[#F9FAFB]">Total de Compromissos Mensais</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#F59E0B]">
                        {formatCurrency(monthlyContributions.totalMensal)}
                        <span className="text-xs font-normal text-[#9CA3AF]">/mês</span>
                      </p>
                      <p className="text-xs text-[#9CA3AF]">{formatCurrency(monthlyContributions.totalAnual)}/ano</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#F9FAFB]">Distribuição por Tipo</h3>
              {Object.keys(groupedInvestments).map((type) => {
                const assets = groupedInvestments[type];
                const typeInvested = assets.reduce((sum, a) => sum + a.invested, 0);
                const typeProfit = assets.reduce((sum, a) => sum + a.profit, 0);
                const typeProfitability = typeInvested > 0 ? (typeProfit / typeInvested) * 100 : 0;
                const typePercentage = totalInvested > 0 ? (typeInvested / totalInvested) * 100 : 0;

                return (
                  <div key={type} className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-[#F9FAFB]">{type}</span>
                          <span className="text-xs text-[#9CA3AF]">
                            ({assets.length} ativo{assets.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-[#9CA3AF]">
                            Investido:{' '}
                            <span className="text-[#F9FAFB] font-medium">{formatCurrency(typeInvested)}</span>
                          </span>
                          <span
                            className={`font-bold ${typeProfitability >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}
                          >
                            {typeProfitability >= 0 ? '+' : ''}
                            {typeProfitability.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${
                            typeProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                          }`}
                        >
                          {typeProfit >= 0 ? '+' : ''}
                          {formatCurrency(typeProfit)}
                        </p>
                        <p className="text-xs text-[#9CA3AF]">{typePercentage.toFixed(1)}% da carteira</p>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          typeProfitability >= 0 ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                        }`}
                        style={{ width: `${typePercentage}%` }}
                      ></div>
                    </div>

                    {/* Details for each specific type */}
                    {type === 'Previdência Privada' && assets.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-xs font-bold text-[#7C3AED] mb-2">🛡️ Detalhamento</p>
                        <div className="space-y-2">
                          {assets.map((asset) => {
                            const extraData = asset.extraData || {};
                            return (
                              <div key={asset.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[#F9FAFB]">{asset.name}</span>
                                  {extraData.planType && (
                                    <span className="px-2 py-0.5 bg-[#7C3AED]/20 text-[#7C3AED] rounded text-xs font-medium">
                                      {extraData.planType}
                                    </span>
                                  )}
                                  {extraData.taxRegime && (
                                    <span className="px-2 py-0.5 bg-[#EC4899]/20 text-[#EC4899] rounded text-xs font-medium">
                                      {extraData.taxRegime}
                                    </span>
                                  )}
                                  {extraData.monthlyContribution > 0 && (
                                    <span className="px-2 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] rounded text-xs font-medium">
                                      {formatCurrency(extraData.monthlyContribution)}/mês
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`font-bold ${asset.profitability >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}
                                >
                                  {asset.profitability >= 0 ? '+' : ''}
                                  {asset.profitability.toFixed(2)}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {type === 'Capitalização' && assets.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-xs font-bold text-[#22C55E] mb-2">🪙 Detalhamento</p>
                        <div className="space-y-2">
                          {assets.map((asset) => {
                            const extraData = asset.extraData || {};
                            return (
                              <div key={asset.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[#F9FAFB]">{asset.name}</span>
                                  {extraData.institution && (
                                    <span className="px-2 py-0.5 bg-[#22C55E]/20 text-[#22C55E] rounded text-xs font-medium">
                                      {extraData.institution}
                                    </span>
                                  )}
                                  {extraData.monthlyPayment > 0 && (
                                    <span className="px-2 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] rounded text-xs font-medium">
                                      {formatCurrency(extraData.monthlyPayment)}/mês
                                    </span>
                                  )}
                                  {extraData.termMonths > 0 && (
                                    <span className="px-2 py-0.5 bg-white/10 text-[#9CA3AF] rounded text-xs">
                                      {extraData.termMonths} meses
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`font-bold ${asset.profitability >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}
                                >
                                  {asset.profitability >= 0 ? '+' : ''}
                                  {asset.profitability.toFixed(2)}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {type === 'Consórcio' && assets.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-xs font-bold text-amber-500 mb-2">🤝 Detalhamento</p>
                        <div className="space-y-2">
                          {assets.map((asset) => {
                            const extraData = asset.extraData || {};
                            const parcelaMensal =
                              extraData.totalValue > 0 && extraData.termMonths > 0
                                ? extraData.totalValue / extraData.termMonths
                                : 0;
                            return (
                              <div key={asset.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[#F9FAFB]">{asset.name}</span>
                                  {extraData.administrator && (
                                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded text-xs font-medium">
                                      {extraData.administrator}
                                    </span>
                                  )}
                                  {parcelaMensal > 0 && (
                                    <span className="px-2 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] rounded text-xs font-medium">
                                      {formatCurrency(parcelaMensal)}/mês
                                    </span>
                                  )}
                                  {extraData.termMonths > 0 && (
                                    <span className="px-2 py-0.5 bg-white/10 text-[#9CA3AF] rounded text-xs">
                                      {extraData.termMonths} meses
                                    </span>
                                  )}
                                  {extraData.totalValue > 0 && (
                                    <span className="px-2 py-0.5 bg-white/10 text-[#9CA3AF] rounded text-xs">
                                      Total: {formatCurrency(extraData.totalValue)}
                                    </span>
                                  )}
                                </div>
                                <span className="font-bold text-amber-500">
                                  {formatCurrency(asset.invested)} pago
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── GRÁFICO RECEITAS VS DESPESAS ── */}
        <section className="bg-[#16122A] rounded-2xl p-5 sm:p-6 border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F9FAFB]">Receitas vs Despesas</h2>
              <p className="text-xs text-[#9CA3AF]">Comparativo mensal — {selectedYear}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#22C55E]"></div>
                <span className="text-xs text-[#9CA3AF]">Receitas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#EF4444]"></div>
                <span className="text-xs text-[#9CA3AF]">Despesas</span>
              </div>
            </div>
          </div>

          {monthlyData.every((d) => d.totalRev === 0 && d.totalExp === 0) ? (
            <div className="text-center py-10 text-[#9CA3AF]">
              <i className="ri-bar-chart-2-line text-4xl mb-2 block opacity-30"></i>
              Nenhum dado para {selectedYear}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex items-end gap-2 sm:gap-3 h-52 min-w-[480px]">
                {monthlyData.map((d) => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-0.5 w-full h-40">
                      <div
                        className="flex-1 bg-gradient-to-t from-[#22C55E] to-[#22C55E]/50 rounded-t-md transition-all hover:opacity-80 cursor-pointer"
                        style={{
                          height: `${(d.totalRev / maxBarValue) * 100}%`,
                          minHeight: d.totalRev > 0 ? '4px' : '0',
                        }}
                        title={`Receita: ${formatCurrency(d.totalRev)}`}
                      ></div>
                      <div
                        className="flex-1 bg-gradient-to-t from-[#EF4444] to-[#EF4444]/50 rounded-t-md transition-all hover:opacity-80 cursor-pointer"
                        style={{
                          height: `${(d.totalExp / maxBarValue) * 100}%`,
                          minHeight: d.totalExp > 0 ? '4px' : '0',
                        }}
                        title={`Despesa: ${formatCurrency(d.totalExp)}`}
                      ></div>
                    </div>
                    <span className="text-[10px] text-[#9CA3AF] font-medium">{d.label}</span>
                    <span className={`text-[9px] font-bold ${d.saldo >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      {d.saldo >= 0 ? '+' : ''}
                      {formatCurrency(d.saldo)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── SALDO ACUMULADO ── */}
        <section className="bg-[#16122A] rounded-2xl p-5 sm:p-6 border border-white/5">
          <div className="mb-5">
            <h2 className="text-base sm:text-lg font-bold text-[#F9FAFB]">Saldo Acumulado</h2>
            <p className="text-xs text-[#9CA3AF]">Evolução do patrimônio ao longo do ano</p>
          </div>

          {saldoAcumulado.every((d) => d.acumulado === 0) ? (
            <div className="text-center py-10 text-[#9CA3AF]">
              <i className="ri-line-chart-line text-4xl mb-2 block opacity-30"></i>
              Nenhum dado para {selectedYear}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex items-end gap-2 sm:gap-3 h-44 min-w-[480px]">
                {saldoAcumulado.map((d) => {
                  const isPos = d.acumulado >= 0;
                  const h = `${(Math.abs(d.acumulado) / maxAcumulado) * 100}%`;
                  return (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="flex items-end justify-center w-full h-36">
                        <div
                          className={`w-full rounded-t-md transition-all hover:opacity-80 cursor-pointer ${
                            isPos
                              ? 'bg-gradient-to-t from-[#7C3AED] to-[#7C3AED]/50'
                              : 'bg-gradient-to-t from-[#EF4444] to-[#EF4444]/50'
                          }`}
                          style={{ height: h, minHeight: '4px' }}
                          title={`Acumulado: ${formatCurrency(d.acumulado)}`}
                        ></div>
                      </div>
                      <span className="text-[10px] text-[#9CA3AF] font-medium">{d.label}</span>
                      <span className={`text-[9px] font-bold ${isPos ? 'text-[#7C3AED]' : 'text-[#EF4444]'}`}>
                        {formatCurrency(d.acumulado)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── CATEGORIAS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <section className="bg-[#16122A] rounded-2xl p-5 sm:p-6 border border-white/5">
            <div className="mb-5">
              <h2 className="text-base sm:text-lg font-bold text-[#F9FAFB]">Despesas por Categoria</h2>
              <p className="text-xs text-[#9CA3AF]">Distribuição anual — {selectedYear}</p>
            </div>
            {categoriaData.length === 0 ? (
              <div className="text-center py-8 text-[#9CA3AF]">
                <i className="ri-pie-chart-line text-4xl mb-2 block opacity-30"></i>
                Sem despesas registradas
              </div>
            ) : (
              <div className="space-y-3">
                {categoriaData.map((item) => (
                  <div key={item.categoria} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.cor }}></div>
                        <span className="text-sm text-[#F9FAFB] font-medium truncate max-w-[140px]">{item.categoria}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#9CA3AF]">{item.percentual.toFixed(1)}%</span>
                        <span className="text-sm font-bold text-[#F9FAFB]">{formatCurrency(item.valor)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${item.percentual}%`, backgroundColor: item.cor }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-[#16122A] rounded-2xl p-5 sm:p-6 border border-white/5">
            <div className="mb-5">
              <h2 className="text-base sm:text-lg font-bold text-[#F9FAFB]">Receitas por Categoria</h2>
              <p className="text-xs text-[#9CA3AF]">Distribuição anual — {selectedYear}</p>
            </div>
            {receitaCatData.length === 0 ? (
              <div className="text-center py-8 text-[#9CA3AF]">
                <i className="ri-pie-chart-line text-4xl mb-2 block opacity-30"></i>
                Sem receitas registradas
              </div>
            ) : (
              <div className="space-y-3">
                {receitaCatData.map((item) => (
                  <div key={item.categoria} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.cor }}></div>
                        <span className="text-sm text-[#F9FAFB] font-medium truncate max-w-[140px]">{item.categoria}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#9CA3AF]">{item.percentual.toFixed(1)}%</span>
                        <span className="text-sm font-bold text-[#F9FAFB]">{formatCurrency(item.valor)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${item.percentual}%`, backgroundColor: item.cor }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── TAXA DE ECONOMIA MENSAL ── */}
        <section className="bg-[#16122A] rounded-2xl p-5 sm:p-6 border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F9FAFB]">Taxa de Economia Mensal</h2>
              <p className="text-xs text-[#9CA3AF]">% economizado por mês — {selectedYear}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#9CA3AF]">Média do ano</p>
              <p className={`text-lg font-bold ${economiaYear >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {economiaYear.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="flex gap-3 min-w-[480px] pb-2">
              {monthlyData.map((d) => {
                const eco = d.economia;
                const status =
                  eco >= 20
                    ? { label: 'Ótimo', color: '#22C55E' }
                    : eco >= 10
                    ? { label: 'Bom', color: '#84CC16' }
                    : eco > 0
                    ? { label: 'Atenção', color: '#F59E0B' }
                    : { label: 'Crítico', color: '#EF4444' };
                const isCurrentMonth = d.month === currentMonth && selectedYear === currentYear;
                const radius = 28;
                const circ = 2 * Math.PI * radius;
                const pct = Math.max(0, Math.min(100, eco));
                const dash = (pct / 100) * circ;

                return (
                  <div
                    key={d.month}
                    className={`flex-1 min-w-[80px] bg-[#0E0B16] rounded-xl p-3 border transition-all ${
                      isCurrentMonth ? 'border-[#22C55E]/50' : 'border-white/5'
                    }`}
                  >
                    <p className="text-[10px] text-[#9CA3AF] text-center mb-2 font-medium">{d.label}</p>
                    <div className="flex justify-center mb-2">
                      <svg width="68" height="68" viewBox="0 0 68 68">
                        <circle cx="34" cy="34" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                        <circle
                          cx="34"
                          cy="34"
                          r={radius}
                          fill="none"
                          stroke={status.color}
                          strokeWidth="6"
                          strokeDasharray={`${dash} ${circ}`}
                          strokeLinecap="round"
                          transform="rotate(-90 34 34)"
                        />
                        <text x="34" y="38" textAnchor="middle" fill={status.color} fontSize="11" fontWeight="bold">
                          {d.totalRev > 0 ? `${eco.toFixed(0)}%` : '-'}
                        </text>
                      </svg>
                    </div>
                    <div className="text-center">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${status.color}20`, color: status.color }}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── GESTÃO DE METAS POR CATEGORIA ── */}
        {goalsData.length > 0 && (
          <>
            <section className="bg-[#16122A] rounded-2xl p-5 sm:p-6 border border-white/5">
              <div className="mb-5">
                <h2 className="text-base sm:text-lg font-bold text-[#F9FAFB]">Gestão de Metas por Categoria</h2>
                <p className="text-xs text-[#9CA3AF]">Comparativo de metas vs gastos reais — {selectedYear}</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                  {
                    label: 'Meses com Metas',
                    value: goalsSummary.totalMonthsWithGoals,
                    icon: 'ri-calendar-check-line',
                    color: '#7C3AED',
                    isNum: true,
                  },
                  {
                    label: 'Dentro da Meta',
                    value: goalsSummary.monthsWithinBudget,
                    icon: 'ri-checkbox-circle-line',
                    color: '#22C55E',
                    isNum: true,
                  },
                  {
                    label: 'Estourados',
                    value: goalsSummary.monthsOverBudget,
                    icon: 'ri-close-circle-line',
                    color: '#EF4444',
                    isNum: true,
                  },
                  {
                    label: 'Diferença Total',
                    value: goalsSummary.totalDifference,
                    icon: 'ri-wallet-line',
                    color: '#F59E0B',
                    isNum: false,
                  },
                ].map((card) => (
                  <div key={card.label} className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <i className={`${card.icon} text-lg`} style={{ color: card.color }}></i>
                      </div>
                      <span className="text-xs text-[#9CA3AF]">{card.label}</span>
                    </div>
                    <p
                      className="text-xl font-bold"
                      style={{ color: card.isNum ? '#F9FAFB' : card.value >= 0 ? '#22C55E' : '#EF4444' }}
                    >
                      {card.isNum ? card.value : formatCurrency(card.value)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="bg-gradient-to-br from-[#22C55E]/10 to-[#22C55E]/5 rounded-xl p-4 border border-[#22C55E]/20">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="ri-trophy-line text-lg text-[#22C55E]"></i>
                    <span className="text-xs text-[#9CA3AF]">Melhor Desempenho</span>
                  </div>
                  <p className="text-base font-bold text-[#22C55E]">{goalsSummary.bestCategory}</p>
                </div>
                <div className="bg-gradient-to-br from-[#EF4444]/10 to-[#EF4444]/5 rounded-xl p-4 border border-[#EF4444]/20">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="ri-alert-line text-lg text-[#EF4444]"></i>
                    <span className="text-xs text-[#9CA3AF]">Precisa Atenção</span>
                  </div>
                  <p className="text-base font-bold text-[#EF4444]">{goalsSummary.worstCategory}</p>
                </div>
              </div>

              <div className="mb-2">
                <h3 className="text-sm font-bold text-[#F9FAFB] mb-4">Comparativo Anual por Categoria</h3>
                <div className="space-y-4">
                  {goalsChartData.map((item) => (
                    <div key={item.categoryName} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.categoryColor }}></div>
                          <span className="text-sm font-medium text-[#F9FAFB]">{item.categoryName}</span>
                        </div>
                        <span
                          className={`text-xs font-bold ${item.percentage <= 100 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}
                        >
                          {item.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#9CA3AF]">Meta</span>
                          <span className="text-[#F9FAFB] font-medium">{formatCurrency(item.totalBudget)}</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(item.totalBudget / maxGoalsValue) * 100}%`,
                              backgroundColor: `${item.categoryColor}40`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#9CA3AF]">Gasto</span>
                          <span className={`font-medium ${item.percentage <= 100 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                            {formatCurrency(item.totalSpent)}
                          </span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(item.totalSpent / maxGoalsValue) * 100}%`,
                              backgroundColor: item.categoryColor,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="space-y-4">
              {goalsData.map((cat) => (
                <section key={cat.categoryId} className="bg-[#16122A] rounded-2xl p-5 sm:p-6 border border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.categoryColor }}></div>
                    <h3 className="text-base font-bold text-[#F9FAFB]">{cat.categoryName}</h3>
                    <span className="text-xs text-[#9CA3AF]">
                      ({cat.months.length} {cat.months.length === 1 ? 'mês' : 'meses'})
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="text-left text-xs text-[#9CA3AF] font-medium pb-3 pr-4">Mês</th>
                          <th className="text-right text-xs text-[#9CA3AF] font-medium pb-3 px-4">Meta</th>
                          <th className="text-right text-xs text-[#9CA3AF] font-medium pb-3 px-4">Gasto</th>
                          <th className="text-right text-xs text-[#9CA3AF] font-medium pb-3 px-4">Diferença</th>
                          <th className="text-right text-xs text-[#9CA3AF] font-medium pb-3 px-4">%</th>
                          <th className="text-right text-xs text-[#9CA3AF] font-medium pb-3 pl-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.months.map((m) => (
                          <tr key={m.month} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                            <td className="py-3 pr-4 text-sm font-medium text-[#F9FAFB]">{m.monthName}</td>
                            <td className="py-3 px-4 text-right text-sm text-[#9CA3AF]">{formatCurrency(m.budget)}</td>
                            <td className="py-3 px-4 text-right text-sm font-medium text-[#F9FAFB]">{formatCurrency(m.spent)}</td>
                            <td
                              className={`py-3 px-4 text-right text-sm font-bold ${
                                m.difference >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                              }`}
                            >
                              {m.difference >= 0 ? '+' : ''}
                              {formatCurrency(m.difference)}
                            </td>
                            <td className="py-3 px-4 text-right text-sm font-bold" style={{ color: m.statusColor }}>
                              {m.percentage.toFixed(0)}%
                            </td>
                            <td className="py-3 pl-4 text-right">
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: `${m.statusColor}20`, color: m.statusColor }}
                              >
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-white/10">
                          <td className="pt-3 pr-4 text-sm font-bold text-[#F9FAFB]">Total</td>
                          <td className="pt-3 px-4 text-right text-sm font-bold text-[#9CA3AF]">
                            {formatCurrency(cat.months.reduce((s, m) => s + m.budget, 0))}
                          </td>
                          <td className="pt-3 px-4 text-right text-sm font-bold text-[#F9FAFB]">
                            {formatCurrency(cat.months.reduce((s, m) => s + m.spent, 0))}
                          </td>
                          <td
                            className={`pt-3 px-4 text-right text-sm font-bold ${
                              cat.months.reduce((s, m) => s + m.difference, 0) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                            }`}
                          >
                            {cat.months.reduce((s, m) => s + m.difference, 0) >= 0 ? '+' : ''}
                            {formatCurrency(cat.months.reduce((s, m) => s + m.difference, 0))}
                          </td>
                          <td className="pt-3 px-4 text-right text-sm font-bold" style={{ color: cat.categoryColor }}>
                            {(
                              (cat.months.reduce((s, m) => s + m.spent, 0) /
                                cat.months.reduce((s, m) => s + m.budget, 0)) *
                              100
                            ).toFixed(0)}
                            %
                          </td>
                          <td className="pt-3 pl-4 text-right">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                cat.months.reduce((s, m) => s + m.difference, 0) >= 0
                                  ? 'bg-[#22C55E]/20 text-[#22C55E]'
                                  : 'bg-[#EF4444]/20 text-[#EF4444]'
                              }`}
                            >
                              {cat.months.reduce((s, m) => s + m.difference, 0) >= 0 ? 'OK' : 'Estourado'}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          </>
        )}

        {/* ── RANKING DE DESPESAS POR CATEGORIA ── */}
        <section className="bg-[#16122A] rounded-2xl p-5 sm:p-6 border border-white/5">
          <div className="mb-5">
            <h2 className="text-base sm:text-lg font-bold text-[#F9FAFB]">Ranking de Despesas por Categoria</h2>
            <p className="text-xs text-[#9CA3AF]">Top categorias com maior gasto no ano — {selectedYear}</p>
          </div>

          {rankingData.length === 0 ? (
            <div className="text-center py-8 text-[#9CA3AF]">
              <i className="ri-trophy-line text-4xl mb-2 block opacity-30"></i>
              Sem despesas registradas
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rankingData.map((item, index) => {
                const medalColors = ['#F59E0B', '#9CA3AF', '#CD7F32'];
                const medalColor = index < 3 ? medalColors[index] : item.cor;
                const totalRanking = rankingData.reduce((s, r) => s + r.valor, 0);
                const pct = totalRanking > 0 ? (item.valor / totalRanking) * 100 : 0;

                return (
                  <div key={item.item} className="bg-[#0E0B16] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: `${medalColor}20`, color: medalColor }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.cor }}></div>
                        <p className="text-sm font-medium text-[#F9FAFB] truncate">{item.item}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#F9FAFB]">{formatCurrency(item.valor)}</p>
                        <p className="text-xs text-[#9CA3AF]">{pct.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.cor }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── TABELA DETALHADA MENSAL ── */}
        <section className="bg-[#16122A] rounded-2xl p-5 sm:p-6 border border-white/5">
          <div className="mb-5">
            <h2 className="text-base sm:text-lg font-bold text-[#F9FAFB]">Detalhamento Mensal</h2>
            <p className="text-xs text-[#9CA3AF]">Resumo completo mês a mês — {selectedYear}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs text-[#9CA3AF] font-medium pb-3 pr-4">Mês</th>
                  <th className="text-right text-xs text-[#9CA3AF] font-medium pb-3 px-4">Receitas</th>
                  <th className="text-right text-xs text-[#9CA3AF] font-medium pb-3 px-4">Despesas</th>
                  <th className="text-right text-xs text-[#9CA3AF] font-medium pb-3 px-4">Saldo</th>
                  <th className="text-right text-xs text-[#9CA3AF] font-medium pb-3 pl-4">Economia</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((d) => (
                  <tr
                    key={d.month}
                    className={`border-b border-white/5 hover:bg-white/2 transition-colors ${
                      d.month === currentMonth && selectedYear === currentYear ? 'bg-[#7C3AED]/5' : ''
                    }`}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {d.month === currentMonth && selectedYear === currentYear && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]"></div>
                        )}
                        <span className="text-sm font-medium text-[#F9FAFB]">{d.labelFull}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-[#22C55E] font-medium">{formatCurrency(d.totalRev)}</td>
                    <td className="py-3 px-4 text-right text-sm text-[#EF4444] font-medium">{formatCurrency(d.totalExp)}</td>
                    <td
                      className={`py-3 px-4 text-right text-sm font-bold ${d.saldo >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}
                    >
                      {d.saldo >= 0 ? '+' : ''}
                      {formatCurrency(d.saldo)}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          d.economia >= 20
                            ? 'bg-[#22C55E]/20 text-[#22C55E]'
                            : d.economia >= 10
                            ? 'bg-[#84CC16]/20 text-[#84CC16]'
                            : d.economia > 0
                            ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                            : 'bg-[#EF4444]/20 text-[#EF4444]'
                        }`}
                      >
                        {d.totalRev > 0 ? `${d.economia.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10">
                  <td className="pt-3 pr-4 text-sm font-bold text-[#F9FAFB]">Total {selectedYear}</td>
                  <td className="pt-3 px-4 text-right text-sm font-bold text-[#22C55E]">{formatCurrency(totalRevYear)}</td>
                  <td className="pt-3 px-4 text-right text-sm font-bold text-[#EF4444]">{formatCurrency(totalExpYear)}</td>
                  <td
                    className={`pt-3 px-4 text-right text-sm font-bold ${
                      saldoYear >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                    }`}
                  >
                    {saldoYear >= 0 ? '+' : ''}
                    {formatCurrency(saldoYear)}
                  </td>
                  <td className="pt-3 pl-4 text-right">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        economiaYear >= 20
                          ? 'bg-[#22C55E]/20 text-[#22C55E]'
                          : economiaYear >= 10
                          ? 'bg-[#84CC16]/20 text-[#84CC16]'
                          : economiaYear > 0
                          ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                          : 'bg-[#EF4444]/20 text-[#EF4444]'
                      }`}
                    >
                      {economiaYear.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print\\:hidden { display: none !important; }
          nav, aside, header { display: none !important; }
          .print\\:p-4 { padding: 1rem !important; }
          .print\\:space-y-4 > * + * { margin-top: 1rem !important; }
        }
      `}</style>
    </MainLayout>
  );
}
