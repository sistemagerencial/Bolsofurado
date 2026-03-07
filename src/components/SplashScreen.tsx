import { useEffect } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      onFinish();
    }, 4000);

    return () => clearTimeout(timeout);
  }, [onFinish]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[100]"
      style={{ background: '#0E0B16' }}
    >
      {/* Brilho sutil de fundo */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Conteúdo central */}
      <div className="relative z-10 flex flex-col items-center gap-6" style={{ animation: 'fade-in 0.8s ease-out forwards' }}>

        {/* Logo */}
        <div
          className="w-20 h-20 flex items-center justify-center rounded-2xl"
          style={{
            background: 'rgba(124,58,237,0.12)',
            border: '1px solid rgba(124,58,237,0.25)',
            animation: 'scale-in 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}
        >
          <img
            src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/d897479ec7a02c7e53f2d5e4c64f1a14.png"
            alt="Bolso Furado"
            className="w-12 h-12 object-contain"
          />
        </div>

        {/* Nome */}
        <div className="flex flex-col items-center gap-1" style={{ animation: 'fade-up 0.7s ease-out 0.3s both' }}>
          <span className="text-xl font-semibold tracking-wide text-white">
            Bolso Furado
          </span>
          <span className="text-xs tracking-widest uppercase" style={{ color: 'rgba(196,181,253,0.5)' }}>
            Gestão Financeira
          </span>
        </div>

        {/* Barra de progresso */}
        <div
          className="w-32 h-0.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)', animation: 'fade-up 0.7s ease-out 0.5s both' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
              animation: 'progress 3.6s ease-in-out forwards',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progress {
          0% { width: 0%; }
          40% { width: 50%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
