'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

export type Density = 'comfortable' | 'compact' | 'spacious';
export type Accent  = 'coral' | 'blue' | 'green' | 'purple' | 'orange';

interface ThemePrefs {
  density: Density;
  accent:  Accent;
}

export const ACCENT_COLORS: Record<Accent, { primary: string; hover: string; soft: string; border: string; shadow: string }> = {
  coral:  { primary: '#FF5C35', hover: '#E8440E', soft: 'rgba(255,92,53,.10)',   border: 'rgba(255,92,53,.25)',  shadow: '0 4px 16px rgba(255,92,53,.30)'  },
  blue:   { primary: '#3B82F6', hover: '#2563EB', soft: 'rgba(59,130,246,.10)',  border: 'rgba(59,130,246,.25)', shadow: '0 4px 16px rgba(59,130,246,.30)' },
  green:  { primary: '#10B981', hover: '#059669', soft: 'rgba(16,185,129,.10)',  border: 'rgba(16,185,129,.25)', shadow: '0 4px 16px rgba(16,185,129,.30)' },
  purple: { primary: '#8B5CF6', hover: '#7C3AED', soft: 'rgba(139,92,246,.10)', border: 'rgba(139,92,246,.25)', shadow: '0 4px 16px rgba(139,92,246,.30)' },
  orange: { primary: '#F59E0B', hover: '#D97706', soft: 'rgba(245,158,11,.10)', border: 'rgba(245,158,11,.25)', shadow: '0 4px 16px rgba(245,158,11,.30)' },
};

const DENSITY_VARS: Record<Density, Record<string, string>> = {
  comfortable: { '--dax-radius-sm': '6px',  '--dax-radius-md': '10px', '--dax-radius-lg': '14px', '--dax-radius-xl': '18px' },
  compact:     { '--dax-radius-sm': '4px',  '--dax-radius-md': '7px',  '--dax-radius-lg': '10px', '--dax-radius-xl': '13px' },
  spacious:    { '--dax-radius-sm': '8px',  '--dax-radius-md': '13px', '--dax-radius-lg': '18px', '--dax-radius-xl': '24px' },
};

function applyPrefs(prefs: ThemePrefs) {
  const root   = document.documentElement;
  const accent = ACCENT_COLORS[prefs.accent];

  root.style.setProperty('--dax-coral',        accent.primary);
  root.style.setProperty('--dax-coral-hover',  accent.hover);
  root.style.setProperty('--dax-coral-soft',   accent.soft);
  root.style.setProperty('--dax-coral-border', accent.border);
  root.style.setProperty('--dax-shadow-coral', accent.shadow);

  const density = DENSITY_VARS[prefs.density];
  Object.entries(density).forEach(([k, v]) => root.style.setProperty(k, v));
}

const DEFAULT_PREFS: ThemePrefs = { density: 'comfortable', accent: 'coral' };

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [prefs, setPrefs]   = useState<ThemePrefs>(DEFAULT_PREFS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('dax-prefs');
      if (saved) {
        const parsed = JSON.parse(saved) as ThemePrefs;
        setPrefs(parsed);
        applyPrefs(parsed);
      }
    } catch {}
  }, []);

  const savePrefs = useCallback((next: ThemePrefs) => {
    setPrefs(next);
    applyPrefs(next);
    localStorage.setItem('dax-prefs', JSON.stringify(next));
  }, []);

  const setAccent  = useCallback((accent:  Accent)  => savePrefs({ ...prefs, accent }),  [prefs, savePrefs]);
  const setDensity = useCallback((density: Density) => savePrefs({ ...prefs, density }), [prefs, savePrefs]);

  return {
    theme: resolvedTheme ?? theme ?? 'dark',
    setTheme,
    prefs,
    mounted,
    setAccent,
    setDensity,
    savePrefs,
    ACCENT_COLORS,
  };
}
