
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function EmailConfirmadoPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/login', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E0B16] via-[#16122A] to-[#0E0B16] flex items-center justify-center p-4">
      {/* Blobs decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#EC4899]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#10B981]/8 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/d897479ec7a02c7e53f2d5e4c64f1a14.png"
            alt="Bolso Furado"
            className="h-20 w-auto object-contain"
          />
        </div>

        {/* Card */}
        <div className="bg-[#16122A] border border-white/10 rounded-2xl p-10 shadow-2xl">
          {/* Ícone animado */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#10B981]/20 to-[#10B981]/5 border border-[#10B981]/30 flex items-center justify-center animate-pulse">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#10B981]/30 to-[#10B981]/10 flex items-center justify-center">
                  <i className="ri-checkbox-circle-fill text-[#10B981] text-3xl w-8 h-8 flex items-center justify-center"></i>
                </div>
              </div>
              {/* Partículas decorativas */}
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#10B981]/40 animate-ping"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-[#7C3AED]/40 animate-ping" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[#F9FAFB] mb-3">
            E-mail confirmado! 🎉
          </h1>
          <p className="text-[#9CA3AF] text-sm leading-relaxed mb-2">
            Sua conta foi verificada com sucesso. Agora você tem acesso completo ao <span className="text-[#F9FAFB] font-medium">Bolso Furado</span>.
          </p>
          <p className="text-[#6B7280] text-xs mb-8">
            Comece a organizar suas finanças e alcançar seus objetivos!
          </p>

          {/* Divisor */}
          <div className="h-px bg-white/10 mb-6"></div>

          {/* Benefícios rápidos */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-bar-chart-2-line text-[#7C3AED] text-lg"></i>
              </div>
              <span className="text-[10px] text-[#9CA3AF] text-center leading-tight">Controle de gastos</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-funds-line text-[#EC4899] text-lg"></i>
              </div>
              <span className="text-[10px] text-[#9CA3AF] text-center leading-tight">Investimentos</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-target-line text-[#10B981] text-lg"></i>
              </div>
              <span className="text-[10px] text-[#9CA3AF] text-center leading-tight">Metas financeiras</span>
            </div>
          </div>

          {/* Botão principal */}
          <Link
            to="/login"
            className="block w-full py-3 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white font-semibold text-sm transition-all shadow-lg shadow-[#7C3AED]/30 cursor-pointer whitespace-nowrap text-center"
          >
            Entrar na minha conta
          </Link>

          {/* Contador regressivo */}
          <p className="text-xs text-[#6B7280] mt-4">
            Redirecionando automaticamente em{' '}
            <span className="text-[#7C3AED] font-semibold">{countdown}s</span>
          </p>
        </div>
      </div>
    </div>
  );
}
