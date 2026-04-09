'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PrintConfig } from './useReceiptPrinter';
import { DEFAULT_PRINT_CONFIG } from './useReceiptPrinter';

const STORAGE_KEY = 'daxcloud_print_config';

export function usePrintConfig() {
  const [config, setConfigState] = useState<PrintConfig>(DEFAULT_PRINT_CONFIG);
  const [loaded, setLoaded]      = useState(false);

  // Carga desde localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PrintConfig>;
        setConfigState({ ...DEFAULT_PRINT_CONFIG, ...parsed });
      }
    } catch {}
    setLoaded(true);
  }, []);

  const saveConfig = useCallback((partial: Partial<PrintConfig>) => {
    setConfigState(prev => {
      const next = { ...prev, ...partial };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const resetConfig = useCallback(() => {
    setConfigState(DEFAULT_PRINT_CONFIG);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return { config, saveConfig, resetConfig, loaded };
}
