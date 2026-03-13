import React from 'react';

interface Props {
  cardNumber: string;
  onCardNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cardName: string;
  onCardNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cardExpMonth: string;
  onCardExpMonthChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  cardExpYear: string;
  onCardExpYearChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  cardCvv: string;
  onCardCvvChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cardCpf: string;
  onCardCpfChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cardErrors: Record<string, string>;
  onPay: () => void;
  isProcessing: boolean;
  selectedPlanPrice?: number;
}

export default function CardForm({
  cardNumber,
  onCardNumberChange,
  cardName,
  onCardNameChange,
  cardExpMonth,
  onCardExpMonthChange,
  cardExpYear,
  onCardExpYearChange,
  cardCvv,
  onCardCvvChange,
  cardCpf,
  onCardCpfChange,
  cardErrors,
  onPay,
  isProcessing,
  selectedPlanPrice,
}: Props) {
  return (
    <>
      <div className="space-y-4 mb-5">
        {/* Número do Cartão */}
        <div>
          <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
            Número do Cartão <span className="text-[#EC4899]">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="ri-bank-card-line text-[#9CA3AF] text-base"></i>
            </div>
            <input
              type="text"
              value={cardNumber}
              onChange={onCardNumberChange}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              className={`w-full pl-10 pr-4 py-3 bg-[#0D0A1A] border rounded-xl text-[#F9FAFB] placeholder-[#4B5563] text-sm focus:outline-none focus:ring-2 transition-all ${
                cardErrors.cardNumber
                  ? 'border-red-500 focus:ring-red-500/30'
                  : 'border-white/10 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/60'
              }`}
            />
          </div>
          {cardErrors.cardNumber && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <i className="ri-error-warning-line"></i>
              {cardErrors.cardNumber}
            </p>
          )}
        </div>

        {/* Nome do Titular */}
        <div>
          <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
            Nome do Titular <span className="text-[#EC4899]">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="ri-user-line text-[#9CA3AF] text-base"></i>
            </div>
            <input
              type="text"
              value={cardName}
              onChange={onCardNameChange}
              placeholder="NOME COMO NO CARTÃO"
              className={`w-full pl-10 pr-4 py-3 bg-[#0D0A1A] border rounded-xl text-[#F9FAFB] placeholder-[#4B5563] text-sm focus:outline-none focus:ring-2 transition-all uppercase ${
                cardErrors.cardName
                  ? 'border-red-500 focus:ring-red-500/30'
                  : 'border-white/10 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/60'
              }`}
            />
          </div>
          {cardErrors.cardName && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <i className="ri-error-warning-line"></i>
              {cardErrors.cardName}
            </p>
          )}
        </div>

        {/* Validade e CVV */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Mês <span className="text-[#EC4899]">*</span></label>
            <select
              value={cardExpMonth}
              onChange={onCardExpMonthChange}
              className={`w-full px-3 py-3 bg-[#0D0A1A] border rounded-xl text-[#F9FAFB] text-sm focus:outline-none focus:ring-2 transition-all ${
                cardErrors.cardExpMonth
                  ? 'border-red-500 focus:ring-red-500/30'
                  : 'border-white/10 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/60'
              }`}
            >
              <option value="">MM</option>
              {Array.from({ length: 12 }, (_, i) => {
                const month = String(i + 1).padStart(2, '0');
                return <option key={month} value={month}>{month}</option>;
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Ano <span className="text-[#EC4899]">*</span></label>
            <select
              value={cardExpYear}
              onChange={onCardExpYearChange}
              className={`w-full px-3 py-3 bg-[#0D0A1A] border rounded-xl text-[#F9FAFB] text-sm focus:outline-none focus:ring-2 transition-all ${
                cardErrors.cardExpYear
                  ? 'border-red-500 focus:ring-red-500/30'
                  : 'border-white/10 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/60'
              }`}
            >
              <option value="">AA</option>
              {Array.from({ length: 15 }, (_, i) => {
                const year = String(new Date().getFullYear() + i).slice(-2);
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-2">CVV <span className="text-[#EC4899]">*</span></label>
            <input
              type="text"
              value={cardCvv}
              onChange={onCardCvvChange}
              placeholder="123"
              maxLength={4}
              className={`w-full px-3 py-3 bg-[#0D0A1A] border rounded-xl text-[#F9FAFB] placeholder-[#4B5563] text-sm focus:outline-none focus:ring-2 transition-all ${
                cardErrors.cardCvv
                  ? 'border-red-500 focus:ring-red-500/30'
                  : 'border-white/10 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/60'
              }`}
            />
          </div>
        </div>

        {/* CPF do Titular */}
        <div>
          <label className="block text-sm font-medium text-[#9CA3AF] mb-2">CPF do Titular <span className="text-[#EC4899]">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="ri-id-card-line text-[#9CA3AF] text-base"></i>
            </div>
            <input
              type="text"
              value={cardCpf}
              onChange={onCardCpfChange}
              placeholder="000.000.000-00"
              maxLength={14}
              className={`w-full pl-10 pr-4 py-3 bg-[#0D0A1A] border rounded-xl text-[#F9FAFB] placeholder-[#4B5563] text-sm focus:outline-none focus:ring-2 transition-all ${
                cardErrors.cardCpf
                  ? 'border-red-500 focus:ring-red-500/30'
                  : 'border-white/10 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/60'
              }`}
            />
          </div>
          {cardErrors.cardCpf && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <i className="ri-error-warning-line"></i>
              {cardErrors.cardCpf}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={onPay}
        disabled={isProcessing}
        className="w-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white font-bold py-4 px-6 rounded-xl transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-[#7C3AED]/25"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
            Processando...
          </>
        ) : (
          <>
            <i className="ri-bank-card-line mr-3 text-lg"></i>
            Pagar com Cartão - R$ {selectedPlanPrice?.toFixed(2).replace('.', ',')}
          </>
        )}
      </button>
    </>
  );
}
