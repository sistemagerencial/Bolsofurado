import { useState, useEffect } from 'react';

export interface PriceAlert {
  threshold: number;
  type: 'up' | 'down' | 'both';
  enabled: boolean;
}

interface PriceAlerts {
  [investmentId: string]: PriceAlert;
}

const STORAGE_KEY = 'price_alerts';

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlerts>({});

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setAlerts(JSON.parse(stored));
      } catch (error) {
        console.error('Erro ao carregar alertas:', error);
      }
    }
  }, []);

  const saveAlert = (investmentId: string, alert: PriceAlert) => {
    const newAlerts = { ...alerts };
    
    if (!alert.enabled) {
      delete newAlerts[investmentId];
    } else {
      newAlerts[investmentId] = alert;
    }
    
    setAlerts(newAlerts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAlerts));
  };

  const getAlert = (investmentId: string): PriceAlert | undefined => {
    return alerts[investmentId];
  };

  const checkAlerts = (investments: any[]) => {
    const triggered: Array<{
      id: string;
      name: string;
      variation: number;
      type: 'up' | 'down';
      threshold: number;
    }> = [];

    investments.forEach((investment) => {
      const alert = alerts[investment.id];
      if (!alert || !alert.enabled) return;

      const entryPrice = investment.entry_price || 0;
      const currentPrice = investment.current_value || 0;
      
      if (entryPrice === 0) return;

      const variation = ((currentPrice - entryPrice) / entryPrice) * 100;
      const absVariation = Math.abs(variation);

      // Verifica se ultrapassou o threshold
      if (absVariation >= alert.threshold) {
        const isUp = variation > 0;
        const isDown = variation < 0;

        // Verifica se o tipo de alerta corresponde
        if (
          alert.type === 'both' ||
          (alert.type === 'up' && isUp) ||
          (alert.type === 'down' && isDown)
        ) {
          triggered.push({
            id: investment.id,
            name: investment.name,
            variation,
            type: isUp ? 'up' : 'down',
            threshold: alert.threshold,
          });
        }
      }
    });

    return triggered;
  };

  return {
    alerts,
    saveAlert,
    getAlert,
    checkAlerts,
  };
}