import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        flex items-center gap-2 p-2 rounded-lg transition-all duration-200
        hover:bg-accent hover:text-accent-foreground
        ${className}
      `}
      title={`Mudar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {theme === 'dark' ? (
          <i className="ri-sun-line text-yellow-500"></i>
        ) : (
          <i className="ri-moon-line text-blue-600"></i>
        )}
      </div>
      
      {showLabel && (
        <span className="text-sm font-medium">
          {theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
        </span>
      )}
    </button>
  );
}