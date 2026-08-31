import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useCurrencyRates() {
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });

  useEffect(() => {
    let active = true;
    supabase.functions.invoke('currency-rates', { body: { base: 'USD' } }).then(({ data, error }) => {
      if (!active || error || !data || typeof data !== 'object' || !('rates' in data)) return;
      const nextRates = (data as { rates: unknown }).rates;
      if (typeof nextRates !== 'object' || nextRates === null) return;
      setRates({ USD: 1, ...(nextRates as Record<string, number>) });
    });

    return () => {
      active = false;
    };
  }, []);

  return rates;
}
