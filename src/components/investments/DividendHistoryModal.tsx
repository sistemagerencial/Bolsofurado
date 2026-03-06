import { useState, useMemo } from 'react';
import { useDividends } from '../../hooks/useDividends';

interface Investment {
  id: string;
  name: string;
  quantity: number;
  amount: number;
}

interface DividendHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment;
  onEdit: (dividend: any) => void;
}

export const DividendHistoryModal = ({ isOpen, onClose, investment, onEdit }: DividendHistoryModalProps) => {
  const { dividends, deleteDividend, loading } = useDividends();
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const investmentDividends = useMemo(() => {
    let filtered = dividends.filter(d => d.investment_id === investment.id);

    // Filtro por período
    if (filterPeriod !== 'all') {
      const now = new Date();
      filtered = filtered.filter(d => {
        const date = new Date(d.payment_date);
        if (filterPeriod === 'month') {
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        } else if (filterPeriod === 'year') {
          return date.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(d => d.dividend_type === filterType);
    }

    return filtered;
  }, [dividends, investment.id, filterPeriod, filterType]);

  const totalReceived = useMemo(() => {
    return investmentDividends.reduce((sum, d) => sum + Number(d.total_received), 0);
  }, [investmentDividends]);

  const yieldOnCost = useMemo(() => {
    if (!investment.amount || investment.amount === 0) return 0;
    return (totalReceived / investment.amount) * 100;
  }, [totalReceived, investment.amount]);

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este dividendo?')) {
      try {
        await deleteDividend(id);
      } catch (error) {
        alert('Erro ao excluir dividendo');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              💰 Histórico de Dividendos
            </h2>
            <p className="text-teal-50 text-sm mt-1">{investment.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-200">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-600 mb-1">Total Recebido</p>
            <p className="text-2xl font-bold text-teal-600">
              R$ {totalReceived.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-600 mb-1">Yield on Cost</p>
            <p className="text-2xl font-bold text-emerald-600">
              {yieldOnCost.toFixed(2)}%
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-600 mb-1">Pagamentos</p>
            <p className="text-2xl font-bold text-gray-900">
              {investmentDividends.length}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex flex-wrap gap-3">
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="all">Todos os períodos</option>
            <option value="month">Este mês</option>
            <option value="year">Este ano</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="all">Todos os tipos</option>
            <option value="Dividendo">Dividendo</option>
            <option value="JCP">JCP</option>
            <option value="Rendimento">Rendimento</option>
          </select>
        </div>

        {/* Tabela */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <i className="ri-loader-4-line text-4xl text-teal-600 animate-spin"></i>
              <p className="text-gray-600 mt-4">Carregando...</p>
            </div>
          ) : investmentDividends.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-inbox-line text-6xl text-gray-300"></i>
              <p className="text-gray-600 mt-4">Nenhum dividendo encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Data</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Valor/Cota</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Total</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Yield</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {investmentDividends.map((dividend) => {
                    const yieldValue = investment.amount > 0 
                      ? (Number(dividend.total_received) / investment.amount) * 100 
                      : 0;

                    return (
                      <tr key={dividend.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {new Date(dividend.payment_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            dividend.dividend_type === 'Dividendo' 
                              ? 'bg-teal-100 text-teal-700'
                              : dividend.dividend_type === 'JCP'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {dividend.dividend_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-900">
                          R$ {Number(dividend.value_per_share).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-semibold text-teal-600">
                          R$ {Number(dividend.total_received).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-emerald-600 font-medium">
                          {yieldValue.toFixed(2)}%
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => onEdit(dividend)}
                              className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <i className="ri-pencil-line text-lg"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(dividend.id)}
                              className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <i className="ri-delete-bin-line text-lg"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};