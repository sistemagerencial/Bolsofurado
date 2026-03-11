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
        <div style={{ animation: 'fade-in 0.6s ease-out forwards' }}>
          <img
            src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/d897479ec7a02c7e53f2d5e4c64f1a14.png"
            alt="Bolso Furado"
            className="w-40 h-40 sm:w-52 sm:h-52 object-contain"
            style={{ filter: 'drop-shadow(0 18px 36px rgba(124,58,237,0.30))', animation: 'scale-in 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
          />
        </div>

          {/* Apenas logo grande e barra de progresso */}
          <div style={{ height: 18 }} />

          <div
            className="w-48 sm:w-64 h-0.5 rounded-full overflow-hidden"
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
          to { opacity: 1; transform: scale(1.06); }
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
