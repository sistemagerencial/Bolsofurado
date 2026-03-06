
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeSelectorProps {
  showLabels?: boolean;
  className?: string;
}

function ThemeSelector({ showLabels = true, className = '' }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const [isChanging, setIsChanging] = useState(false);

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    if (newTheme === theme) return;
    
    setIsChanging(true);
    
    // Pequeno delay para animação suave
    setTimeout(() => {
      setTheme(newTheme);
      setIsChanging(false);
    }, 150);
  };

  return (
    <div className={`theme-selector ${className}`}>
      {showLabels && (
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Tema da Interface
        </h3>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        {/* Tema Escuro */}
        <button
          onClick={() => handleThemeChange('dark')}
          disabled={isChanging}
          className={`
            relative p-4 rounded-lg border-2 transition-all duration-300
            ${theme === 'dark' 
              ? 'border-green-500 bg-green-500/10' 
              : 'border-border hover:border-primary-500'
            }
            ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {/* Preview do Tema Escuro */}
          <div className="bg-gray-900 rounded-md p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-6 bg-gradient-to-r from-cyan-500 to-purple-600 rounded flex items-center justify-center">
                <i className="ri-bar-chart-fill text-white text-xs"></i>
              </div>
              <div className="flex-1">
                <div className="w-16 h-2 bg-gray-700 rounded mb-1"></div>
                <div className="w-12 h-1.5 bg-gray-600 rounded"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="h-8 bg-gray-800 rounded"></div>
              <div className="h-8 bg-gray-700 rounded"></div>
              <div className="h-8 bg-gray-800 rounded"></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="font-medium text-foreground">Escuro</div>
            <div className="text-sm text-muted-foreground">Tema padrão</div>
          </div>
          
          {/* Indicador de Seleção */}
          {theme === 'dark' && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <i className="ri-check-line text-white text-sm"></i>
            </div>
          )}
        </button>

        {/* Tema Claro */}
        <button
          onClick={() => handleThemeChange('light')}
          disabled={isChanging}
          className={`
            relative p-4 rounded-lg border-2 transition-all duration-300
            ${theme === 'light' 
              ? 'border-green-500 bg-green-500/10' 
              : 'border-border hover:border-primary-500'
            }
            ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {/* Preview do Tema Claro */}
          <div className="bg-white border rounded-md p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-6 bg-gradient-to-r from-cyan-500 to-purple-600 rounded flex items-center justify-center">
                <i className="ri-bar-chart-fill text-white text-xs"></i>
              </div>
              <div className="flex-1">
                <div className="w-16 h-2 bg-gray-300 rounded mb-1"></div>
                <div className="w-12 h-1.5 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="h-8 bg-gray-100 rounded border"></div>
              <div className="h-8 bg-gray-50 rounded border"></div>
              <div className="h-8 bg-gray-100 rounded border"></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="font-medium text-foreground">Claro</div>
            <div className="text-sm text-muted-foreground">Tema minimalista</div>
          </div>
          
          {/* Indicador de Seleção */}
          {theme === 'light' && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <i className="ri-check-line text-white text-sm"></i>
            </div>
          )}
        </button>
      </div>
      
      {showLabels && (
        <p className="text-sm text-muted-foreground mt-3">
          Escolha o tema que melhor se adapta ao seu ambiente de trabalho
        </p>
      )}
    </div>
  );
}

export default ThemeSelector;
