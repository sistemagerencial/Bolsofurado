import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isFirstTime: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark'); // Default escuro
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    // Verifica se é a primeira vez do usuário
    const themeConfigured = localStorage.getItem('theme_configured');
    const savedTheme = localStorage.getItem('theme') as Theme;
    
    if (!themeConfigured) {
      setIsFirstTime(true);
      // Se é primeira vez, mantém o tema escuro como padrão
      setThemeState('dark');
    } else if (savedTheme) {
      setThemeState(savedTheme);
    }
    
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      // Aplicar o tema no documento
      const root = document.documentElement;
      
      if (theme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
      } else {
        root.classList.add('dark');
        root.classList.remove('light');
      }

      // Salvar no localStorage apenas se não for primeira vez
      if (!isFirstTime) {
        localStorage.setItem('theme', theme);
      }
    }
  }, [theme, isInitialized, isFirstTime]);

  const toggleTheme = () => {
    setThemeState(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    // Quando o tema é definido explicitamente, marca como configurado
    if (isFirstTime) {
      localStorage.setItem('theme_configured', 'true');
      localStorage.setItem('theme', newTheme);
      setIsFirstTime(false);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isFirstTime }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}