import { useState, useEffect } from 'react';

interface Investment {
  id: string;
  name: string;
  quantity: number;
}

interface DividendModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment;
  onSave: (dividend: {
    investment_id: string;
    payment_date: string;
    value_per_share: number;
    total_received: number;
    dividend_type: string;
    notes?: string;
  }) => Promise<void>;
  editingDividend?: {
    id: string;
    payment_date: string;
    value_per_share: number;
    total_received: number;
    dividend_type: string;
    notes?: string;
  } | null;
}

export const DividendModal = ({ isOpen, onClose, investment, onSave, editingDividend }: DividendModalProps) => {
  const [paymentDate, setPaymentDate] = useState('');
  const [valuePerShare, setValuePerShare] = useState('');
  const [totalReceived, setTotalReceived] = useState('');
  const [dividendType, setDividendType] = useState('Dividendo');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(true);

  useEffect(() => {
    if (editingDividend) {
      setPaymentDate(editingDividend.payment_date);
      setValuePerShare(editingDividend.value_per_share.toString());
      setTotalReceived(editingDividend.total_received.toString());
      setDividendType(editingDividend.dividend_type);
      setNotes(editingDividend.notes || '');
      setAutoCalculate(false);
    } else {
      resetForm();
    }
  }, [editingDividend, isOpen]);

  useEffect(() => {
    if (autoCalculate && valuePerShare && investment.quantity) {
      const calculated = Number(valuePerShare) * investment.quantity;
      setTotalReceived(calculated.toFixed(2));
    }
  }, [valuePerShare, investment.quantity, autoCalculate]);

  const resetForm = () => {
    setPaymentDate('');
    setValuePerShare('');
    setTotalReceived('');
    setDividendType('Dividendo');
    setNotes('');
    setAutoCalculate(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentDate || !valuePerShare || !totalReceived) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        investment_id: investment.id,
        payment_date: paymentDate,
        value_per_share: Number(valuePerShare),
        total_received: Number(totalReceived),
        dividend_type: dividendType,
        notes: notes || undefined,
      });
      resetForm();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar dividendo:', error);
      alert('Erro ao salvar dividendo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {editingDividend ? 'Editar Dividendo' : '💰 Lançar Dividendo'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{investment.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Pagamento *
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Provento *
            </label>
            <select
              value={dividendType}
              onChange={(e) => setDividendType(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            >
              <option value="Dividendo">Dividendo</option>
              <option value="JCP">JCP (Juros sobre Capital Próprio)</option>
              <option value="Rendimento">Rendimento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor por Cota/Ação *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                value={valuePerShare}
                onChange={(e) => {
                  setValuePerShare(e.target.value);
                  setAutoCalculate(true);
                }}
                className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="0,00"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Quantidade de cotas: {investment.quantity}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Recebido *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                value={totalReceived}
                onChange={(e) => {
                  setTotalReceived(e.target.value);
                  setAutoCalculate(false);
                }}
                className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="0,00"
                required
              />
            </div>
            {autoCalculate && valuePerShare && (
              <p className="text-xs text-teal-600 mt-1">
                ✓ Calculado automaticamente
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
              placeholder="Informações adicionais..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : editingDividend ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};