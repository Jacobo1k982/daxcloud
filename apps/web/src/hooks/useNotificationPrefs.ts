'use client';

import { useState, useEffect, useCallback } from 'react';

export interface NotificationPrefs {
  low_stock:   boolean;
  new_sale:    boolean;
  daily_goal:  boolean;
  system:      boolean;
  new_user:    boolean;
  achievement: boolean;
  // Preferencias de sonido y visualización
  sound:       boolean;
  desktop:     boolean;
}

export const DEFAULT_PREFS: NotificationPrefs = {
  low_stock:   true,
  new_sale:    false,
  daily_goal:  true,
  system:      true,
  new_user:    true,
  achievement: true,
  sound:       false,
  desktop:     false,
};

const STORAGE_KEY = 'daxcloud_notif_prefs';

export function useNotificationPrefs() {
  const [prefs, setPrefsState] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loaded, setLoaded]    = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefsState({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {}
    setLoaded(true);
  }, []);

  const savePrefs = useCallback((partial: Partial<NotificationPrefs>) => {
    setPrefsState(prev => {
      const next = { ...prev, ...partial };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Filtra notificaciones según preferencias
  const shouldShow = useCallback((type: string): boolean => {
    return (prefs as any)[type] !== false;
  }, [prefs]);

  return { prefs, savePrefs, loaded, shouldShow };
}
