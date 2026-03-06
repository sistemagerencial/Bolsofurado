import { useState, useEffect } from 'react';

interface PriceAlert {
  threshold: number;
  type: 'up' | 'down' | 'both';
  enabled: boolean;
}

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  investmentId: string;
  investmentName: string;
  currentAlert?: PriceAlert;
  onSave: (alert: PriceAlert) => void;
}

export default function PriceAlertModal({
  isOpen,
  onClose,
  investmentId,
  investmentName,
  currentAlert,
  onSave,
}: PriceAlertModalProps) {
  const [threshold, setThreshold] = useState(5);
  const [type, setType] = useState<'up' | 'down' | 'both'>('both');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (currentAlert) {
      setThreshold(currentAlert.threshold);
      setType(currentAlert.type);
      setEnabled(currentAlert.enabled);
    }
  }, [currentAlert]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ threshold, type, enabled });
    onClose();
  };

  const handleRemove = () => {
    onSave({ threshold: 0, type: 'both', enabled: false });
    onClose();
  };

  const presetValues = [3, 5, 10, 15, 20];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <i className="ri-notification-3-line text-xl text-amber-600"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Configurar Alerta</h2>
                <p className="text-sm text-gray-500">{investmentName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <i className="ri-close-line text-xl text-gray-400"></i>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Toggle Ativar/Desativar */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <i className={`ri-notification-${enabled ? 'fill' : 'line'} text-2xl ${enabled ? 'text-amber-600' : 'text-gray-400'}`}></i>
              <div>
                <p className="font-semibold text-gray-900">Alerta {enabled ? 'Ativo' : 'Inativo'}</p>
                <p className="text-sm text-gray-500">
                  {enabled ? 'Você será notificado quando o limite for atingido' : 'Nenhuma notificação será enviada'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                enabled ? 'bg-amber-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              ></div>
            </button>
          </div>

          {/* Tipo de Alerta */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tipo de Alerta
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setType('up')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  type === 'up'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <i className="ri-arrow-up-line text-2xl text-green-600 mb-2"></i>
                <p className="text-sm font-semibold text-gray-900">Subida</p>
                <p className="text-xs text-gray-500 mt-1">Apenas alta</p>
              </button>

              <button
                onClick={() => setType('down')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  type === 'down'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <i className="ri-arrow-down-line text-2xl text-red-600 mb-2"></i>
                <p className="text-sm font-semibold text-gray-900">Queda</p>
                <p className="text-xs text-gray-500 mt-1">Apenas baixa</p>
              </button>

              <button
                onClick={() => setType('both')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  type === 'both'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <i className="ri-arrow-up-down-line text-2xl text-purple-600 mb-2"></i>
                <p className="text-sm font-semibold text-gray-900">Ambos</p>
                <p className="text-xs text-gray-500 mt-1">Alta e baixa</p>
              </button>
            </div>
          </div>

          {/* Percentual de Variação */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Percentual de Variação
            </label>
            
            {/* Valores Predefinidos */}
            <div className="flex gap-2 mb-4">
              {presetValues.map((value) => (
                <button
                  key={value}
                  onClick={() => setThreshold(value)}
                  className={`flex-1 py-2 px-3 rounded-lg border-2 font-semibold transition-all whitespace-nowrap ${
                    threshold === value
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  ±{value}%
                </button>
              ))}
            </div>

            {/* Input Customizado */}
            <div className="relative">
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Math.max(0.1, Math.min(100, Number(e.target.value))))}
                min="0.1"
                max="100"
                step="0.1"
                className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-lg font-semibold text-gray-900"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-400">
                %
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Valor entre 0,1% e 100%
            </p>
          </div>

          {/* Preview do Alerta */}
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <div className="flex items-start gap-3">
              <i className="ri-information-line text-xl text-amber-600 mt-0.5"></i>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Como funciona?
                </p>
                <p className="text-sm text-gray-600">
                  {type === 'up' && `Você será notificado quando o ativo subir mais de ${threshold}% em relação ao preço de entrada.`}
                  {type === 'down' && `Você será notificado quando o ativo cair mais de ${threshold}% em relação ao preço de entrada.`}
                  {type === 'both' && `Você será notificado quando o ativo subir ou cair mais de ${threshold}% em relação ao preço de entrada.`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          {currentAlert && currentAlert.enabled && (
            <button
              onClick={handleRemove}
              className="flex-1 py-3 px-4 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors whitespace-nowrap"
            >
              Remover Alerta
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors whitespace-nowrap"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors whitespace-nowrap"
          >
            Salvar Alerta
          </button>
        </div>
      </div>
    </div>
  );
}