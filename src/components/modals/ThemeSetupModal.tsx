import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeSetupModalProps {
  onComplete: () => void;
}

export function ThemeSetupModal({ onComplete }: ThemeSetupModalProps) {
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>(theme);
  const [isApplying, setIsApplying] = useState(false);

  const handleThemeSelect = (newTheme: 'light' | 'dark') => {
    setSelectedTheme(newTheme);
    // Aplica o tema imediatamente para preview
    setTheme(newTheme);
  };

  const handleConfirm = async () => {
    setIsApplying(true);
    
    // Salva a preferência no localStorage
    localStorage.setItem('theme', selectedTheme);
    localStorage.setItem('theme_configured', 'true');
    
    // Pequeno delay para animação
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="bg-background border border-border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative p-8 text-center border-b border-border bg-gradient-to-br from-primary-500/10 to-secondary-500/10">
          <div className="flex justify-center mb-6">
            {selectedTheme === 'dark' ? (
              <img
                src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/329df8a96fbfb4f61300025c05375e5e.png"
                alt="Bolso Furado"
                className="w-20 h-20 object-contain"
              />
            ) : (
              <img
                src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/db516023f2c5c0cb8f3941abb7658868.png"
                alt="Bolso Furado"
                className="w-20 h-20 object-contain"
              />
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Personalize sua Experiência
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Escolha o tema que melhor se adapta ao seu ambiente de trabalho
          </p>
        </div>

        {/* Theme Selection */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Tema Escuro */}
            <button
              onClick={() => handleThemeSelect('dark')}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-300 group
                ${selectedTheme === 'dark'
                  ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20'
                  : 'border-border hover:border-primary-500 hover:shadow-lg'
                }
              `}
            >
              {/* Preview do Tema Escuro */}
              <div className="bg-gray-900 rounded-xl p-4 mb-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/329df8a96fbfb4f61300025c05375e5e.png"
                    alt="Logo Escura"
                    className="w-8 h-8 object-contain"
                  />
                  <div className="flex-1">
                    <div className="w-20 h-2.5 bg-gray-700 rounded mb-1.5"></div>
                    <div className="w-16 h-2 bg-gray-600 rounded"></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-10 bg-gray-800 rounded-lg border border-gray-700"></div>
                  <div className="h-10 bg-gray-700 rounded-lg border border-gray-600"></div>
                  <div className="h-10 bg-gray-800 rounded-lg border border-gray-700"></div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <i className="ri-moon-line text-xl text-foreground"></i>
                  <span className="text-xl font-semibold text-foreground">Tema Escuro</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Ideal para ambientes com pouca luz
                </div>
              </div>
              
              {/* Indicador de Seleção */}
              {selectedTheme === 'dark' && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <i className="ri-check-line text-white text-lg"></i>
                </div>
              )}

              {/* Efeito de Hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/5 to-secondary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            {/* Tema Claro */}
            <button
              onClick={() => handleThemeSelect('light')}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-300 group
                ${selectedTheme === 'light'
                  ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20'
                  : 'border-border hover:border-primary-500 hover:shadow-lg'
                }
              `}
            >
              {/* Preview do Tema Claro */}
              <div className="bg-white rounded-xl p-4 mb-4 border-2 border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/db516023f2c5c0cb8f3941abb7658868.png"
                    alt="Logo Clara"
                    className="w-8 h-8 object-contain"
                  />
                  <div className="flex-1">
                    <div className="w-20 h-2.5 bg-gray-300 rounded mb-1.5"></div>
                    <div className="w-16 h-2 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-10 bg-gray-50 rounded-lg border border-gray-200"></div>
                  <div className="h-10 bg-white rounded-lg border border-gray-300"></div>
                  <div className="h-10 bg-gray-50 rounded-lg border border-gray-200"></div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <i className="ri-sun-line text-xl text-foreground"></i>
                  <span className="text-xl font-semibold text-foreground">Tema Claro</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Perfeito para ambientes bem iluminados
                </div>
              </div>
              
              {/* Indicador de Seleção */}
              {selectedTheme === 'light' && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <i className="ri-check-line text-white text-lg"></i>
                </div>
              )}

              {/* Efeito de Hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/5 to-secondary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>

          {/* Características do Tema Selecionado */}
          <div className="bg-muted/50 rounded-xl p-4 mb-6 border border-border/50">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <i className="ri-palette-line text-primary-500"></i>
              Características do {selectedTheme === 'dark' ? 'Tema Escuro' : 'Tema Claro'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
              {selectedTheme === 'dark' ? (
                <>
                  <div className="flex items-center gap-2">
                    <i className="ri-eye-line text-green-500"></i>
                    <span>Reduz o cansaço visual</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-battery-line text-green-500"></i>
                    <span>Economiza bateria</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-moon-line text-green-500"></i>
                    <span>Ideal para trabalho noturno</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-focus-3-line text-green-500"></i>
                    <span>Maior foco nos dados</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <i className="ri-sun-line text-orange-500"></i>
                    <span>Melhor em ambientes claros</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-eye-line text-orange-500"></i>
                    <span>Leitura mais confortável</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-artboard-line text-orange-500"></i>
                    <span>Design minimalista</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-contrast-line text-orange-500"></i>
                    <span>Alto contraste</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleConfirm}
              disabled={isApplying}
              className={`
                flex-1 px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300
                ${isApplying
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 shadow-lg hover:shadow-xl'
                }
              `}
            >
              {isApplying ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Aplicando tema...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <i className="ri-check-line text-xl"></i>
                  <span>Confirmar e Continuar</span>
                </div>
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Você pode alterar o tema a qualquer momento nas configurações do seu perfil
          </p>
        </div>
      </div>
    </div>
  );
}