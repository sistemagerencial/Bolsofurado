
import { useEffect } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    // Finalizar após a animação da logo
    const timeout = setTimeout(() => {
      onFinish();
    }, 2800);

    return () => {
      clearTimeout(timeout);
    };
  }, [onFinish]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0E0B16] via-[#16122A] to-[#0E0B16] flex items-center justify-center z-[100]">
      {/* Efeitos de fundo sutis */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-[#7C3AED]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-[#EC4899]/10 rounded-full blur-3xl"></div>
      </div>

      {/* Logo com animação sutil */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-32 h-32 animate-logo-fade">
          <div className="absolute inset-0 animate-logo-glow"></div>
          <img 
            src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/329df8a96fbfb4f61300025c05375e5e.png" 
            alt="Bolso Furado" 
            className="w-full h-full object-contain relative z-10"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
      </div>

      {/* Estilos de animação */}
      <style>{`
        @keyframes logo-fade {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          30% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes logo-glow {
          0% {
            box-shadow: 0 0 0 rgba(124, 58, 237, 0);
            border-radius: 50%;
          }
          30% {
            box-shadow: 0 0 0 rgba(124, 58, 237, 0);
          }
          50% {
            box-shadow: 0 0 40px rgba(124, 58, 237, 0.4), 0 0 80px rgba(236, 72, 153, 0.2);
          }
          70% {
            box-shadow: 0 0 30px rgba(124, 58, 237, 0.3), 0 0 60px rgba(236, 72, 153, 0.15);
          }
          100% {
            box-shadow: 0 0 20px rgba(124, 58, 237, 0.2), 0 0 40px rgba(236, 72, 153, 0.1);
          }
        }

        .animate-logo-fade {
          animation: logo-fade 1.8s ease-out forwards;
        }

        .animate-logo-glow {
          animation: logo-glow 2.5s ease-in-out forwards;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
