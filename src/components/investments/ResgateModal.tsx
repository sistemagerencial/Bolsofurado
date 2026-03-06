import { useState } from 'react';

interface ResgateModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: {
    id: string;
    name: string;
    type: string;
    amount: number;
    current_value: number;
  };
  onSave: (resgateData: {
    date: string;
    value: number;
    reason: string;
    notes: string;
  }) => Promise<void>;
}

export default function ResgateModal({ isOpen, onClose, investment, onSave }: ResgateModalProps) {
  const [resgateData, setResgateData] = useState({
    date: new Date().toISOString().split('T')[0],
    value: investment.current_value || investment.amount || 0,
    reason: 'Vencimento',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleSave = async () => {
    if (resgateData.value <= 0) {
      alert('Por favor, informe o valor resgatado');
      return;
    }

    setSaving(true);
    try {
      await onSave(resgateData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar resgate:', error);
      alert('Erro ao salvar resgate');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const motivoOptions = [
    'Resgate antecipado',
    'Contemplação',
    'Vencimento',
    'Encerramento',
    'Outro',
  ];

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
        <div className="sticky top-0 bg-[#16122A] border-b border-white/5 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB] mb-1">
                💰 Resgatar / Dar Baixa
              </h2>
              <p className="text-xs sm:text-sm text-[#9CA3AF]">
                {investment.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
            >
              <i className="ri-close-line text-lg sm:text-xl text-[#F9FAFB]"></i>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Informações do Investimento */}
          <div className="bg-[#0E0B16] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center">
                <i className="ri-information-line text-[#7C3AED] text-xl"></i>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F9FAFB]">Informações do Investimento</p>
                <p className="text-xs text-[#9CA3AF]">{investment.type}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#9CA3AF]">Valor Investido</span>
                <span className="text-[#F9FAFB] font-medium">
                  {formatCurrency(investment.amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9CA3AF]">Valor Atual</span>
                <span className="text-[#F9FAFB] font-medium">
                  {formatCurrency(investment.current_value || investment.amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Data do Resgate */}
          <div>
            <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
              Data do Resgate
            </label>
            <input
              type="date"
              value={resgateData.date}
              onChange={(e) =>
                setResgateData({ ...resgateData, date: e.target.value })
              }
              className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
            />
          </div>

          {/* Valor Resgatado */}
          <div>
            <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
              Valor Resgatado (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#9CA3AF]">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={resgateData.value || ''}
                onChange={(e) =>
                  setResgateData({
                    ...resgateData,
                    value: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-[#0E0B16] border border-white/5 rounded-xl pl-12 pr-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm"
              />
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Valor que você recebeu ou receberá no resgate
            </p>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
              Motivo do Resgate
            </label>
            <select
              value={resgateData.reason}
              onChange={(e) =>
                setResgateData({ ...resgateData, reason: e.target.value })
              }
              className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED]/50 transition-all text-sm cursor-pointer"
            >
              {motivoOptions.map((motivo) => (
                <option key={motivo} value={motivo}>
                  {motivo}
                </option>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
              Observações (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Detalhes sobre o resgate..."
              value={resgateData.notes}
              onChange={(e) =>
                setResgateData({ ...resgateData, notes: e.target.value })
              }
              className="w-full bg-[#0E0B16] border border-white/5 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED]/50 transition-all resize-none text-sm"
            />
          </div>

          {/* Resumo */}
          {resgateData.value > 0 && (
            <div
              className={`rounded-xl p-4 border ${
                resgateData.value >= investment.amount
                  ? 'bg-[#22C55E]/10 border-[#22C55E]/20'
                  : 'bg-[#EF4444]/10 border-[#EF4444]/20'
              }`}
            >
              <p className="text-xs text-[#9CA3AF] mb-2">📊 Resultado do Resgate</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#9CA3AF]">Lucro / Prejuízo</p>
                  <p
                    className={`text-xl font-bold ${
                      resgateData.value >= investment.amount
                        ? 'text-[#22C55E]'
                        : 'text-[#EF4444]'
                    }`}
                  >
                    {resgateData.value >= investment.amount ? '+' : ''}
                    {formatCurrency(resgateData.value - investment.amount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#9CA3AF]">Rentabilidade</p>
                  <p
                    className={`text-xl font-bold ${
                      resgateData.value >= investment.amount
                        ? 'text-[#22C55E]'
                        : 'text-[#EF4444]'
                    }`}
                  >
                    {resgateData.value >= investment.amount ? '+' : ''}
                    {(
                      ((resgateData.value - investment.amount) / investment.amount) *
                      100
                    ).toFixed(2)}
                    %
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Aviso */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <i className="ri-alert-line text-amber-500 text-xl mt-0.5"></i>
              <div>
                <p className="text-sm font-semibold text-[#F9FAFB] mb-1">
                  ⚠️ Atenção
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  Ao confirmar o resgate, este investimento será marcado como encerrado.
                  O histórico será mantido para consulta futura.
                </p>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 sm:gap-4 pt-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 sm:px-6 py-3 bg-white/5 hover:bg-white/10 text-[#F9FAFB] rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || resgateData.value <= 0}
              className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:shadow-lg hover:shadow-[#7C3AED]/30 text-white rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Salvando...
                </>
              ) : (
                <>
                  <i className="ri-check-line"></i>
                  Confirmar Resgate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}