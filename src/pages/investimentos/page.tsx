import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useInvestments } from '../../hooks/useInvestments';
import { useTrades } from '../../hooks/useTrades';
import { useDividends } from '../../hooks/useDividends';
import type { Trade } from '../../hooks/useTrades';
import type { Investment } from '../../hooks/useInvestments';
import AssetSearchInput from './components/AssetSearchInput';
import UpdatePricesModal from './components/UpdatePricesModal';
import PriceAlertModal from '../../components/investments/PriceAlertModal';
import PriceHistoryModal from '../../components/investments/PriceHistoryModal';
import { DividendModal } from '../../components/investments/DividendModal';
import { DividendHistoryModal } from '../../components/investments/DividendHistoryModal';
import { usePriceAlerts } from '../../hooks/usePriceAlerts';
import { ContributionModal } from '../../components/investments/ContributionModal';
import ResgateModal from '../../components/investments/ResgateModal';
import LongTermEvolutionChart from './components/LongTermEvolutionChart';
import InvestmentDetailModal from '../../components/investments/InvestmentDetailModal';

// ── helpers (definidos fora do componente para evitar "used before init") ──
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
};

// Arredonda para 2 casas decimais para evitar erros de ponto flutuante
const round2 = (val: number) => Math.round(val * 100) / 100;

const calcProfit = (inv: any) => {
  if (['Previdência Privada', 'Capitalização', 'Consórcio'].includes(inv.type)) {
    if (inv.notes) {
      const match = inv.notes.match(/\[RENT_VALUE\]([-\d.]+)/);
      if (match) return round2(parseFloat(match[1]));
    }
    return 0;
  }

  const quantity = inv.quantity || 0;
  const averageCost = inv.average_cost || inv.entry_price || 0;
  const currentPrice = inv.current_value || 0;
  
  if (quantity > 0 && averageCost > 0 && currentPrice > 0) {
    return round2(quantity * (currentPrice - averageCost));
  }
  
  const invested = inv.amount || 0;
  if (averageCost > 0 && currentPrice > 0) {
    return round2(invested * (currentPrice - averageCost) / averageCost);
  }
  return round2(currentPrice - invested);
};

const calcProfitability = (inv: any) => {
  if (['Previdência Privada', 'Capitalização', 'Consórcio'].includes(inv.type)) {
    const invested = inv.amount || 0;
    if (invested <= 0) return 0;
    if (inv.notes) {
      const match = inv.notes.match(/\[RENT_VALUE\]([-\d.]+)/);
      if (match) {
        const rentVal = parseFloat(match[1]);
        return round2((rentVal / invested) * 100);
      }
    }
    return 0;
  }

  const averageCost = inv.average_cost || inv.entry_price || 0;
  const currentPrice = inv.current_value || 0;
  
  if (averageCost > 0 && currentPrice > 0) {
    return round2(((currentPrice - averageCost) / averageCost) * 100);
  }
  
  const invested = inv.amount || 0;
  if (invested > 0) {
    return round2(((currentPrice - invested) / invested) * 100);
  }
  return 0;
};

// Calcula o valor total da posição atual
const calcCurrentPosition = (inv: any) => {
  if (['Previdência Privada', 'Capitalização', 'Consórcio'].includes(inv.type)) {
    const saldo = inv.amount || 0;
    if (inv.notes) {
      const match = inv.notes.match(/\[RENT_VALUE\]([-\d.]+)/);
      if (match) return round2(saldo + parseFloat(match[1]));
    }
    return round2(saldo);
  }

  const quantity = inv.quantity || 0;
  const currentPrice = inv.current_value || 0;
  
  if (quantity > 0 && currentPrice > 0) {
    return round2(quantity * currentPrice);
  }
  
  return round2(inv.amount || 0);
};

export default function InvestimentosPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'trade'>('overview');
  const [showNewInvestmentModal, setShowNewInvestmentModal] = useState(false);
  const [showNewTradeModal, setShowNewTradeModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tradeResultType, setTradeResultType] = useState<'gain' | 'loss'>('gain');
  const [tradeOrderType, setTradeOrderType] = useState<'compra' | 'venda'>('compra');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [tradeMode, setTradeMode] = useState<'simplificado' | 'completo'>('simplificado');

  const [newTrade, setNewTrade] = useState({
    date: new Date().toISOString().split('T')[0],
    symbol: '',
    style: 'Day Trade',
    quantity: 0,
    price: 0,
    total: 0,
    notes: '',
  });

  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [showEditTradeModal, setShowEditTradeModal] = useState(false);
  const [editTradeMode, setEditTradeMode] = useState<'simplificado' | 'completo'>('simplificado');
  const [editTradeResultType, setEditTradeResultType] = useState<'gain' | 'loss'>('gain');
  const [editTradeOrderType, setEditTradeOrderType] = useState<'compra' | 'venda'>('compra');
  const [editTradeData, setEditTradeData] = useState({
    date: '',
    symbol: '',
    style: 'Day Trade',
    quantity: 0,
    price: 0,
    total: 0,
    notes: '',
  });
  const [confirmDeleteTrade, setConfirmDeleteTrade] = useState<Trade | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [showEditInvestmentModal, setShowEditInvestmentModal] = useState(false);
  const [editInvestmentData, setEditInvestmentData] = useState({
    type: '',
    name: '',
    code: '',
    quantity: 0,
    amount: 0,
    entry_price: 0,
    current_value: 0,
    purchase_date: '',
    notes: '',
  });
  const [confirmDeleteInvestment, setConfirmDeleteInvestment] = useState<Investment | null>(null);
  const [deletingInvestmentId, setDeletingInvestmentId] = useState<string | null>(null);

  const [showUpdatePricesModal, setShowUpdatePricesModal] = useState(false);
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const [priceUpdates, setPriceUpdates] = useState<Record<string, string>>({});

  const [newInvestment, setNewInvestment] = useState({
    type: 'Criptomoedas',
    name: '',
    code: '',
    quantity: 0,
    amount: 0,
    entry_price: 0,
    current_value: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Adicionar estados para campos extras de Previdência Privada e Capitalização
  const [previdenciaData, setPrevidenciaData] = useState({
    planType: 'PGBL', // PGBL ou VGBL
    taxRegime: 'Progressivo', // Progressivo ou Regressivo
    monthlyContribution: 0, // Contribuição mensal
    expectedReturn: 0, // Rendimento esperado % ao ano
    termMonths: 0, // Prazo em meses
  });

  const [capitalizacaoData, setCapitalizacaoData] = useState({
    institution: '', // Ex: Ourocap, CapFácil
    monthlyPayment: 0, // Mensalidade
    termMonths: 0, // Quantidade de meses
  });

  const [consorcioData, setConsorcioData] = useState({
    totalValue: 0, // Valor total do consórcio
    termMonths: 0, // Quantidade de meses
    administrator: '', // Administradora
  });

  const [editPrevidenciaData, setEditPrevidenciaData] = useState({
    planType: 'PGBL',
    taxRegime: 'Progressivo',
    monthlyContribution: 0,
    expectedReturn: 0,
    termMonths: 0,
  });

  const [editCapitalizacaoData, setEditCapitalizacaoData] = useState({
    institution: '',
    monthlyPayment: 0,
    termMonths: 0,
  });

  const [editConsorcioData, setEditConsorcioData] = useState({
    totalValue: 0,
    termMonths: 0,
    administrator: '',
  });

  // Adicionar estados para dados extras de edit
  const [editInvestmentExtraData, setEditInvestmentExtraData] = useState({
    planType: 'PGBL',
    taxRegime: 'Progressivo',
    institution: '',
  });

  const [editTradeExtraData, setEditTradeExtraData] = useState({
    planType: 'PGBL',
    taxRegime: 'Progressivo',
    institution: '',
  });

  

  const [newInvestmentExtraData, setNewInvestmentExtraData] = useState({
    planType: 'PGBL',
    taxRegime: 'Progressivo',
    institution: '',
  });

  const [newTradeExtraData, setNewTradeExtraData] = useState({
    planType: 'PGBL',
    taxRegime: 'Progressivo',
    institution: '',
  });

  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
  const [selectedAssetForAlert, setSelectedAssetForAlert] = useState<Investment | null>(null);
  const [triggeredAlerts, setTriggeredAlerts] = useState<Array<{
    id: string;
    name: string;
    variation: number;
    type: 'up' | 'down';
    threshold: number;
  }>>([]);

  const [showPriceHistoryModal, setShowPriceHistoryModal] = useState(false);
  const [selectedAssetForHistory, setSelectedAssetForHistory] = useState<Investment | null>(null);

  const [showDividendModal, setShowDividendModal] = useState(false);
  const [selectedAssetForDividend, setSelectedAssetForDividend] = useState<Investment | null>(null);
  const [showDividendHistoryModal, setShowDividendHistoryModal] = useState(false);
  const [editingDividend, setEditingDividend] = useState<any>(null);

  const [showExportMenu, setShowExportMenu] = useState(false);

  const { investments, loading: loadingInvestments, createInvestment, updateInvestment, deleteInvestment } = useInvestments();
  const { trades, loading: loadingTrades, createTrade, updateTrade, deleteTrade } = useTrades();
  const { alerts, saveAlert, getAlert, checkAlerts } = usePriceAlerts();
  const { 
    dividends, 
    addDividend, 
    updateDividend, 
    getTotalDividendsByInvestment,
    getTotalThisMonth,
    getTotalThisYear,
    getDividendsThisMonth,
    getDividendsThisYear
  } = useDividends();

  // Estado para o modal de detalhes
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvestmentForDetail, setSelectedInvestmentForDetail] = useState<any>(null);

  const openDetailModal = (asset: any) => {
    setSelectedInvestmentForDetail(asset);
    setShowDetailModal(true);
  };

  const openPriceAlertModal = (asset: Investment) => {
    setSelectedAssetForAlert(asset);
    setShowPriceAlertModal(true);
  };

  const handleSaveAlert = (alert: any) => {
    if (selectedAssetForAlert) {
      saveAlert(selectedAssetForAlert.id, alert);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  const dismissAlert = (alertId: string) => {
    setTriggeredAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  // ── Funções de Exportação ──
  const exportToCSV = () => {
    try {
      // Preparar dados da carteira
      const csvRows = [];
      
      // Cabeçalho
      csvRows.push([
        'Tipo',
        'Nome',
        'Código',
        'Quantidade',
        'Custo Médio',
        'Preço Entrada',
        'Preço Atual',
        'Valor Investido',
        'Posição Atual',
        'Lucro/Prejuízo',
        'Rentabilidade %',
        'Data de Compra',
        'Dividendos Recebidos'
      ].join(','));

      // Dados dos ativos
      investments.forEach(inv => {
        const profit = calcProfit(inv);
        const profitability = calcProfitability(inv);
        const currentPosition = calcCurrentPosition(inv);
        const averageCost = inv.average_cost || inv.entry_price || 0;
        const totalDividends = getTotalDividendsByInvestment(inv.id);

        csvRows.push([
          `"${inv.type || ''}"`,
          `"${inv.name || ''}"`,
          `"${inv.code || ''}"`,
          inv.quantity || 0,
          averageCost.toFixed(2),
          (inv.entry_price || 0).toFixed(2),
          (inv.current_value || 0).toFixed(2),
          (inv.amount || 0).toFixed(2),
          currentPosition.toFixed(2),
          profit.toFixed(2),
          profitability.toFixed(2),
          formatDate(inv.purchase_date),
          totalDividends.toFixed(2)
        ].join(','));
      });

      // Criar arquivo e download
      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `carteira_investimentos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      alert('Erro ao exportar arquivo CSV');
    }
  };

  const exportToPDF = () => {
    try {
      // Criar conteúdo HTML para impressão
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Por favor, permita pop-ups para exportar PDF');
        return;
      }

      const now = new Date();
      const dateTime = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`;

      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Carteira de Investimentos</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 40px; 
              background: white;
              color: #1a1a1a;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              padding-bottom: 20px;
              border-bottom: 3px solid #7C3AED;
            }
            .header h1 { 
              font-size: 28px; 
              color: #7C3AED; 
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .header p { 
              font-size: 14px; 
              color: #666;
            }
            .summary { 
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 20px; 
              margin-bottom: 30px;
            }
            .summary-card { 
              background: #f8f9fa; 
              padding: 20px; 
              border-radius: 12px;
              border-left: 4px solid #7C3AED;
            }
            .summary-card h3 { 
              font-size: 12px; 
              color: #666; 
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .summary-card p { 
              font-size: 24px; 
              font-weight: bold; 
              color: #1a1a1a;
            }
            .summary-card.positive p { color: #22C55E; }
            .summary-card.negative p { color: #EF4444; }
            .section { 
              margin-bottom: 30px;
            }
            .section h2 { 
              font-size: 20px; 
              color: #7C3AED; 
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #e5e7eb;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
              background: white;
            }
            th { 
              background: #7C3AED; 
              color: white; 
              padding: 12px 8px; 
              text-align: left; 
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            td { 
              padding: 10px 8px; 
              border-bottom: 1px solid #e5e7eb; 
              font-size: 12px;
            }
            tr:hover { background: #f8f9fa; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .positive { color: #22C55E; font-weight: 600; }
            .negative { color: #EF4444; font-weight: 600; }
            .badge { 
              display: inline-block;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 600;
              background: #e5e7eb;
              color: #666;
            }
            .footer { 
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 2px solid #e5e7eb;
              text-align: center; 
              font-size: 11px; 
              color: #999;
            }
            @media print {
              body { padding: 20px; }
              .summary { page-break-inside: avoid; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Carteira de Investimentos</h1>
            <p>Relatório gerado em ${dateTime}</p>
          </div>

          <div class="summary">
            <div class="summary-card">
              <h3>💰 Saldo Total Investido</h3>
              <p>${formatCurrency(totalInvested)}</p>
            </div>
            <div class="summary-card ${parseFloat(totalProfitability) >= 0 ? 'positive' : 'negative'}">
              <h3>📈 Rentabilidade</h3>
              <p>${totalProfitability}%</p>
            </div>
            <div class="summary-card ${totalProfit >= 0 ? 'positive' : 'negative'}">
              <h3>💵 Lucro/Prejuízo</h3>
              <p>${formatCurrency(totalProfit)}</p>
            </div>
          </div>
      `;

      // Adicionar tabelas por tipo
      Object.keys(groupedAssets).forEach(type => {
        const assets = groupedAssets[type];
        const typeTotal = assets.reduce((sum, a) => sum + a.invested, 0);
        const typeProfit = assets.reduce((sum, a) => sum + a.profit, 0);

        html += `
          <div class="section">
            <h2>${type} (${assets.length} ativo${assets.length !== 1 ? 's' : ''})</h2>
            <table>
              <thead>
                <tr>
                  <th>Ativo</th>
                  <th class="text-right">Qtd</th>
                  <th class="text-right">Custo Médio</th>
                  <th class="text-right">Preço Atual</th>
                  <th class="text-right">Investido</th>
                  <th class="text-right">Posição Atual</th>
                  <th class="text-right">Rentab. %</th>
                  <th class="text-right">Lucro/Prej.</th>
                  ${['FIIs', 'Ações BR'].includes(type) ? '<th class="text-right">Dividendos</th>' : ''}
                </tr>
              </thead>
              <tbody>
        `;

        assets.forEach(asset => {
          const averageCost = asset.average_cost || asset.entry_price || 0;
          const totalDividends = getTotalDividendsByInvestment(asset.id);
          
          html += `
            <tr>
              <td>
                <strong>${asset.name}</strong>
                ${asset.code ? `<br><span class="badge">${asset.code}</span>` : ''}
              </td>
              <td class="text-right">${asset.quantity > 0 ? asset.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 8 }) : '-'}</td>
              <td class="text-right">${averageCost > 0 ? formatCurrency(averageCost) : '-'}</td>
              <td class="text-right">${asset.current_value > 0 ? formatCurrency(asset.current_value) : '-'}</td>
              <td class="text-right">${formatCurrency(asset.invested)}</td>
              <td class="text-right"><strong>${formatCurrency(asset.currentPosition)}</strong></td>
              <td class="text-right ${asset.status === 'positive' ? 'positive' : 'negative'}">
                ${asset.profitability >= 0 ? '+' : ''}${asset.profitability.toFixed(2)}%
              </td>
              <td class="text-right ${asset.status === 'positive' ? 'positive' : 'negative'}">
                ${asset.profit >= 0 ? '+' : ''}${formatCurrency(asset.profit)}
              </td>
              ${['FIIs', 'Ações BR'].includes(type) ? `<td class="text-right">${totalDividends > 0 ? formatCurrency(totalDividends) : '-'}</td>` : ''}
            </tr>
          `;
        });

        html += `
              </tbody>
              <tfoot>
                <tr style="background: #f8f9fa; font-weight: bold;">
                  <td colspan="${['FIIs', 'Ações BR'].includes(type) ? '4' : '3'}">TOTAL ${type.toUpperCase()}</td>
                  <td class="text-right">${formatCurrency(typeTotal)}</td>
                  <td colspan="2"></td>
                  <td class="text-right ${typeProfit >= 0 ? 'positive' : 'negative'}">
                    ${typeProfit >= 0 ? '+' : ''}${formatCurrency(typeProfit)}
                  </td>
                  ${['FIIs', 'Ações BR'].includes(type) ? '<td></td>' : ''}
                </tr>
              </tfoot>
            </table>
          </div>
        `;
      });

      // Adicionar resumo de dividendos se houver
      if (dividends.length > 0) {
        html += `
          <div class="section">
            <h2>💰 Resumo de Dividendos</h2>
            <div class="summary" style="grid-template-columns: repeat(2, 1fr);">
              <div class="summary-card positive">
                <h3>Este Mês</h3>
                <p>${formatCurrency(getTotalThisMonth())}</p>
              </div>
              <div class="summary-card positive">
                <h3>Este Ano</h3>
                <p>${formatCurrency(getTotalThisYear())}</p>
              </div>
            </div>
          </div>
        `;
      }

      html += `
          <div class="footer">
            <p>Relatório gerado automaticamente pelo Sistema de Gestão de Investimentos</p>
            <p>Data: ${dateTime}</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
      
      // Aguardar carregamento e imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao gerar PDF');
    }
  };

  // ── handlers ──
  const handleCreateInvestment = async () => {
    try {
      let notesWithExtras = newInvestment.notes;
      
      if (newInvestment.type === 'Previdência Privada') {
        const extraData = {
          termMonths: simpleTermMonths,
        };
        notesWithExtras = `[PREVIDENCIA]${JSON.stringify(extraData)}${newInvestment.notes ? '\n' + newInvestment.notes : ''}`;
      } else if (newInvestment.type === 'Capitalização') {
        const extraData = {
          termMonths: simpleTermMonths,
        };
        notesWithExtras = `[CAPITALIZACAO]${JSON.stringify(extraData)}${newInvestment.notes ? '\n' + newInvestment.notes : ''}`;
      } else if (newInvestment.type === 'Consórcio') {
        const extraData = {
          termMonths: simpleTermMonths,
        };
        notesWithExtras = `[CONSORCIO]${JSON.stringify(extraData)}${newInvestment.notes ? '\n' + newInvestment.notes : ''}`;
      }

      await createInvestment({ 
        purchase_date: newInvestment.purchase_date, 
        type: newInvestment.type, 
        name: newInvestment.name, 
        code: newInvestment.code,
        quantity: newInvestment.quantity,
        amount: 0,
        entry_price: newInvestment.entry_price, 
        current_value: newInvestment.current_value, 
        notes: notesWithExtras 
      });
      setShowNewInvestmentModal(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      setNewInvestment({ type: 'Criptomoedas', name: '', code: '', quantity: 0, amount: 0, entry_price: 0, current_value: 0, purchase_date: new Date().toISOString().split('T')[0], notes: '' });
      setSimpleTermMonths(0);
      setPrevidenciaData({ planType: 'PGBL', taxRegime: 'Progressivo', monthlyContribution: 0, expectedReturn: 0, termMonths: 0 });
      setCapitalizacaoData({ institution: '', monthlyPayment: 0, termMonths: 0 });
      setConsorcioData({ totalValue: 0, termMonths: 0, administrator: '' });
    } catch (error) { console.error('Erro ao criar investimento:', error); }
  };

  const openEditInvestment = (asset: any) => {
    setEditingInvestment(asset);
    setEditInvestmentData({ 
      type: asset.type || 'Criptomoedas', 
      name: asset.name || '', 
      code: asset.code || '', 
      quantity: asset.quantity || 0, 
      amount: asset.amount || 0, 
      entry_price: asset.entry_price || 0, 
      current_value: asset.current_value || 0, 
      purchase_date: asset.purchase_date || new Date().toISOString().split('T')[0], 
      notes: asset.notes || '' 
    });

    if (asset.type === 'Previdência Privada' && asset.notes) {
      const match = asset.notes.match(/\[PREVIDENCIA\]({.*?})/);
      if (match) {
        try {
          const extraData = JSON.parse(match[1]);
          setEditPrevidenciaData({
            planType: extraData.planType || 'PGBL',
            taxRegime: extraData.taxRegime || 'Progressivo',
            monthlyContribution: extraData.monthlyContribution || 0,
            expectedReturn: extraData.expectedReturn || 0,
            termMonths: extraData.termMonths || 0,
          });
          const cleanNotes = asset.notes.replace(/\[PREVIDENCIA\]{.*?}(\n)?/, '');
          setEditInvestmentData(prev => ({ ...prev, notes: cleanNotes }));
        } catch (e) {
          console.error('Erro ao parsear dados de previdência:', e);
        }
      }
    } else if (asset.type === 'Capitalização' && asset.notes) {
      const match = asset.notes.match(/\[CAPITALIZACAO\]({.*?})/);
      if (match) {
        try {
          const extraData = JSON.parse(match[1]);
          setEditCapitalizacaoData({
            institution: extraData.institution || '',
            monthlyPayment: extraData.monthlyPayment || 0,
            termMonths: extraData.termMonths || 0,
          });
          const cleanNotes = asset.notes.replace(/\[CAPITALIZACAO\]{.*?}(\n)?/, '');
          setEditInvestmentData(prev => ({ ...prev, notes: cleanNotes }));
        } catch (e) {
          console.error('Erro ao parsear dados de capitalização:', e);
        }
      }
    } else if (asset.type === 'Consórcio' && asset.notes) {
      const match = asset.notes.match(/\[CONSORCIO\]({.*?})/);
      if (match) {
        try {
          const extraData = JSON.parse(match[1]);
          setEditConsorcioData({
            totalValue: extraData.totalValue || 0,
            termMonths: extraData.termMonths || 0,
            administrator: extraData.administrator || '',
          });
          const cleanNotes = asset.notes.replace(/\[CONSORCIO\]{.*?}(\n)?/, '');
          setEditInvestmentData(prev => ({ ...prev, notes: cleanNotes }));
        } catch (e) {
          console.error('Erro ao parsear dados de consórcio:', e);
        }
      }
    } else {
      setEditPrevidenciaData({ planType: 'PGBL', taxRegime: 'Progressivo', monthlyContribution: 0, expectedReturn: 0, termMonths: 0 });
      setEditCapitalizacaoData({ institution: '', monthlyPayment: 0, termMonths: 0 });
      setEditConsorcioData({ totalValue: 0, termMonths: 0, administrator: '' });
    }

    setShowEditInvestmentModal(true);
  };

  const handleUpdateInvestment = async () => {
    if (!editingInvestment) return;
    try {
      let notesWithExtras = editInvestmentData.notes;
      
      if (editInvestmentData.type === 'Previdência Privada') {
        const extraData = {
          planType: editPrevidenciaData.planType,
          taxRegime: editPrevidenciaData.taxRegime,
          monthlyContribution: editPrevidenciaData.monthlyContribution,
          expectedReturn: editPrevidenciaData.expectedReturn,
          termMonths: editPrevidenciaData.termMonths,
        };
        notesWithExtras = `[PREVIDENCIA]${JSON.stringify(extraData)}${editInvestmentData.notes ? '\n' + editInvestmentData.notes : ''}`;
      } else if (editInvestmentData.type === 'Capitalização') {
        const extraData = {
          institution: editCapitalizacaoData.institution,
          monthlyPayment: editCapitalizacaoData.monthlyPayment,
          termMonths: editCapitalizacaoData.termMonths,
        };
        notesWithExtras = `[CAPITALIZACAO]${JSON.stringify(extraData)}${editInvestmentData.notes ? '\n' + editInvestmentData.notes : ''}`;
      } else if (editInvestmentData.type === 'Consórcio') {
        const extraData = {
          totalValue: editConsorcioData.totalValue,
          termMonths: editConsorcioData.termMonths,
          administrator: editConsorcioData.administrator,
        };
        notesWithExtras = `[CONSORCIO]${JSON.stringify(extraData)}${editInvestmentData.notes ? '\n' + editInvestmentData.notes : ''}`;
      }

      await updateInvestment(editingInvestment.id, { 
        type: editInvestmentData.type, 
        name: editInvestmentData.name, 
        code: editInvestmentData.code,
        quantity: editInvestmentData.quantity,
        amount: editInvestmentData.amount, 
        entry_price: editInvestmentData.entry_price, 
        current_value: editInvestmentData.current_value, 
        purchase_date: editInvestmentData.purchase_date, 
        notes: notesWithExtras 
      });
      setShowEditInvestmentModal(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      setEditingInvestment(null);
    } catch (error) { console.error('Erro ao atualizar investimento:', error); }
  };

  const handleDeleteInvestment = async (id: string) => {
    setDeletingInvestmentId(id);
    try { await deleteInvestment(id); setConfirmDeleteInvestment(null); }
    catch (error) { console.error('Erro ao deletar investimento:', error); }
    finally { setDeletingInvestmentId(null); }
  };

  const openUpdatePricesModal = () => {
    setShowUpdatePricesModal(true);
  };

  const handleSavePrices = async (updates: Record<string, number>) => {
    setUpdatingPrices(true);
    try {
      const promises = Object.entries(updates).map(([id, newPrice]) => {
        const investment = investments.find(inv => inv.id === id);
        const quantity = investment?.quantity || 0;
        
        // Se tem quantidade, recalcula o valor total da posição
        const updateData: any = { current_value: newPrice };
        if (quantity > 0) {
          updateData.amount = quantity * newPrice;
        }
        
        return updateInvestment(id, updateData);
      });
      await Promise.all(promises);
      setShowUpdatePricesModal(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Erro ao atualizar preços:', error);
    } finally {
      setUpdatingPrices(false);
    }
  };

  const handleCreateTrade = async () => {
    try {
      const totalValue = tradeResultType === 'gain' ? Math.abs(newTrade.total) : -Math.abs(newTrade.total);
      const notesWithStyle = newTrade.style ? `[${newTrade.style}]${newTrade.notes ? ' ' + newTrade.notes : ''}` : newTrade.notes;
      await createTrade({ date: newTrade.date, type: tradeOrderType, symbol: newTrade.symbol || '-', quantity: newTrade.quantity, price: newTrade.price, total: totalValue, notes: notesWithStyle });
      setShowNewTradeModal(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      setNewTrade({ date: new Date().toISOString().split('T')[0], symbol: '', style: 'Day Trade', quantity: 0, price: 0, total: 0, notes: '' });
      setTradeResultType('gain');
      setTradeOrderType('compra');
    } catch (error) { console.error('Erro ao criar trade:', error); }
  };

  const handleUpdateTrade = async () => {
    if (!editingTrade) return;
    try {
      const totalValue = editTradeResultType === 'gain' ? Math.abs(editTradeData.total) : -Math.abs(editTradeData.total);
      const notesWithStyle = editTradeData.style ? `[${editTradeData.style}]${editTradeData.notes ? ' ' + editTradeData.notes : ''}` : editTradeData.notes;
      await updateTrade(editingTrade.id, { date: editTradeData.date, type: editTradeOrderType, symbol: editTradeData.symbol || '-', quantity: editTradeData.quantity, price: editTradeData.price, total: totalValue, notes: notesWithStyle });
      setShowEditTradeModal(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      setEditingTrade(null);
    } catch (error) { console.error('Erro ao atualizar trade:', error); }
  };

  const openEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    // normalize date to YYYY-MM-DD for the <input type="date" />
    const normalizedDate = trade.date ? String(trade.date).split('T')[0] : new Date().toISOString().split('T')[0];
    setEditTradeData({ date: normalizedDate, symbol: trade.symbol, style: 'Day Trade', quantity: trade.quantity, price: trade.price, total: trade.total, notes: trade.notes || '' });
    setEditTradeMode('simplificado');
    setEditTradeResultType(trade.total >= 0 ? 'gain' : 'loss');
    setEditTradeOrderType(trade.type as 'compra' | 'venda');
    setShowEditTradeModal(true);
  };

  const handleDeleteTrade = async (tradeId: string) => {
    setDeletingId(tradeId);
    try { await deleteTrade(tradeId); setConfirmDeleteTrade(null); }
    catch (error) { console.error('Erro ao deletar trade:', error); }
    finally { setDeletingId(null); }
  };

  const openPriceHistoryModal = (asset: Investment) => {
    setSelectedAssetForHistory(asset);
    setShowPriceHistoryModal(true);
  };

  

  // ── Constantes de calendário ──
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // ── Navegação de mês ──
  const prevMonth = () => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };
  const nextMonth = () => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  // ── Totais da carteira ──
  const processedInvestments = investments.map((inv) => ({
    ...inv,
    profit: calcProfit(inv),
    profitability: calcProfitability(inv),
    currentPosition: calcCurrentPosition(inv),
    invested: inv.amount || 0,
    status: calcProfit(inv) >= 0 ? 'positive' : 'negative',
  }));

  const totalInvested = processedInvestments.reduce((sum, inv) => sum + inv.invested, 0);
  const totalProfit = processedInvestments.reduce((sum, inv) => sum + inv.profit, 0);
  const totalProfitability = totalInvested > 0
    ? ((totalProfit / totalInvested) * 100).toFixed(2)
    : '0.00';

  // ── Resumo Mensal de Contribuições (Previdência + Capitalização + Consórcio) ──
  const getMonthlyContributionsSummary = () => {
    let previdenciaMonthly = 0;
    let capitalizacaoMonthly = 0;
    let consorcioMonthly = 0;

    investments.forEach((inv) => {
      if (!inv.notes) return;
      if (inv.type === 'Previdência Privada') {
        const match = inv.notes.match(/\[PREVIDENCIA\](\{.*?\})/);
        if (match) {
          try {
            const data = JSON.parse(match[1]);
            previdenciaMonthly += data.monthlyContribution || 0;
          } catch (e) {
            console.warn('Erro ao parsear dados de previdência:', e);
          }
        }
      } else if (inv.type === 'Capitalização') {
        const match = inv.notes.match(/\[CAPITALIZACAO\](\{.*?\})/);
        if (match) {
          try {
            const data = JSON.parse(match[1]);
            capitalizacaoMonthly += data.monthlyPayment || 0;
          } catch (e) {
            console.warn('Erro ao parsear dados de capitalização:', e);
          }
        }
      } else if (inv.type === 'Consórcio') {
        const match = inv.notes.match(/\[CONSORCIO\](\{.*?\})/);
        if (match) {
          try {
            const data = JSON.parse(match[1]);
            if (data.totalValue > 0 && data.termMonths > 0) {
              consorcioMonthly += data.totalValue / data.termMonths;
            }
          } catch (e) {
            console.warn('Erro ao parsear dados de consórcio:', e);
          }
        }
      }
    });

    const total = previdenciaMonthly + capitalizacaoMonthly + consorcioMonthly;
    return {
      previdencia: previdenciaMonthly,
      capitalizacao: capitalizacaoMonthly,
      consorcio: consorcioMonthly,
      total,
      hasData: total > 0,
    };
  };

  const monthlyContributions = getMonthlyContributionsSummary();

  // ── Agrupamento por tipo ──
  const groupedAssets: Record<string, typeof processedInvestments> = {};
  processedInvestments.forEach((inv) => {
    const type = inv.type || 'Outros';
    if (!groupedAssets[type]) groupedAssets[type] = [];
    groupedAssets[type].push(inv);
  });

  // ── Resultados de trade ──
  const today = new Date().toISOString().split('T')[0];
  const currentMonthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
  const tradeResultDay = trades
    .filter((t) => t.date && t.date.startsWith(today))
    .reduce((sum, t) => sum + (t.total || 0), 0);
  const tradeResultMonth = trades
    .filter((t) => t.date && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + (t.total || 0), 0);

  // ── Renderização do calendário ──
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: JSX.Element[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTrades = trades.filter((t) => t.date && t.date.startsWith(dateStr));
      const dayResult = dayTrades.reduce((sum, t) => sum + (t.total || 0), 0);
      const isToday = dateStr === today;

      cells.push(
        <div
          key={day}
          className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs sm:text-sm transition-all
            ${isToday ? 'ring-2 ring-[#7C3AED]' : ''}
            ${dayTrades.length > 0
              ? dayResult >= 0
                ? 'bg-[#22C55E]/20 text-[#22C55E] font-bold'
                : 'bg-[#EF4444]/20 text-[#EF4444] font-bold'
              : 'text-[#9CA3AF]'
            }`}
        >
          <span>{day}</span>
          {dayTrades.length > 0 && (
            <span className="text-[10px] leading-none mt-0.5">
              {dayResult >= 0 ? '+' : ''}{dayResult.toFixed(0)}
            </span>
          )}
        </div>
      );
    }

    return cells;
  };

  // ── evolução mensal ──
  const monthlyEvolution: Array<{ month: string; investments: number; trade: number; total: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthInvestments = investments.filter((inv) => inv.purchase_date && inv.purchase_date.startsWith(monthStr)).reduce((sum, inv) => sum + (inv.current_value || 0), 0);
    const monthTrades = trades.filter((t) => t.date && t.date.startsWith(monthStr)).reduce((sum, t) => sum + (t.total || 0), 0);
    monthlyEvolution.push({ month: monthNames[date.getMonth()].substring(0, 3), investments: monthInvestments, trade: monthTrades, total: monthInvestments + monthTrades });
  }

  // ── card resultado de trades ──
  const tradeMonths: Array<{ label: string; monthStr: string; result: number; gains: number; losses: number; count: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const mStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('. ', '/').replace('.', '');
    const mTrades = trades.filter((t) => t.date && t.date.startsWith(mStr));
    const gains = mTrades.filter((t) => (t.total || 0) > 0).reduce((s, t) => s + (t.total || 0), 0);
    const losses = mTrades.filter((t) => (t.total || 0) < 0).reduce((s, t) => s + Math.abs(t.total || 0), 0);
    tradeMonths.push({ label, monthStr: mStr, result: gains - losses, gains, losses, count: mTrades.length });
  }
  const totalGains6m = tradeMonths.reduce((s, m) => s + m.gains, 0);
  const totalLosses6m = tradeMonths.reduce((s, m) => s + m.losses, 0);
  const accumulated6m = tradeMonths.reduce((s, m) => s + m.result, 0);
  const totalVolume6m = totalGains6m + totalLosses6m;
  const gainPct6m = totalVolume6m > 0 ? (totalGains6m / totalVolume6m) * 100 : 0;

  // Calcular yield médio da carteira
  const calculateAverageYield = () => {
    const totalInvestedInDividendAssets = investments
      .filter(inv => ['FIIs', 'Ações BR'].includes(inv.type))
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
    
    const totalDividendsYear = getTotalThisYear();
    
    if (totalInvestedInDividendAssets === 0) return 0;
    return (totalDividendsYear / totalInvestedInDividendAssets) * 100;
  };

  const openDividendModal = (asset: Investment) => {
    setSelectedAssetForDividend(asset);
    setEditingDividend(null);
    setShowDividendModal(true);
  };

  const openDividendHistoryModal = (asset: Investment) => {
    setSelectedAssetForDividend(asset);
    setShowDividendHistoryModal(true);
  };

  const handleSaveDividend = async (dividendData: any) => {
    try {
      if (editingDividend) {
        await updateDividend(editingDividend.id, dividendData);
      } else {
        await addDividend(dividendData);
      }
      setShowDividendModal(false);
      setEditingDividend(null);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar dividendo:', error);
      alert('Erro ao salvar dividendo');
    }
  };

  const handleEditDividend = (dividend: any) => {
    setEditingDividend(dividend);
    setShowDividendModal(true);
    setShowDividendHistoryModal(false);
  };

  // Função auxiliar para extrair dados extras de um investimento
  const getExtraData = (investment: any) => {
    if (!investment.notes) return null;

    if (investment.type === 'Previdência Privada') {
      const match = investment.notes.match(/\[PREVIDENCIA\]({.*?})/);
      if (match) {
        try { return JSON.parse(match[1]); } catch (e) { return null; }
      }
    } else if (investment.type === 'Capitalização') {
      const match = investment.notes.match(/\[CAPITALIZACAO\]({.*?})/);
      if (match) {
        try { return JSON.parse(match[1]); } catch (e) { return null; }
      }
    } else if (investment.type === 'Consórcio') {
      const match = investment.notes.match(/\[CONSORCIO\]({.*?})/);
      if (match) {
        try { return JSON.parse(match[1]); } catch (e) { return null; }
      }
    }
    return null;
  };

  // Estados para modais de contribuição e resgate
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [selectedInvestmentForContribution, setSelectedInvestmentForContribution] = useState<Investment | null>(null);
  const [showResgateModal, setShowResgateModal] = useState(false);
  const [selectedInvestmentForResgate, setSelectedInvestmentForResgate] = useState<Investment | null>(null);

  // Handler para lançar contribuição
  const handleContribution = async (contribution: { month: string; value: number; tipo: 'parcela' | 'rentabilidade' }) => {
    if (!selectedInvestmentForContribution) return;
    try {
      const inv = selectedInvestmentForContribution;
      let newNotes = inv.notes || '';

      if (contribution.tipo === 'parcela') {
        // Soma ao saldo acumulado — usa round2 para evitar erros de ponto flutuante
        const newAmount = round2((inv.amount || 0) + contribution.value);
        const contribEntry = `[CONTRIB]${JSON.stringify({ month: contribution.month, value: contribution.value })}`;
        newNotes = newNotes + '\n' + contribEntry;

        await updateInvestment(inv.id, {
          amount: newAmount,
          notes: newNotes,
        });
      } else {
        // Rentabilidade: NÃO altera o saldo (amount), apenas salva o valor de rentabilidade em R$
        newNotes = newNotes.replace(/\[RENT_VALUE\]([-\d.]+)/g, '');
        const rentEntry = `[RENT_VALUE]${contribution.value}`;
        // Também salva no histórico de rentabilidade
        const rentHistEntry = `[RENT]${JSON.stringify({ month: contribution.month, value: contribution.value })}`;
        newNotes = newNotes.trim() + '\n' + rentEntry + '\n' + rentHistEntry;

        await updateInvestment(inv.id, {
          // amount NÃO muda
          notes: newNotes,
        });
      }

      setShowContributionModal(false);
      setSelectedInvestmentForContribution(null);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Erro ao lançar contribuição:', error);
    }
  };

  // Handler para resgate — zera o saldo
  const handleResgate = async (resgateData: { date: string; value: number; reason: string; notes: string }) => {
    if (!selectedInvestmentForResgate) return;
    try {
      const inv = selectedInvestmentForResgate;
      const resgateEntry = `[RESGATE]${JSON.stringify({
        date: resgateData.date,
        value: resgateData.value,
        reason: resgateData.reason,
        notes: resgateData.notes,
      })}`;
      const currentNotes = inv.notes || '';
      const newNotes = currentNotes + '\n' + resgateEntry;

      // Zera o saldo pois o usuário sacou tudo
      await updateInvestment(inv.id, {
        amount: 0,
        current_value: 0,
        notes: newNotes,
      });

      setShowResgateModal(false);
      setSelectedInvestmentForResgate(null);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Erro ao registrar resgate:', error);
    }
  };

  const openContributionModal = (asset: Investment) => {
    setSelectedInvestmentForContribution(asset);
    setShowContributionModal(true);
  };

  const openResgateModal = (asset: Investment) => {
    setSelectedInvestmentForResgate(asset);
    setShowResgateModal(true);
  };

  // Novo estado simplificado para criação de Previdência/Capitalização/Consórcio
  const [simpleTermMonths, setSimpleTermMonths] = useState<number>(0);

  // Handler para atualizar um lançamento específico pelo índice
  const handleUpdateContribution = async (contribIndex: number, newMonth: string, newValue: number) => {
    if (!selectedInvestmentForDetail) return;
    try {
      const inv = selectedInvestmentForDetail;
      const notes = inv.notes || '';

      // Extrair todos os [CONTRIB] com posição
      const regex = /\[CONTRIB\](\{.*?\})/g;
      let match;
      let idx = 0;
      let newNotes = notes;
      const replacements: Array<{ original: string; replacement: string }> = [];

      while ((match = regex.exec(notes)) !== null) {
        if (idx === contribIndex) {
          try {
            const oldData = JSON.parse(match[1]);
            const newData = { month: newMonth, value: newValue };
            replacements.push({
              original: `[CONTRIB]${match[1]}`,
              replacement: `[CONTRIB]${JSON.stringify(newData)}`,
            });
            // Recalcular amount: remover valor antigo, adicionar novo
            const oldValue = oldData.value || 0;
            const newAmount = Math.max(0, (inv.amount || 0) - oldValue + newValue);

            // Aplicar substituição
            newNotes = newNotes.replace(`[CONTRIB]${match[1]}`, `[CONTRIB]${JSON.stringify(newData)}`);

            await updateInvestment(inv.id, {
              amount: newAmount,
              notes: newNotes,
            });

            // Atualizar o selectedInvestmentForDetail localmente
            setSelectedInvestmentForDetail((prev: any) => prev ? { ...prev, notes: newNotes, amount: newAmount } : prev);
          } catch (e) {
            console.error('Erro ao parsear contrib:', e);
          }
          break;
        }
        idx++;
      }

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Erro ao atualizar lançamento:', error);
    }
  };

  // Handler para excluir um lançamento específico pelo índice
  const handleDeleteContribution = async (contribIndex: number) => {
    if (!selectedInvestmentForDetail) return;
    try {
      const inv = selectedInvestmentForDetail;
      const notes = inv.notes || '';

      const regex = /\[CONTRIB\](\{.*?\})/g;
      let match;
      let idx = 0;
      let removedValue = 0;
      let newNotes = notes;

      while ((match = regex.exec(notes)) !== null) {
        if (idx === contribIndex) {
          try {
            const data = JSON.parse(match[1]);
            removedValue = data.value || 0;
            newNotes = newNotes.replace(`[CONTRIB]${match[1]}`, '').replace(/\n\n+/g, '\n').trim();
          } catch (e) {
            console.error('Erro ao parsear contrib:', e);
          }
          break;
        }
        idx++;
      }

      const newAmount = Math.max(0, (inv.amount || 0) - removedValue);

      await updateInvestment(inv.id, {
        amount: newAmount,
        notes: newNotes,
      });

      // Atualizar o selectedInvestmentForDetail localmente
      setSelectedInvestmentForDetail((prev: any) => prev ? { ...prev, notes: newNotes, amount: newAmount } : prev);

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Erro ao excluir lançamento:', error);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0E0B16] p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F9FAFB] mb-1 sm:mb-2">📈 Investimentos</h1>
          <p className="text-sm sm:text-base text-[#9CA3AF]">Controle completo da sua carteira e operações</p>
        </div>

        {/* Banner de Alertas Disparados */}
        {triggeredAlerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {triggeredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-xl p-4 border-2 flex items-center justify-between ${
                  alert.type === 'up'
                    ? 'bg-[#22C55E]/10 border-[#22C55E]/30'
                    : 'bg-[#EF4444]/10 border-[#EF4444]/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      alert.type === 'up' ? 'bg-[#22C55E]/20' : 'bg-[#EF4444]/20'
                    }`}>
                    <i className={`text-2xl ${
                      alert.type === 'up'
                        ? 'ri-arrow-up-line text-[#22C55E]'
                        : 'ri-arrow-down-line text-[#EF4444]'
                    }`}></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#F9FAFB] mb-1">
                      🔔 Alerta de Variação Disparado
                    </p>
                    <p className="text-sm text-[#9CA3AF]">
                      <span className="font-medium text-[#F9FAFB]">{alert.name}</span>{' '}
                      {alert.type === 'up' ? 'subiu' : 'caiu'}{' '}
                      <span
                        className={`font-bold ${
                          alert.type === 'up' ? 'text-[#22C55E]' : 'text-[#EF4444]'
                        }`}
                      >
                        {Math.abs(alert.variation).toFixed(2)}%
                      </span>{' '}
                      (limite: ±{alert.threshold}%)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                >
                  <i className="ri-close-line text-xl text-[#9CA3AF]"></i>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 lg:mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {(['overview', 'portfolio', 'trade'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer text-sm sm:text-base ${activeTab === tab ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-lg shadow-[#7C3AED]/30' : 'bg-[#16122A] text-[#9CA3AF] hover:bg-[#16122A]/80'}`}>
              {tab === 'overview' && '📊 Visão Geral'}
              {tab === 'portfolio' && '💼 Carteira'}
              {tab === 'trade' && '⚡ Trade'}
            </button>
          ))}
        </div>

        {/* ===== VISÃO GERAL ===== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 lg:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
                <span className="text-[#9CA3AF] text-xs sm:text-sm block mb-3">💰 Saldo Total Investido</span>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#F9FAFB] mb-1">{formatCurrency(totalInvested)}</p>
                <p className="text-xs text-[#9CA3AF]">Capital aplicado</p>
              </div>
              <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
                <span className="text-[#9CA3AF] text-xs sm:text-sm block mb-3">📈 Rentabilidade Total</span>
                <p className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-1 ${parseFloat(totalProfitability) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{totalProfitability}%</p>
                <p className="text-xs text-[#9CA3AF]">Retorno sobre investimento</p>
              </div>
              <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
                <span className="text-[#9CA3AF] text-xs sm:text-sm block mb-3">💵 Lucro / Prejuízo</span>
                <p className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-1 ${totalProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{formatCurrency(totalProfit)}</p>
                <p className="text-xs text-[#9CA3AF]">Ganho líquido</p>
              </div>
            </div>

            {/* Card Resumo Mensal de Contribuições */}
            {monthlyContributions.hasData && (
              <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 lg:p-8 border border-white/5 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center">
                    <i className="ri-calendar-check-line text-[#7C3AED] text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#F9FAFB]">📅 Compromissos Mensais</h3>
                    <p className="text-xs text-[#9CA3AF]">Previdência · Capitalização · Consórcio</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-[#9CA3AF]">Total mensal</p>
                    <p className="text-xl font-bold text-[#7C3AED]">{formatCurrency(monthlyContributions.total)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {/* Previdência */}
                  <div className={`rounded-xl p-4 border ${monthlyContributions.previdencia > 0 ? 'bg-[#7C3AED]/10 border-[#7C3AED]/20' : 'bg-[#0E0B16] border-white/5 opacity-50'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#7C3AED]/20">
                        <i className="ri-shield-check-line text-[#7C3AED] text-sm"></i>
                      </div>
                      <p className="text-xs font-semibold text-[#9CA3AF]">Previdência Privada</p>
                    </div>
                    <p className="text-xl font-bold text-[#7C3AED]">
                      {formatCurrency(monthlyContributions.previdencia)}
                    </p>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      {formatCurrency(monthlyContributions.previdencia * 12)}/ano
                    </p>
                  </div>

                  {/* Capitalização */}
                  <div className={`rounded-xl p-4 border ${monthlyContributions.capitalizacao > 0 ? 'bg-[#22C55E]/10 border-[#22C55E]/20' : 'bg-[#0E0B16] border-white/5 opacity-50'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#22C55E]/20">
                        <i className="ri-coin-line text-[#22C55E] text-sm"></i>
                      </div>
                      <p className="text-xs font-semibold text-[#9CA3AF]">Capitalização</p>
                    </div>
                    <p className="text-xl font-bold text-[#22C55E]">
                      {formatCurrency(monthlyContributions.capitalizacao)}
                    </p>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      {formatCurrency(monthlyContributions.capitalizacao * 12)}/ano
                    </p>
                  </div>

                  {/* Consórcio */}
                  <div className={`rounded-xl p-4 border ${monthlyContributions.consorcio > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-[#0E0B16] border-white/5 opacity-50'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-500/20">
                        <i className="ri-group-line text-amber-500 text-sm"></i>
                      </div>
                      <p className="text-xs font-semibold text-[#9CA3AF]">Consórcio</p>
                    </div>
                    <p className="text-xl font-bold text-amber-500">
                      {formatCurrency(monthlyContributions.consorcio)}
                    </p>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      {formatCurrency(monthlyContributions.consorcio * 12)}/ano
                    </p>
                  </div>
                </div>

                {/* Gráfico de Evolução & Projeção — Previdência, Capitalização, Consórcio */}
                {investments.some(inv => ['Previdência Privada', 'Capitalização', 'Consórcio'].includes(inv.type)) && (
                  <LongTermEvolutionChart investments={investments} />
                )}

                {/* Card Resumo de Dividendos */}
                <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 lg:p-8 border border-white/5 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-[#22C55E]/20 flex items-center justify-center">
                      <i className="ri-money-dollar-circle-line text-[#22C55E] text-xl"></i>
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#F9FAFB]">💰 Resumo de Dividendos</h3>
                      <p className="text-xs text-[#9CA3AF]">Proventos de FIIs e Ações</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#0E0B16] rounded-xl p-4 sm:p-5 border border-white/5">
                      <p className="text-xs text-[#9CA3AF] mb-1">Este Mês</p>
                      <p className="text-2xl sm:text-3xl font-bold text-[#22C55E]">
                        {formatCurrency(getTotalThisMonth())}
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        {getDividendsThisMonth().length} pagamento{getDividendsThisMonth().length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="bg-[#0E0B16] rounded-xl p-4 sm:p-5 border border-white/5">
                      <p className="text-xs text-[#9CA3AF] mb-1">Este Ano</p>
                      <p className="text-2xl sm:text-3xl font-bold text-[#22C55E]">
                        {formatCurrency(getTotalThisYear())}
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        {getDividendsThisYear().length} pagamento{getDividendsThisYear().length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="bg-[#0E0B16] rounded-xl p-4 sm:p-5 border border-white/5">
                      <p className="text-xs text-[#9CA3AF] mb-1">Yield Médio</p>
                      <p className="text-2xl sm:text-3xl font-bold text-[#22C55E]">
                        {calculateAverageYield().toFixed(2)}%
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-1">Retorno anual</p>
                    </div>
                  </div>

                  {dividends.length === 0 ? (
                    <div className="text-center py-8 border-t border-white/5">
                      <p className="text-[#9CA3AF] mb-4">Nenhum dividendo registrado ainda</p>
                    </div>
                  ) : (
                    <div className="border-t border-white/5 pt-5">
                      <p className="text-sm font-semibold text-[#9CA3AF] mb-3">Últimos Pagamentos</p>
                      <div className="space-y-2">
                        {dividends.slice(0, 5).map((dividend) => {
                          const investment = investments.find(inv => inv.id === dividend.investment_id);
                          return (
                            <div key={dividend.id} className="flex items-center justify-between py-2 px-3 bg-[#0E0B16] rounded-lg border border-white/5 hover:border-[#22C55E]/30 transition-all">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-[#F9FAFB]">{investment?.name || 'Ativo'}</p>
                                <p className="text-xs text-[#9CA3AF]">
                                  {new Date(dividend.payment_date).toLocaleDateString('pt-BR')} · {dividend.dividend_type}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-[#22C55E]">
                                  {formatCurrency(dividend.total_received)}
                                </p>
                                <p className="text-xs text-[#9CA3AF]">
                                  {formatCurrency(dividend.value_per_share)}/cota
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Distribuição por Tipo */}
                {Object.keys(groupedAssets).length > 0 && (
                  <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 lg:p-8 border border-white/5 shadow-lg">
                    <h3 className="text-lg sm:text-xl font-bold text-[#F9FAFB] mb-4 sm:mb-6">📊 Distribuição por Tipo</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {Object.keys(groupedAssets).map((type, index) => {
                        const assets = groupedAssets[type];
                        const typeInvested = assets.reduce((sum: number, a: any) => sum + (a.invested || 0), 0);
                        const typeProfit = assets.reduce((sum: number, a: any) => sum + (a.profit || 0), 0);
                        const typeProfitPct = typeInvested > 0 ? (typeProfit / typeInvested) * 100 : 0;
                        const typeTotal = round2(typeInvested + typeProfit);
                        return (
                          <div key={index} className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
                            <p className="text-xs sm:text-sm text-[#9CA3AF] mb-3 truncate font-medium">{type}</p>
                            <div className="flex items-end justify-between mb-3">
                              <div>
                                <p className="text-xs text-[#9CA3AF]">Investido</p>
                                <p className="text-base sm:text-lg font-bold text-[#F9FAFB]">{formatCurrency(typeInvested)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-[#9CA3AF]">Rentabilidade</p>
                                <p className={`text-base sm:text-lg font-bold ${typeProfitPct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                                  {typeProfitPct >= 0 ? '+' : ''}{typeProfitPct.toFixed(2)}%
                                </p>
                              </div>
                            </div>
                            <div className={`rounded-lg px-3 py-2 flex items-center justify-between mb-2 ${typeProfit >= 0 ? 'bg-[#22C55E]/10 border border-[#22C55E]/20' : 'bg-[#EF4444]/10 border border-[#EF4444]/20'}`}>
                              <span className="text-xs text-[#9CA3AF]">Lucro / Prejuízo</span>
                              <span className={`text-sm font-bold ${typeProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                                {typeProfit >= 0 ? '+' : ''}{formatCurrency(typeProfit)}
                              </span>
                            </div>
                            <div className="rounded-lg px-3 py-2 flex items-center justify-between bg-[#7C3AED]/10 border border-[#7C3AED]/20">
                              <span className="text-xs text-[#9CA3AF]">Valor Total</span>
                              <span className="text-sm font-bold text-[#7C3AED]">{formatCurrency(typeTotal)}</span>
                            </div>
                            <p className="text-xs text-[#9CA3AF] mt-2">{assets.length} ativo{assets.length !== 1 ? 's' : ''}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Distribuição por Tipo */}
            {Object.keys(groupedAssets).length > 0 && (
              <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 lg:p-8 border border-white/5 shadow-lg">
                <h3 className="text-lg sm:text-xl font-bold text-[#F9FAFB] mb-4 sm:mb-6">📊 Distribuição por Tipo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {Object.keys(groupedAssets).map((type, index) => {
                    const assets = groupedAssets[type];
                    const typeInvested = assets.reduce((sum: number, a: any) => sum + (a.invested || 0), 0);
                    const typeProfit = assets.reduce((sum: number, a: any) => sum + (a.profit || 0), 0);
                    const typeProfitPct = typeInvested > 0 ? (typeProfit / typeInvested) * 100 : 0;
                    const typeTotal = round2(typeInvested + typeProfit);
                    return (
                      <div key={index} className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
                        <p className="text-xs sm:text-sm text-[#9CA3AF] mb-3 truncate font-medium">{type}</p>
                        <div className="flex items-end justify-between mb-3">
                          <div>
                            <p className="text-xs text-[#9CA3AF]">Investido</p>
                            <p className="text-base sm:text-lg font-bold text-[#F9FAFB]">{formatCurrency(typeInvested)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[#9CA3AF]">Rentabilidade</p>
                            <p className={`text-base sm:text-lg font-bold ${typeProfitPct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                              {typeProfitPct >= 0 ? '+' : ''}{typeProfitPct.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                        <div className={`rounded-lg px-3 py-2 flex items-center justify-between mb-2 ${typeProfit >= 0 ? 'bg-[#22C55E]/10 border border-[#22C55E]/20' : 'bg-[#EF4444]/10 border border-[#EF4444]/20'}`}>
                          <span className="text-xs text-[#9CA3AF]">Lucro / Prejuízo</span>
                          <span className={`text-sm font-bold ${typeProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                            {typeProfit >= 0 ? '+' : ''}{formatCurrency(typeProfit)}
                          </span>
                        </div>
                        <div className="rounded-lg px-3 py-2 flex items-center justify-between bg-[#7C3AED]/10 border border-[#7C3AED]/20">
                          <span className="text-xs text-[#9CA3AF]">Valor Total</span>
                          <span className="text-sm font-bold text-[#7C3AED]">{formatCurrency(typeTotal)}</span>
                        </div>
                        <p className="text-xs text-[#9CA3AF] mt-2">{assets.length} ativo{assets.length !== 1 ? 's' : ''}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== CARTEIRA ===== */}
        {activeTab === 'portfolio' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB]">💼 Minha Carteira</h2>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setShowNewInvestmentModal(true)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-lg hover:shadow-[#7C3AED]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base flex items-center gap-2">
                  <i className="ri-add-line" /> Novo Investimento
                </button>
              </div>
            </div>

            {loadingInvestments ? (
              <div className="flex items-center justify-center py-12"><p className="text-[#9CA3AF]">Carregando...</p></div>
            ) : Object.keys(groupedAssets).length === 0 ? (
              <div className="bg-[#16122A] rounded-xl p-8 border border-white/5 shadow-lg text-center">
                <p className="text-[#9CA3AF] mb-4">Nenhum investimento cadastrado ainda</p>
                <button
                  onClick={() => setShowNewInvestmentModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white rounded-xl font-medium cursor-pointer whitespace-nowrap"
                >
                  Adicionar Primeiro Investimento
                </button>
              </div>
            ) : (
              Object.keys(groupedAssets).map((type, typeIndex) => {
                const isLongTermType = ['Previdência Privada', 'Capitalização', 'Consórcio'].includes(type);
                return (
                  <div key={typeIndex} className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
                    <h3 className="text-base sm:text-lg font-bold text-[#F9FAFB] mb-4">{type}</h3>
                    {/* Mobile */}
                    <div className="lg:hidden space-y-3">
                      {groupedAssets[type].map((asset: any) => {
                        const hasAlert = getAlert(asset.id);
                        const isAlertTriggered = triggeredAlerts.some(a => a.id === asset.id);
                        const averageCost = asset.average_cost || asset.entry_price || 0;
                        const totalDividends = getTotalDividendsByInvestment(asset.id);
                        const canReceiveDividends = ['FIIs', 'Ações BR'].includes(asset.type);
                        const extraData = getExtraData(asset);
                        const isEncerrado = asset.notes && asset.notes.includes('[RESGATE]');

                        return (
                          <div
                            key={asset.id}
                            className={`bg-[#0E0B16] rounded-lg p-4 border transition-all cursor-pointer hover:border-white/20 ${isEncerrado ? 'border-[#EF4444]/20 opacity-60' : 'border-white/5'}`}
                            onClick={() => openDetailModal(asset)}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-[#F9FAFB]">{asset.name}</p>
                                  {isEncerrado && (
                                    <span className="px-2 py-0.5 bg-[#EF4444]/20 text-[#EF4444] rounded text-xs font-bold">Encerrado</span>
                                  )}
                                </div>
                                <p className="text-xs text-[#9CA3AF]">{asset.code || asset.type}</p>
                                {extraData && asset.type === 'Previdência Privada' && (
                                  <div className="mt-2 flex gap-1 flex-wrap">
                                    <span className="px-2 py-0.5 bg-[#7C3AED]/20 text-[#7C3AED] rounded text-xs font-medium">{extraData.planType}</span>
                                    <span className="px-2 py-0.5 bg-[#EC4899]/20 text-[#EC4899] rounded text-xs font-medium">{extraData.taxRegime}</span>
                                  </div>
                                )}
                                {extraData && asset.type === 'Capitalização' && (
                                  <div className="mt-2">
                                    <span className="px-2 py-0.5 bg-[#22C55E]/20 text-[#22C55E] rounded text-xs font-medium">{extraData.institution}</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-bold ${asset.status === 'positive' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                                  {asset.profitability > 0 ? '+' : ''}{asset.profitability.toFixed(2)}%
                                </p>
                                <p className="text-xs text-[#9CA3AF] mt-0.5">rentabilidade</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <p className="text-xs text-[#9CA3AF]">Saldo Acumulado</p>
                                <p className="text-sm font-bold text-[#22C55E]">{formatCurrency(asset.invested)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[#9CA3AF]">Posição Atual</p>
                                <p className="text-sm font-medium text-[#F9FAFB]">{formatCurrency(asset.currentPosition)}</p>
                              </div>
                            </div>

                            {/* Indicador de clique */}
                            <div className="flex items-center justify-center gap-1 text-xs text-[#9CA3AF] mb-2">
                              <i className="ri-eye-line text-xs"></i>
                              <span>Toque para ver detalhes</span>
                            </div>

                            {/* Botões para tipos de longo prazo */}
                            {isLongTermType && !isEncerrado && (
                              <div className="flex gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => openContributionModal(asset)}
                                  className="flex-1 py-2 rounded-lg bg-[#22C55E]/20 hover:bg-[#22C55E]/40 text-[#22C55E] text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <i className="ri-add-circle-line" /> Lançar Parcela
                                </button>
                                <button
                                  onClick={() => openResgateModal(asset)}
                                  className="flex-1 py-2 rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/40 text-[#EF4444] text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <i className="ri-hand-coin-line" /> Resgatar
                                </button>
                              </div>
                            )}

                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => openEditInvestment(asset)} className="flex-1 py-2 rounded-lg bg-[#7C3AED]/20 hover:bg-[#7C3AED]/40 text-[#7C3AED] text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1">
                                <i className="ri-edit-line" /> Editar
                              </button>
                              <button onClick={() => setConfirmDeleteInvestment(asset)} className="flex-1 py-2 rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/40 text-[#EF4444] text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1">
                                <i className="ri-delete-bin-line" /> Excluir
                              </button>
                            </div>

                            {canReceiveDividends && totalDividends > 0 && (
                              <div className="mt-2 p-2 bg-[#22C55E]/10 rounded-lg border border-[#22C55E]/20">
                                <p className="text-xs text-[#9CA3AF]">Dividendos Recebidos</p>
                                <p className="text-sm font-bold text-[#22C55E]">{formatCurrency(totalDividends)}</p>
                              </div>
                            )}
                            {canReceiveDividends && (
                              <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => openDividendModal(asset)} className="flex-1 py-2 rounded-lg bg-[#22C55E]/20 hover:bg-[#22C55E]/40 text-[#22C55E] text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1">
                                  <i className="ri-money-dollar-circle-line" /> Dividendo
                                </button>
                                <button onClick={() => openDividendHistoryModal(asset)} className="flex-1 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-500 text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1">
                                  <i className="ri-history-line" /> Histórico
                                </button>
                                <button onClick={() => openPriceHistoryModal(asset)} className="flex-1 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/40 text-teal-500 text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1">
                                  <i className="ri-line-chart-line" /> Preço
                                </button>
                                <button onClick={() => openPriceAlertModal(asset)} className="flex-1 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-500 text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1">
                                  <i className="ri-notification-3-line" /> Alertas
                                </button>
                              </div>
                            )}
                            {!isLongTermType && !canReceiveDividends && (
                              <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => openPriceHistoryModal(asset)} className="flex-1 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/40 text-teal-500 text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1">
                                  <i className="ri-line-chart-line" /> Histórico
                                </button>
                                <button onClick={() => openPriceAlertModal(asset)} className="flex-1 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-500 text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1">
                                  <i className="ri-notification-3-line" /> Alertas
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left py-3 px-4 text-sm font-medium text-[#9CA3AF]">Ativo</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">{isLongTermType ? 'Saldo Acumulado' : 'Qtd'}</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">Investido</th>
                            {!isLongTermType && <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">Custo Médio</th>}
                            {!isLongTermType && <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">Preço Atual</th>}
                            <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">Posição Atual</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">Rentabilidade</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">Lucro / Prejuízo</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-[#9CA3AF]">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedAssets[type].map((asset: any) => {
                            const hasAlert = getAlert(asset.id);
                            const isAlertTriggered = triggeredAlerts.some(a => a.id === asset.id);
                            const averageCost = asset.average_cost || asset.entry_price || 0;
                            const totalDividends = getTotalDividendsByInvestment(asset.id);
                            const canReceiveDividends = ['FIIs', 'Ações BR'].includes(asset.type);
                            const extraData = getExtraData(asset);
                            const isEncerrado = asset.notes && asset.notes.includes('[RESGATE]');

                            return (
                              <tr
                                key={asset.id}
                                className={`border-b border-white/5 hover:bg-white/5 transition-all group cursor-pointer ${isEncerrado ? 'opacity-50' : ''}`}
                                onClick={() => openDetailModal(asset)}
                              >
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-[#F9FAFB] font-medium">{asset.name}</p>
                                        {isEncerrado && (
                                          <span className="px-2 py-0.5 bg-[#EF4444]/20 text-[#EF4444] rounded text-xs font-bold">Encerrado</span>
                                        )}
                                      </div>
                                      <p className="text-xs text-[#9CA3AF]">{asset.code || '-'}</p>
                                      {extraData && asset.type === 'Previdência Privada' && (
                                        <div className="mt-1 flex gap-1">
                                          <span className="px-2 py-0.5 bg-[#7C3AED]/20 text-[#7C3AED] rounded text-xs font-medium">{extraData.planType}</span>
                                          <span className="px-2 py-0.5 bg-[#EC4899]/20 text-[#EC4899] rounded text-xs font-medium">{extraData.taxRegime}</span>
                                        </div>
                                      )}
                                      {extraData && asset.type === 'Capitalização' && (
                                        <div className="mt-1">
                                          <span className="px-2 py-0.5 bg-[#22C55E]/20 text-[#22C55E] rounded text-xs font-medium">{extraData.institution}</span>
                                        </div>
                                      )}
                                    </div>
                                    {hasAlert && hasAlert.enabled && (
                                      <div className={`w-6 h-6 flex items-center justify-center rounded ${isAlertTriggered ? 'bg-amber-500' : 'bg-amber-500/20'}`} title={`Alerta configurado: ±${hasAlert.threshold}%`}>
                                        <i className={`ri-notification-3-${isAlertTriggered ? 'fill' : 'line'} text-sm ${isAlertTriggered ? 'text-white' : 'text-amber-500'}`}></i>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="text-right py-4 px-4 text-[#7C3AED] text-sm font-medium">
                                  {isLongTermType
                                    ? <span className="text-[#22C55E] font-bold">{formatCurrency(asset.invested)}</span>
                                    : (asset.quantity > 0 ? asset.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 8 }) : '-')
                                  }
                                </td>
                                <td className="text-right py-4 px-4 text-[#F9FAFB]">{formatCurrency(asset.invested)}</td>
                                {!isLongTermType && (
                                  <td className="text-right py-4 px-4">
                                    {averageCost > 0 ? (
                                      <div>
                                        <p className="text-[#7C3AED] font-medium">{formatCurrency(averageCost)}</p>
                                        <p className="text-xs text-[#9CA3AF]">médio</p>
                                      </div>
                                    ) : (
                                      <span className="text-[#9CA3AF] text-sm">-</span>
                                    )}
                                  </td>
                                )}
                                {!isLongTermType && (
                                  <td className="text-right py-4 px-4 text-[#F9FAFB]">{asset.current_value > 0 ? formatCurrency(asset.current_value) : '-'}</td>
                                )}
                                <td className="text-right py-4 px-4 text-[#F9FAFB] font-medium">{formatCurrency(asset.currentPosition)}</td>
                                <td className={`text-right py-4 px-4 font-bold ${asset.status === 'positive' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                                  {asset.profitability >= 0 ? '+' : ''}{asset.profitability.toFixed(2)}%
                                </td>
                                <td className={`text-right py-4 px-4 font-bold ${asset.status === 'positive' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                                  {asset.profit >= 0 ? '+' : ''}{formatCurrency(asset.profit)}
                                </td>
                                <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    {isLongTermType && !isEncerrado && (
                                      <>
                                        <button
                                          onClick={() => openContributionModal(asset)}
                                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#22C55E]/20 hover:bg-[#22C55E]/40 text-[#22C55E] transition-all cursor-pointer"
                                          title="Lançar Parcela"
                                        >
                                          <i className="ri-add-circle-line text-sm" />
                                        </button>
                                        <button
                                          onClick={() => openResgateModal(asset)}
                                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/40 text-[#EF4444] transition-all cursor-pointer"
                                          title="Resgatar / Encerrar"
                                        >
                                          <i className="ri-hand-coin-line text-sm" />
                                        </button>
                                      </>
                                    )}
                                    {canReceiveDividends && (
                                      <>
                                        <button onClick={() => openDividendModal(asset)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#22C55E]/20 hover:bg-[#22C55E]/40 text-[#22C55E] transition-all cursor-pointer" title="Lançar Dividendo">
                                          <i className="ri-money-dollar-circle-line text-sm" />
                                        </button>
                                        <button onClick={() => openDividendHistoryModal(asset)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-500 transition-all cursor-pointer" title="Histórico de Dividendos">
                                          <i className="ri-history-line text-sm" />
                                        </button>
                                      </>
                                    )}
                                    {!isLongTermType && (
                                      <>
                                        <button onClick={() => openPriceHistoryModal(asset)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-teal-500/20 hover:bg-teal-500/40 text-teal-500 transition-all cursor-pointer" title="Ver Histórico de Preço">
                                          <i className="ri-line-chart-line text-sm" />
                                        </button>
                                        <button onClick={() => openPriceAlertModal(asset)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-500 transition-all cursor-pointer" title="Configurar Alerta">
                                          <i className="ri-notification-3-line text-sm" />
                                        </button>
                                      </>
                                    )}
                                    <button onClick={() => openEditInvestment(asset)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#7C3AED]/20 hover:bg-[#7C3AED]/40 text-[#7C3AED] transition-all cursor-pointer" title="Editar">
                                      <i className="ri-edit-line text-sm" />
                                    </button>
                                    <button onClick={() => setConfirmDeleteInvestment(asset)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/40 text-[#EF4444] transition-all cursor-pointer" title="Excluir">
                                      <i className="ri-delete-bin-line text-sm" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ===== TRADE ===== */}
        {activeTab === 'trade' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB]">⚡ Operações de Trade</h2>
              <button
                onClick={() => setShowNewTradeModal(true)}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-lg hover:shadow-[#7C3AED]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base">
                ➕ Novo Trade
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
                <p className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">Resultado do Dia</p>
                <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${tradeResultDay >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{formatCurrency(tradeResultDay)}</p>
              </div>
              <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
                <p className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">Resultado do Mês</p>
                <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${tradeResultMonth >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{formatCurrency(tradeResultMonth)}</p>
              </div>
              <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
                <p className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">Total de Trades</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#F9FAFB]">{trades.length}</p>
              </div>
              <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
                <p className="text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2">Taxa de Acerto</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#7C3AED]">
                  {trades.length > 0 ? ((trades.filter((t) => (t.total || 0) > 0).length / trades.length) * 100).toFixed(0) : '0'}%
                </p>
              </div>
            </div>

            {/* Calendário */}
            <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold text-[#F9FAFB]">📅 Calendário de Resultados</h3>
                <div className="flex items-center gap-2 sm:gap-4">
                  <button onClick={prevMonth} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#0E0B16] hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"><i className="ri-arrow-left-s-line text-lg sm:text-xl text-[#F9FAFB]" /></button>
                  <span className="text-sm sm:text-base font-medium text-[#F9FAFB] min-w-[120px] sm:min-w-[150px] text-center">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                  <button onClick={nextMonth} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#0E0B16] hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"><i className="ri-arrow-right-s-line text-lg sm:text-xl text-[#F9FAFB]" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {weekDays.map((day) => (<div key={day} className="text-center text-xs sm:text-sm font-medium text-[#9CA3AF] py-2">{day}</div>))}
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2">{renderCalendar()}</div>
              <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4 pt-4 border-t border-white/5">
                <div className="flex-1 text-center">
                  <p className="text-xs text-[#9CA3AF] mb-1">📊 Resultado estimado</p>
                  <p className="text-sm font-bold text-[#22C55E]">{formatCurrency(tradeResultDay)}</p>
                </div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#22C55E] rounded" /><span className="text-xs text-[#9CA3AF]">Dia Positivo</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#EF4444] rounded" /><span className="text-xs text-[#9CA3AF]">Dia Negativo</span></div>
              </div>
            </div>

            {/* Histórico */}
            <div className="bg-[#16122A] rounded-xl p-4 sm:p-6 border border-white/5 shadow-lg">
              <h3 className="text-base sm:text-lg font-bold text-[#F9FAFB] mb-4">📊 Histórico de Operações</h3>
              {loadingTrades ? (
                <div className="flex items-center justify-center py-12"><p className="text-[#9CA3AF]">Carregando...</p></div>
              ) : trades.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#9CA3AF] mb-4">Nenhum trade registrado ainda</p>
                  <button
                    onClick={() => setShowNewTradeModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white rounded-xl font-medium cursor-pointer whitespace-nowrap"
                  >
                    Registrar Primeiro Trade
                  </button>
                </div>
              ) : (
                <>
                  <div className="lg:hidden space-y-3">
                    {trades.map((trade) => (
                      <div key={trade.id} className="bg-[#0E0B16] rounded-lg p-4 border border-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <div><p className="text-sm font-medium text-[#F9FAFB]">{trade.symbol || 'N/A'}</p><p className="text-xs text-[#9CA3AF]">{formatDate(trade.date)}</p></div>
                          <p className={`text-base font-bold ${(trade.total || 0) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{formatCurrency(trade.total || 0)}</p>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <span className="px-2 py-1 bg-[#7C3AED]/20 text-[#7C3AED] rounded-lg text-xs font-medium">{trade.type}</span>
                          {trade.quantity && <span className="px-2 py-1 bg-white/5 text-[#9CA3AF] rounded-lg text-xs">Qtd: {trade.quantity}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditTrade(trade)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#7C3AED]/20 hover:bg-[#7C3AED]/40 text-[#7C3AED] transition-all cursor-pointer"><i className="ri-edit-line text-sm" /></button>
                          <button onClick={() => setConfirmDeleteTrade(trade)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#EF4444] hover:bg-[#EF4444]/80 text-[#EF4444] transition-all cursor-pointer"><i className="ri-delete-bin-line text-sm" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="text-left py-3 px-4 text-sm font-medium text-[#9CA3AF]">Data</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-[#9CA3AF]">Ativo</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-[#9CA3AF]">Tipo</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">Qtd</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">Preço</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-[#9CA3AF]">Resultado</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-[#9CA3AF]">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.map((trade) => (
                          <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                            <td className="py-4 px-4 text-[#F9FAFB]">{formatDate(trade.date)}</td>
                            <td className="py-4 px-4 text-[#F9FAFB] font-medium">{trade.symbol || '-'}</td>
                            <td className="py-4 px-4"><span className="px-3 py-1 bg-[#7C3AED]/20 text-[#7C3AED] rounded-lg text-xs font-medium">{trade.type}</span></td>
                            <td className="text-right py-4 px-4 text-[#F9FAFB]">{trade.quantity || '-'}</td>
                            <td className="text-right py-4 px-4 text-[#F9FAFB]">{trade.price ? formatCurrency(trade.price) : '-'}</td>
                            <td className={`text-right py-4 px-4 font-bold ${(trade.total || 0) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{formatCurrency(trade.total || 0)}</td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => openEditTrade(trade)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#7C3AED]/20 hover:bg-[#7C3AED]/40 text-[#7C3AED] transition-all cursor-pointer"><i className="ri-edit-line text-sm" /></button>
                                <button onClick={() => setConfirmDeleteTrade(trade)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#EF4444] hover:bg-[#EF4444]/80 text-[#EF4444] transition-all cursor-pointer"><i className="ri-delete-bin-line text-sm" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Mensagem de Sucesso */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 lg:top-20 z-50">
            <div className="bg-[#22C55E] text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
              <i className="ri-check-line text-2xl" />
              <div><p className="font-bold">Sucesso!</p><p className="text-sm opacity-90">Operação realizada com sucesso</p></div>
            </div>
          </div>
        )}

        {/* Botão Flutuante */}
        <button onClick={openUpdatePricesModal} className="fixed bottom-20 lg:bottom-24 right-4 lg:right-6 w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-2xl hover:shadow-[#7C3AED]/50 text-white rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg z-40 group" title="Atualizar Preços dos Ativos">
          <i className="ri-refresh-line text-xl lg:text-2xl group-hover:rotate-180 transition-transform duration-500" />
        </button>

        {/* ===== MODAL ALERTA DE PREÇO ===== */}
        {showPriceAlertModal && selectedAssetForAlert && (
          <PriceAlertModal
            isOpen={showPriceAlertModal}
            onClose={() => {
              setShowPriceAlertModal(false);
              setSelectedAssetForAlert(null);
            }}
            investmentId={selectedAssetForAlert.id}
            investmentName={selectedAssetForAlert.name}
            currentAlert={getAlert(selectedAssetForAlert.id)}
            onSave={handleSaveAlert}
          />
        )}

        {/* ===== MODAL ATUALIZAR PREÇOS ===== */}
        {showUpdatePricesModal && (
          <UpdatePricesModal
            investments={investments}
            onClose={() => setShowUpdatePricesModal(false)}
            onSave={handleSavePrices}
          />
        )}

        {/* ===== MODAL NOVO INVESTIMENTO ===== */}
        {showNewInvestmentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-0 sm:p-4" onClick={() => setShowNewInvestmentModal(false)}>
            <div className="bg-[#16122A] rounded-none sm:rounded-2xl border border-white/10 w-full h-full sm:h-auto sm:max-w-2xl shadow-2xl sm:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-[#16122A] border-b border-white/5 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div><h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB] mb-1">➕ Novo Investimento</h2><p className="text-xs sm:text-sm text-[#9CA3AF]">Adicione um novo ativo à sua carteira</p></div>
                  <button onClick={() => setShowNewInvestmentModal(false)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"><i className="ri-close-line text-lg sm:text-xl text-[#F9FAFB]" /></button>
                </div>
              </div>
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Tipo de Ativo</label>
                  <select value={newInvestment.type} onChange={(e) => { setNewInvestment({ ...newInvestment, type: e.target.value, name: '', code: '' }); setSimpleTermMonths(0); }} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm cursor-pointer">
                    <option value="Criptomoedas">Criptomoedas</option>
                    <option value="Ações BR">Ações BR</option>
                    <option value="Ações EUA">Ações EUA</option>
                    <option value="Renda Fixa">Renda Fixa</option>
                    <option value="Fundos">Fundos</option>
                    <option value="FIIs">FIIs</option>
                    <option value="ETFs">ETFs</option>
                    <option value="Previdência Privada">Previdência Privada</option>
                    <option value="Capitalização">Capitalização</option>
                    <option value="Consórcio">Consórcio</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                {/* Formulário simplificado para Previdência, Capitalização e Consórcio */}
                {['Previdência Privada', 'Capitalização', 'Consórcio'].includes(newInvestment.type) ? (
                  <>
                    {/* Banner informativo */}
                    <div className={`rounded-xl p-4 border flex items-start gap-3 ${
                      newInvestment.type === 'Previdência Privada' ? 'bg-[#7C3AED]/10 border-[#7C3AED]/20' :
                      newInvestment.type === 'Capitalização' ? 'bg-[#22C55E]/10 border-[#22C55E]/20' :
                      'bg-amber-500/10 border-amber-500/20'
                    }`}>
                      <i className={`text-xl mt-0.5 ${
                      newInvestment.type === 'Previdência Privada' ? 'ri-shield-check-line text-[#7C3AED]' :
                      newInvestment.type === 'Capitalização' ? 'ri-coin-line text-[#22C55E]' :
                      'ri-group-line text-amber-500'
                    }`}></i>
                      <div>
                        <p className="text-sm font-semibold text-[#F9FAFB] mb-1">{newInvestment.type}</p>
                        <p className="text-xs text-[#9CA3AF]">
                          Após cadastrar, acesse a <strong className="text-[#F9FAFB]">Carteira</strong> e clique no card para lançar os aportes mensais. O saldo acumulado cresce a cada lançamento.
                        </p>
                      </div>
                    </div>

                    {/* Nome */}
                    <div>
                      <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                        Nome do Ativo
                        {newInvestment.type !== 'Outros' && (
                          <span className="ml-2 text-xs text-[#7C3AED] font-normal">— selecione da lista ou digite</span>
                        )}
                      </label>
                      <input
                        type="text"
                        placeholder="Nome do plano ou produto..."
                        value={newInvestment.name}
                        onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                        className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                      />
                    </div>

                    {/* Quantidade de meses */}
                    <div>
                      <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Quantidade de Meses</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        placeholder="Ex: 60"
                        value={simpleTermMonths || ''}
                        onChange={(e) => setSimpleTermMonths(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
                      />
                      {simpleTermMonths > 0 && (
                        <p className="text-xs text-[#9CA3AF] mt-1">{(simpleTermMonths / 12).toFixed(1)} anos</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                        Nome do Ativo
                        {newInvestment.type !== 'Outros' && (
                          <span className="ml-2 text-xs text-[#7C3AED] font-normal">— selecione da lista ou digite</span>
                        )}
                      </label>
                      <AssetSearchInput
                        assetType={newInvestment.type}
                        value={newInvestment.name}
                        onChange={(name, symbol) =>
                          setNewInvestment({ ...newInvestment, name, code: symbol || newInvestment.code })
                        }
                        onPriceFound={(price) => {
                          setNewInvestment((prev) => {
                            const qty = prev.quantity || 0;
                            const amount = prev.amount || 0;
                            const newQty = qty === 0 && amount > 0 && price > 0
                              ? parseFloat((amount / price).toFixed(8))
                              : qty;
                            return {
                              ...prev,
                              current_value: parseFloat(price.toFixed(2)),
                              entry_price: prev.entry_price === 0 ? parseFloat(price.toFixed(2)) : prev.entry_price,
                              quantity: newQty,
                            };
                          });
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-1">Quantidade de Cotas/Ações</label>
                        <p className="text-xs text-[#9CA3AF] mb-2">Quantas unidades você possui</p>
                        <input 
                          type="number" 
                          step="0.00000001" 
                          placeholder="Ex: 100" 
                          value={newInvestment.quantity || ''} 
                          onChange={(e) => {
                            const qty = parseFloat(e.target.value) || 0;
                            const entryPrice = newInvestment.entry_price || 0;
                            setNewInvestment({ 
                              ...newInvestment, 
                              quantity: qty,
                              amount: qty > 0 && entryPrice > 0 ? qty * entryPrice : newInvestment.amount
                            });
                          }} 
                          className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-1">Preço de Entrada (R$)</label>
                        <p className="text-xs text-[#9CA3AF] mb-2">Preço quando comprou</p>
                        <input 
                          type="number" 
                          step="0.01" 
                          placeholder="Ex: 346.540,00" 
                          value={newInvestment.entry_price || ''} 
                          onChange={(e) => {
                            const price = parseFloat(e.target.value) || 0;
                            const qty = newInvestment.quantity || 0;
                            setNewInvestment({ 
                              ...newInvestment, 
                              entry_price: price,
                              amount: qty > 0 && price > 0 ? qty * price : newInvestment.amount
                            });
                          }} 
                          className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm" 
                        />
                      </div>
                    </div>
                    {newInvestment.quantity > 0 && newInvestment.entry_price > 0 && (
                      <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-xl p-4">
                        <p className="text-xs text-[#9CA3AF] mb-2">💡 Valor Investido Calculado Automaticamente</p>
                        <p className="text-2xl font-bold text-[#7C3AED]">
                          {formatCurrency(newInvestment.quantity * newInvestment.entry_price)}
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-1">
                          {newInvestment.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 8 })} × {formatCurrency(newInvestment.entry_price)}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Preço Atual (R$)</label>
                      <input type="number" step="0.01" placeholder="Ex: 346.600,00" value={newInvestment.current_value || ''} onChange={(e) => setNewInvestment({ ...newInvestment, current_value: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm" />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Data de Início</label>
                  <input type="date" value={newInvestment.purchase_date} onChange={(e) => setNewInvestment({ ...newInvestment, purchase_date: e.target.value })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Observações (opcional)</label>
                  <textarea rows={3} placeholder="Anotações sobre este investimento..." value={newInvestment.notes} onChange={(e) => setNewInvestment({ ...newInvestment, notes: e.target.value })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all resize-none text-sm" />
                </div>

                {!['Previdência Privada', 'Capitalização', 'Consórcio'].includes(newInvestment.type) && ((newInvestment.quantity > 0 && newInvestment.entry_price > 0 && newInvestment.current_value > 0) || (newInvestment.amount > 0 && newInvestment.entry_price > 0 && newInvestment.current_value > 0)) && (
                  <div className={`rounded-xl p-4 border ${newInvestment.current_value >= newInvestment.entry_price ? 'bg-[#22C55E]/10 border-[#22C55E]/20' : 'bg-[#EF4444]/10 border-[#EF4444]/20'}`}>
                    <p className="text-xs text-[#9CA3AF] mb-2">📊 Resultado estimado</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Variação do preço</p>
                        <p className={`text-sm font-bold ${newInvestment.current_value >= newInvestment.entry_price ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                          {(((newInvestment.current_value - newInvestment.entry_price) / newInvestment.entry_price) * 100).toFixed(4)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#9CA3AF]">Lucro / Prejuízo</p>
                        <p className={`text-xl font-bold ${newInvestment.current_value >= newInvestment.entry_price ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                          {newInvestment.current_value >= newInvestment.entry_price ? '+' : ''}
                          {newInvestment.quantity > 0 
                            ? formatCurrency(newInvestment.quantity * (newInvestment.current_value - newInvestment.entry_price))
                            : formatCurrency(newInvestment.amount * (newInvestment.current_value - newInvestment.entry_price) / newInvestment.entry_price)
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 sm:gap-4 pt-2 pb-2">
                  <button onClick={() => setShowNewInvestmentModal(false)} className="flex-1 px-4 sm:px-6 py-3 bg-white/5 hover:bg-white/10 text-[#F9FAFB] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base">Cancelar</button>
                  <button 
                    onClick={handleCreateInvestment} 
                    disabled={!newInvestment.name || (['Previdência Privada', 'Capitalização', 'Consórcio'].includes(newInvestment.type) && simpleTermMonths <= 0)}
                    className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-lg hover:shadow-[#7C3AED]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base disabled:opacity-50"
                  >
                    Adicionar Investimento
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MODAL EDITAR INVESTIMENTO ===== */}
        {showEditInvestmentModal && editingInvestment && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditInvestmentModal(false)}>
            <div className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-[#16122A] border-b border-white/5 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div><h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB] mb-1">✏️ Editar Investimento</h2><p className="text-xs sm:text-sm text-[#9CA3AF]">Atualize os dados do ativo</p></div>
                  <button onClick={() => setShowEditInvestmentModal(false)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"><i className="ri-close-line text-lg sm:text-xl text-[#F9FAFB]" /></button>
                </div>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Tipo de Ativo</label>
                  <select value={editInvestmentData.type} onChange={(e) => setEditInvestmentData({ ...editInvestmentData, type: e.target.value })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm cursor-pointer">
                    <option value="Criptomoedas">Criptomoedas</option>
                    <option value="Ações BR">Ações BR</option>
                    <option value="Ações EUA">Ações EUA</option>
                    <option value="Renda Fixa">Renda Fixa</option>
                    <option value="Fundos">Fundos</option>
                    <option value="FIIs">FIIs</option>
                    <option value="ETFs">ETFs</option>
                    <option value="Previdência Privada">Previdência Privada</option>
                    <option value="Capitalização">Capitalização</option>
                    <option value="Consórcio">Consórcio</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                {/* Campos específicos para Previdência Privada - Editar */}
                {editInvestmentData.type === 'Previdência Privada' && (
                  <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="ri-shield-check-line text-[#7C3AED] text-xl"></i>
                      <h3 className="text-sm font-bold text-[#F9FAFB]">Dados da Previdência Privada</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Tipo de Plano</label>
                        <select value={editPrevidenciaData.planType} onChange={(e) => setEditPrevidenciaData({ ...editPrevidenciaData, planType: e.target.value })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm cursor-pointer">
                          <option value="PGBL">PGBL</option>
                          <option value="VGBL">VGBL</option>
                        </select>
                        <p className="text-xs text-[#9CA3AF] mt-1">{editPrevidenciaData.planType === 'PGBL' ? 'Plano Gerador de Benefício Livre' : 'Vida Gerador de Benefício Livre'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Regime de Tributação</label>
                        <select value={editPrevidenciaData.taxRegime} onChange={(e) => setEditPrevidenciaData({ ...editPrevidenciaData, taxRegime: e.target.value })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm cursor-pointer">
                          <option value="Progressivo">Progressivo</option>
                          <option value="Regressivo">Regressivo</option>
                        </select>
                        <p className="text-xs text-[#9CA3AF] mt-1">{editPrevidenciaData.taxRegime === 'Progressivo' ? 'Alíquota aumenta com o valor' : 'Alíquota diminui com o tempo'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Contribuição Mensal (R$)</label>
                        <input type="number" step="0.01" placeholder="Ex: 500,00" value={editPrevidenciaData.monthlyContribution || ''} onChange={(e) => setEditPrevidenciaData({ ...editPrevidenciaData, monthlyContribution: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Rendimento Esperado (%a.a.)</label>
                        <input type="number" step="0.01" placeholder="Ex: 8,5" value={editPrevidenciaData.expectedReturn || ''} onChange={(e) => setEditPrevidenciaData({ ...editPrevidenciaData, expectedReturn: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Prazo (meses)</label>
                        <input type="number" step="1" placeholder="Ex: 120" value={editPrevidenciaData.termMonths || ''} onChange={(e) => setEditPrevidenciaData({ ...editPrevidenciaData, termMonths: parseInt(e.target.value) || 0 })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm" />
                        {editPrevidenciaData.termMonths > 0 && (
                          <p className="text-xs text-[#9CA3AF] mt-1">{(editPrevidenciaData.termMonths / 12).toFixed(1)} anos</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Campos específicos para Capitalização - Editar */}
                {editInvestmentData.type === 'Capitalização' && (
                  <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="ri-coin-line text-[#22C55E] text-xl"></i>
                      <h3 className="text-sm font-bold text-[#F9FAFB]">Dados da Capitalização</h3>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Instituição / Produto</label>
                      <input type="text" placeholder="Ex: Ourocap, CapFácil..." value={editCapitalizacaoData.institution} onChange={(e) => setEditCapitalizacaoData({ ...editCapitalizacaoData, institution: e.target.value })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#22C55E]/50 transition-all text-sm" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Mensalidade (R$)</label>
                        <input type="number" step="0.01" placeholder="Ex: 150,00" value={editCapitalizacaoData.monthlyPayment || ''} onChange={(e) => setEditCapitalizacaoData({ ...editCapitalizacaoData, monthlyPayment: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#22C55E]/50 transition-all text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Quantidade de Meses</label>
                        <input type="number" step="1" placeholder="Ex: 24" value={editCapitalizacaoData.termMonths || ''} onChange={(e) => setEditCapitalizacaoData({ ...editCapitalizacaoData, termMonths: parseInt(e.target.value) || 0 })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#22C55E]/50 transition-all text-sm" />
                      </div>
                    </div>
                    {editCapitalizacaoData.monthlyPayment > 0 && editCapitalizacaoData.termMonths > 0 && (
                      <div className="bg-[#0E0B16] rounded-xl p-3 border border-[#22C55E]/20">
                        <p className="text-xs text-[#9CA3AF] mb-1">💡 Total no período</p>
                        <p className="text-lg font-bold text-[#22C55E]">{formatCurrency(editCapitalizacaoData.monthlyPayment * editCapitalizacaoData.termMonths)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Campos específicos para Consórcio - Editar */}
                {editInvestmentData.type === 'Consórcio' && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="ri-group-line text-amber-500 text-xl"></i>
                      <h3 className="text-sm font-bold text-[#F9FAFB]">Dados do Consórcio</h3>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Administradora</label>
                      <input type="text" placeholder="Ex: Porto Seguro, Embracon, Caixa..." value={editConsorcioData.administrator} onChange={(e) => setEditConsorcioData({ ...editConsorcioData, administrator: e.target.value })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-amber-500/50 transition-all text-sm" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Valor Total do Consórcio (R$)</label>
                        <input type="number" step="0.01" placeholder="Ex: 80.000,00" value={editConsorcioData.totalValue || ''} onChange={(e) => setEditConsorcioData({ ...editConsorcioData, totalValue: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-amber-500/50 transition-all text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Quantidade de Meses</label>
                        <input type="number" step="1" placeholder="Ex: 60" value={editConsorcioData.termMonths || ''} onChange={(e) => setEditConsorcioData({ ...editConsorcioData, termMonths: parseInt(e.target.value) || 0 })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-amber-500/50 transition-all text-sm" />
                        {editConsorcioData.termMonths > 0 && (
                          <p className="text-xs text-[#9CA3AF] mt-1">{(editConsorcioData.termMonths / 12).toFixed(1)} anos</p>
                        )}
                      </div>
                    </div>
                    {editConsorcioData.totalValue > 0 && editConsorcioData.termMonths > 0 && (
                      <div className="bg-[#0E0B16] rounded-xl p-3 border border-amber-500/20">
                        <p className="text-xs text-[#9CA3AF] mb-1">💡 Parcela mensal estimada</p>
                        <p className="text-lg font-bold text-amber-500">{formatCurrency(editConsorcioData.totalValue / editConsorcioData.termMonths)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Para tipos normais: mostrar campos de quantidade/preço */}
                {!['Previdência Privada', 'Capitalização', 'Consórcio'].includes(editInvestmentData.type) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                        Nome do Ativo
                        {editInvestmentData.type !== 'Outros' && (
                          <span className="ml-2 text-xs text-[#7C3AED] font-normal">— selecione da lista ou digite</span>
                        )}
                      </label>
                      <AssetSearchInput
                        assetType={editInvestmentData.type}
                        value={editInvestmentData.name}
                        onChange={(name, symbol) => setEditInvestmentData({ ...editInvestmentData, name, code: symbol || editInvestmentData.code })}
                        onPriceFound={(price) => {
                          setEditInvestmentData((prev) => {
                            const qty = prev.quantity || 0;
                            const amount = prev.amount || 0;
                            const newQty = qty === 0 && amount > 0 && price > 0 ? parseFloat((amount / price).toFixed(8)) : qty;
                            return {
                              ...prev,
                              current_value: parseFloat(price.toFixed(2)),
                              entry_price: prev.entry_price === 0 ? parseFloat(price.toFixed(2)) : prev.entry_price,
                              quantity: newQty,
                            };
                          });
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-1">Quantidade de Cotas/Ações</label>
                        <p className="text-xs text-[#9CA3AF] mb-2">Quantas unidades você possui</p>
                        <input type="number" step="0.00000001" placeholder="Ex: 100" value={editInvestmentData.quantity || ''} onChange={(e) => { const qty = parseFloat(e.target.value) || 0; const entryPrice = editInvestmentData.entry_price || 0; setEditInvestmentData({ ...editInvestmentData, quantity: qty, amount: qty > 0 && entryPrice > 0 ? qty * entryPrice : editInvestmentData.amount }); }} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-1">Preço de Entrada (R$)</label>
                        <p className="text-xs text-[#9CA3AF] mb-2">Preço quando comprou</p>
                        <input type="number" step="0.01" value={editInvestmentData.entry_price || ''} onChange={(e) => { const price = parseFloat(e.target.value) || 0; const qty = editInvestmentData.quantity || 0; setEditInvestmentData({ ...editInvestmentData, entry_price: price, amount: qty > 0 && price > 0 ? qty * price : editInvestmentData.amount }); }} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm" />
                      </div>
                    </div>
                    {editInvestmentData.quantity > 0 && editInvestmentData.entry_price > 0 && (
                      <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-xl p-4">
                        <p className="text-xs text-[#9CA3AF] mb-2">💡 Valor Investido Calculado Automaticamente</p>
                        <p className="text-2xl font-bold text-[#7C3AED]">{formatCurrency(editInvestmentData.quantity * editInvestmentData.entry_price)}</p>
                        <p className="text-xs text-[#9CA3AF] mt-1">{editInvestmentData.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 8 })} × {formatCurrency(editInvestmentData.entry_price)}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-[#F9FAFB] mb-1">Valor Investido (R$){editInvestmentData.quantity > 0 && editInvestmentData.entry_price > 0 && <span className="ml-2 text-xs text-[#7C3AED] font-normal">— calculado automaticamente</span>}</label>
                      <input type="number" step="0.01" value={editInvestmentData.quantity > 0 && editInvestmentData.entry_price > 0 ? editInvestmentData.quantity * editInvestmentData.entry_price : editInvestmentData.amount || ''} onChange={(e) => setEditInvestmentData({ ...editInvestmentData, amount: parseFloat(e.target.value) || 0 })} disabled={editInvestmentData.quantity > 0 && editInvestmentData.entry_price > 0} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F9FAFB] mb-1">Preço Atual (R$)</label>
                      <input type="number" step="0.01" value={editInvestmentData.current_value || ''} onChange={(e) => setEditInvestmentData({ ...editInvestmentData, current_value: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm" />
                    </div>
                  </>
                )}

                {/* Para Previdência, Capitalização e Consórcio: apenas nome e valor já pago */}
                {['Previdência Privada', 'Capitalização', 'Consórcio'].includes(editInvestmentData.type) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Nome / Descrição</label>
                      <input type="text" placeholder="Nome do plano ou produto..." value={editInvestmentData.name} onChange={(e) => setEditInvestmentData({ ...editInvestmentData, name: e.target.value })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm" />
                    </div>
                    {editInvestmentData.type !== 'Capitalização' && (
                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-2">{editInvestmentData.type === 'Consórcio' ? 'Valor já pago (R$)' : 'Valor já investido (R$)'}</label>
                        <input type="number" step="0.01" placeholder="Ex: 5.000,00" value={editInvestmentData.amount || ''} onChange={(e) => setEditInvestmentData({ ...editInvestmentData, amount: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm" />
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Data de Início</label>
                  <input type="date" value={editInvestmentData.purchase_date} onChange={(e) => setEditInvestmentData({ ...editInvestmentData, purchase_date: e.target.value })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Observações (opcional)</label>
                  <textarea rows={3} value={editInvestmentData.notes} onChange={(e) => setEditInvestmentData({ ...editInvestmentData, notes: e.target.value })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all resize-none text-sm" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowEditInvestmentModal(false)} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-[#F9FAFB] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm">Cancelar</button>
                  <button onClick={handleUpdateInvestment} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-lg hover:shadow-[#7C3AED]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm">Salvar Alterações</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MODAL CONFIRMAR EXCLUSÃO DE INVESTIMENTO ===== */}
        {confirmDeleteInvestment && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setConfirmDeleteInvestment(null)}>
            <div className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-[#16122A] border-b border-white/5 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div><h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB] mb-1">Excluir Investimento</h2><p className="text-xs sm:text-sm text-[#9CA3AF]">Tem certeza que deseja excluir este ativo?</p></div>
                  <button onClick={() => setConfirmDeleteInvestment(null)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"><i className="ri-close-line text-lg sm:text-xl text-[#F9FAFB]" /></button>
                </div>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-[#9CA3AF] mb-2">Ativo</p>
                  <p className="text-sm font-bold text-[#F9FAFB]">{confirmDeleteInvestment.name}</p>
                </div>
                <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-[#9CA3AF] mb-2">Tipo</p>
                  <p className="text-sm font-bold text-[#F9FAFB]">{confirmDeleteInvestment.type}</p>
                </div>
                <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-[#9CA3AF] mb-2">Investido</p>
                  <p className="text-sm font-bold text-[#F9FAFB]">{formatCurrency(confirmDeleteInvestment.amount)}</p>
                </div>
                <p className="text-xs text-[#9CA3AF]">Esta ação não pode ser desfeita.</p>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setConfirmDeleteInvestment(null)} disabled={deletingInvestmentId === confirmDeleteInvestment.id} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-[#F9FAFB] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm disabled:opacity-50">Cancelar</button>
                  <button onClick={() => handleDeleteInvestment(confirmDeleteInvestment.id)} disabled={deletingInvestmentId === confirmDeleteInvestment.id} className="flex-1 px-4 py-3 bg-[#EF4444] hover:bg-[#EF4444]/80 text-[#EF4444] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {deletingInvestmentId === confirmDeleteInvestment.id ? <><i className="ri-loader-4-line animate-spin" /> Excluindo...</> : <><i className="ri-delete-bin-line" /> Excluir</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MODAL NOVO TRADE ===== */}
        {showNewTradeModal && (
          <>
            {/* Backdrop fora do container flex — sem conflito de posicionamento */}
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowNewTradeModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-start justify-center pointer-events-none">
              <div
                className="relative bg-[#16122A] rounded-none sm:rounded-2xl border border-white/10 w-full h-full sm:h-auto sm:max-w-lg sm:mt-12 shadow-2xl sm:max-h-[92vh] overflow-y-auto pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-[#16122A] border-b border-white/5 p-4 sm:p-6">
                  {/* Indicador de arraste no mobile */}
                  <div className="flex justify-center mb-3 sm:hidden">
                    <div className="w-10 h-1 bg-white/20 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div><h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB] mb-1">⚡ Novo Trade</h2><p className="text-xs sm:text-sm text-[#9CA3AF]">Registre uma nova operação</p></div>
                    <button onClick={() => setShowNewTradeModal(false)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"><i className="ri-close-line text-lg sm:text-xl text-[#F9FAFB]" /></button>
                  </div>
                  <div className="flex gap-1 mt-4 bg-[#0E0B16] rounded-xl p-1">
                    <button onClick={() => setTradeMode('simplificado')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${tradeMode === 'simplificado' ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-md' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'}`}>⚡ Simplificado</button>
                    <button onClick={() => setTradeMode('completo')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${tradeMode === 'completo' ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-md' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'}`}>📋 Completo</button>
                  </div>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Data</label>
                    <input type="date" value={newTrade.date} onChange={(e) => setNewTrade({ ...newTrade, date: e.target.value })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setTradeResultType('gain')} className={`flex-1 px-4 py-4 rounded-xl font-bold transition-all cursor-pointer text-base flex items-center justify-center gap-2 ${tradeResultType === 'gain' ? 'bg-[#22C55E] text-white shadow-lg shadow-[#22C55E]/30 scale-105' : 'bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 border border-[#22C55E]/20'}`}><i className="ri-arrow-up-circle-fill text-2xl" /><span>GAIN</span></button>
                    <button onClick={() => setTradeResultType('loss')} className={`flex-1 px-4 py-4 rounded-xl font-bold transition-all cursor-pointer text-base flex items-center justify-center gap-2 ${tradeResultType === 'loss' ? 'bg-[#EF4444] text-white shadow-lg shadow-[#EF4444]/30 scale-105' : 'bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 border border-[#EF4444]/20'}`}><i className="ri-arrow-down-circle-fill text-2xl" /><span>LOSS</span></button>
                  </div>
                  <div className={`relative rounded-xl border-2 transition-all ${tradeResultType === 'gain' ? 'border-[#22C55E]/40 bg-[#22C55E]/5' : 'border-[#EF4444]/40 bg-[#EF4444]/5'}`}>
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold ${tradeResultType === 'gain' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{tradeResultType === 'gain' ? '+' : '-'} R$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="0,00"
                      value={Math.abs(newTrade.total) || ''}
                      onChange={(e) => setNewTrade({ ...newTrade, total: parseFloat(e.target.value) || 0 })}
                      className={`w-full bg-transparent pl-20 pr-4 py-5 placeholder-[#9CA3AF]/50 focus:outline-none transition-all text-2xl font-bold ${tradeResultType === 'gain' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Ativo (opcional)</label>
                    <div className="flex gap-2 mb-2">
                      {['WIN', 'WDO', 'BIT'].map((sym) => (
                        <button key={sym} type="button" onClick={() => setNewTrade({ ...newTrade, symbol: sym })} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${newTrade.symbol === sym ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-md' : 'bg-[#0E0B16] text-[#9CA3AF] border-white/10 hover:border-[#7C3AED]/50 hover:text-[#F9FAFB]'}`}>{sym}</button>
                      ))}
                    </div>
                    <input type="text" placeholder="Ex: PETR4, BTC, WIN..." value={newTrade.symbol} onChange={(e) => setNewTrade({ ...newTrade, symbol: e.target.value })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Observações (opcional)</label>
                    <textarea rows={2} placeholder="Anotações rápidas..." value={newTrade.notes} onChange={(e) => setNewTrade({ ...newTrade, notes: e.target.value })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all resize-none text-sm" />
                  </div>
                  <div className="flex gap-3 sm:gap-4 pt-2 pb-2">
                    <button onClick={() => setShowNewTradeModal(false)} className="flex-1 px-4 sm:px-6 py-3 bg-white/5 hover:bg-white/10 text-[#F9FAFB] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base">Cancelar</button>
                    <button onClick={handleCreateTrade} className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-lg hover:shadow-[#7C3AED]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base">Registrar</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== MODAL EDITAR TRADE ===== */}
        {showEditTradeModal && editingTrade && createPortal(
          <>
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowEditTradeModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-start justify-center pointer-events-none">
              <div
                className="relative bg-[#16122A] rounded-t-2xl sm:rounded-2xl border border-white/10 w-full sm:max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-[#16122A] border-b border-white/5 p-4 sm:p-6">
                  <div className="flex justify-center mb-3 sm:hidden">
                    <div className="w-10 h-1 bg-white/20 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div><h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB] mb-1">✏️ Editar Trade</h2><p className="text-xs sm:text-sm text-[#9CA3AF]">Altere os dados da operação</p></div>
                    <button onClick={() => setShowEditTradeModal(false)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"><i className="ri-close-line text-lg sm:text-xl text-[#F9FAFB]" /></button>
                  </div>
                  <div className="flex gap-1 mt-4 bg-[#0E0B16] rounded-xl p-1">
                    <button onClick={() => setEditTradeMode('simplificado')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${editTradeMode === 'simplificado' ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-md' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'}`}>⚡ Simplificado</button>
                    <button onClick={() => setEditTradeMode('completo')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${editTradeMode === 'completo' ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-md' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'}`}>📋 Completo</button>
                  </div>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Data</label>
                    <input type="date" value={editTradeData.date} onChange={(e) => setEditTradeData({ ...editTradeData, date: e.target.value })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditTradeResultType('gain')} className={`flex-1 px-4 py-4 rounded-xl font-bold transition-all cursor-pointer text-base flex items-center justify-center gap-2 ${editTradeResultType === 'gain' ? 'bg-[#22C55E] text-white shadow-lg shadow-[#22C55E]/30 scale-105' : 'bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 border border-[#22C55E]/20'}`}><i className="ri-arrow-up-circle-fill text-2xl" /><span>GAIN</span></button>
                    <button onClick={() => setEditTradeResultType('loss')} className={`flex-1 px-4 py-4 rounded-xl font-bold transition-all cursor-pointer text-base flex items-center justify-center gap-2 ${editTradeResultType === 'loss' ? 'bg-[#EF4444] text-white shadow-lg shadow-[#EF4444]/30 scale-105' : 'bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 border border-[#EF4444]/20'}`}><i className="ri-arrow-down-circle-fill text-2xl" /><span>LOSS</span></button>
                  </div>
                  <div className={`relative rounded-xl border-2 transition-all ${editTradeResultType === 'gain' ? 'border-[#22C55E]/40 bg-[#22C55E]/5' : 'border-[#EF4444]/40 bg-[#EF4444]/5'}`}>
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold ${editTradeResultType === 'gain' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{editTradeResultType === 'gain' ? '+' : '-'} R$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="0,00"
                      value={editTradeData.total || ''}
                      onChange={(e) => setEditTradeData({ ...editTradeData, total: parseFloat(e.target.value) || 0 })}
                      className={`w-full bg-transparent pl-20 pr-4 py-5 placeholder-[#9CA3AF]/50 focus:outline-none transition-all text-2xl font-bold ${editTradeResultType === 'gain' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Ativo (opcional)</label>
                    <div className="flex gap-2 mb-2">
                      {['WIN', 'WDO', 'BIT'].map((sym) => (
                        <button key={sym} type="button" onClick={() => setEditTradeData({ ...editTradeData, symbol: sym })} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${editTradeData.symbol === sym ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-md' : 'bg-[#0E0B16] text-[#9CA3AF] border-white/10 hover:border-[#7C3AED]/50 hover:text-[#F9FAFB]'}`}>{sym}</button>
                      ))}
                    </div>
                    <input type="text" placeholder="Ex: PETR4, BTC, WIN..." value={editTradeData.symbol} onChange={(e) => setEditTradeData({ ...editTradeData, symbol: e.target.value })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Observações (opcional)</label>
                    <textarea rows={2} placeholder="Anotações rápidas..." value={editTradeData.notes} onChange={(e) => setEditTradeData({ ...editTradeData, notes: e.target.value })} className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all resize-none text-sm" />
                  </div>
                  <div className="flex gap-3 sm:gap-4 pt-2 pb-2">
                    <button onClick={() => setShowEditTradeModal(false)} className="flex-1 px-4 sm:px-6 py-3 bg-white/5 hover:bg-white/10 text-[#F9FAFB] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base">Cancelar</button>
                    <button onClick={handleUpdateTrade} className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-lg hover:shadow-[#7C3AED]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base">Atualizar</button>
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}

        {/* ===== MODAL CONFIRMAR EXCLUSÃO DE TRADE ===== */}
        {confirmDeleteTrade && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setConfirmDeleteTrade(null)}>
            <div className="bg-[#16122A] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[#EF4444]/20"><i className="ri-delete-bin-2-line text-3xl text-[#EF4444]" /></div>
                <div><h3 className="text-xl font-bold text-[#F9FAFB] mb-1">Excluir Trade</h3><p className="text-sm text-[#9CA3AF]">Tem certeza que deseja excluir esta operação?</p></div>
                <div className="w-full bg-[#0E0B16] rounded-xl p-4 border border-white/5 text-left space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-[#9CA3AF]">Ativo</span><span className="text-[#F9FAFB] font-medium">{confirmDeleteTrade.symbol || '-'}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#9CA3AF]">Data</span><span className="text-[#F9FAFB] font-medium">{formatDate(confirmDeleteTrade.date)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#9CA3AF]">Resultado</span><span className={`font-bold ${(confirmDeleteTrade.total || 0) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{formatCurrency(confirmDeleteTrade.total || 0)}</span></div>
                </div>
                <p className="text-xs text-[#9CA3AF]">Esta ação não pode ser desfeita.</p>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setConfirmDeleteTrade(null)} disabled={deletingId === confirmDeleteTrade.id} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-[#F9FAFB] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm disabled:opacity-50">Cancelar</button>
                  <button onClick={() => handleDeleteTrade(confirmDeleteTrade.id)} disabled={deletingId === confirmDeleteTrade.id} className="flex-1 px-4 py-3 bg-[#EF4444] hover:bg-[#EF4444]/80 text-[#EF4444] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {deletingId === confirmDeleteTrade.id ? <><i className="ri-loader-4-line animate-spin" /> Excluindo...</> : <><i className="ri-delete-bin-line" /> Excluir</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MODAL HISTÓRICO DE PREÇO ===== */}
        {showPriceHistoryModal && selectedAssetForHistory && (
          <PriceHistoryModal
            isOpen={showPriceHistoryModal}
            onClose={() => {
              setShowPriceHistoryModal(false);
              setSelectedAssetForHistory(null);
            }}
            investment={{
              id: selectedAssetForHistory.id,
              name: selectedAssetForHistory.name,
              ticker: selectedAssetForHistory.code,
              type: selectedAssetForHistory.type,
              entry_price: selectedAssetForHistory.entry_price,
              current_value: selectedAssetForHistory.current_value,
              quantity: selectedAssetForHistory.quantity
            }}
          />
        )}

        {/* ===== MODAL DIVIDENDO ===== */}
        {showDividendModal && selectedAssetForDividend && (
          <DividendModal
            isOpen={showDividendModal}
            onClose={() => {
              setShowDividendModal(false);
              setSelectedAssetForDividend(null);
              setEditingDividend(null);
            }}
            investment={{
              id: selectedAssetForDividend.id,
              name: selectedAssetForDividend.name,
              quantity: selectedAssetForDividend.quantity || 0,
            }}
            onSave={handleSaveDividend}
            editingDividend={editingDividend}
          />
        )}

        {/* ===== MODAL HISTÓRICO DE DIVIDENDOS ===== */}
        {showDividendHistoryModal && selectedAssetForDividend && (
          <DividendHistoryModal
            isOpen={showDividendHistoryModal}
            onClose={() => {
              setShowDividendHistoryModal(false);
              setSelectedAssetForDividend(null);
            }}
            investment={{
              id: selectedAssetForDividend.id,
              name: selectedAssetForDividend.name,
              quantity: selectedAssetForDividend.quantity || 0,
              amount: selectedAssetForDividend.amount || 0,
            }}
            onEdit={handleEditDividend}
          />
        )}

        {/* ===== MODAL CONTRIBUIÇÃO ===== */}
        {showContributionModal && selectedInvestmentForContribution && (
          <ContributionModal
            isOpen={showContributionModal}
            onClose={() => {
              setShowContributionModal(false);
              setSelectedInvestmentForContribution(null);
            }}
            investment={selectedInvestmentForContribution}
            onSave={handleContribution}
          />
        )}

        {/* ===== MODAL RESGATE ===== */}
        {showResgateModal && selectedInvestmentForResgate && (
          <ResgateModal
            isOpen={showResgateModal}
            onClose={() => {
              setShowResgateModal(false);
              setSelectedInvestmentForResgate(null);
            }}
            investment={{
              id: selectedInvestmentForResgate.id,
              name: selectedInvestmentForResgate.name,
              type: selectedInvestmentForResgate.type,
              amount: selectedInvestmentForResgate.amount || 0,
              current_value: selectedInvestmentForResgate.current_value || selectedInvestmentForResgate.amount || 0,
            }}
            onSave={handleResgate}
          />
        )}

        {/* ===== MODAL DETALHES DO INVESTIMENTO ===== */}
        {showDetailModal && selectedInvestmentForDetail && (
          <InvestmentDetailModal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedInvestmentForDetail(null);
            }}
            investment={selectedInvestmentForDetail}
            onLancarParcela={() => openContributionModal(selectedInvestmentForDetail)}
            onResgatar={() => openResgateModal(selectedInvestmentForDetail)}
            onEditar={() => openEditInvestment(selectedInvestmentForDetail)}
            onUpdateContribution={handleUpdateContribution}
            onDeleteContribution={handleDeleteContribution}
          />
        )}
      </div>
    </MainLayout>
  );
}
