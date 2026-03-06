import { useTheme } from '../../contexts/ThemeContext';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  showText?: boolean;
}

function Logo({ className = '', width = 180, height = 60, showText = true }: LogoProps) {
  const { theme } = useTheme();
  
  // URLs das logos
  const logoUrls = {
    dark: 'https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/db516023f2c5c0cb8f3941abb7658868.png',
    light: 'https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/db516023f2c5c0cb8f3941abb7658868.png'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={logoUrls[theme]}
        alt="Bolso Furado - Controle Financeiro"
        width={width}
        height={height}
        className="transition-all duration-300"
        style={{ 
          filter: theme === 'light' ? 'brightness(0) invert(1)' : 'none'
        }}
      />
      {showText && (
        <div className="hidden lg:block">
          <h1 className="text-xl font-bold text-foreground">
            BOLSO FURADO
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            Controle Financeiro
          </p>
        </div>
      )}
    </div>
  );
}

export default Logo;