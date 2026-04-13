'use client';

import { useEffect } from 'react';

// Aplica el tema guardado en localStorage lo antes posible
// para evitar flash de tema incorrecto
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dax-theme-prefs');
      if (!saved) return;
      const prefs = JSON.parse(saved);
      const root  = document.documentElement;

      const ACCENT_COLORS: Record<string, { primary: string; hover: string; soft: string; border: string; shadow: string }> = {
        coral:  { primary: '#FF5C35', hover: '#E8440E', soft: 'rgba(255,92,53,.10)',   border: 'rgba(255,92,53,.25)',  shadow: '0 4px 16px rgba(255,92,53,.30)'  },
        blue:   { primary: '#3B82F6', hover: '#2563EB', soft: 'rgba(59,130,246,.10)',  border: 'rgba(59,130,246,.25)', shadow: '0 4px 16px rgba(59,130,246,.30)' },
        green:  { primary: '#10B981', hover: '#059669', soft: 'rgba(16,185,129,.10)',  border: 'rgba(16,185,129,.25)', shadow: '0 4px 16px rgba(16,185,129,.30)' },
        purple: { primary: '#8B5CF6', hover: '#7C3AED', soft: 'rgba(139,92,246,.10)', border: 'rgba(139,92,246,.25)', shadow: '0 4px 16px rgba(139,92,246,.30)' },
        orange: { primary: '#F59E0B', hover: '#D97706', soft: 'rgba(245,158,11,.10)', border: 'rgba(245,158,11,.25)', shadow: '0 4px 16px rgba(245,158,11,.30)' },
      };

      const DENSITY_VARS: Record<string, Record<string, string>> = {
        comfortable: { '--dax-radius-sm': '6px',  '--dax-radius-md': '10px', '--dax-radius-lg': '14px', '--dax-radius-xl': '18px' },
        compact:     { '--dax-radius-sm': '4px',  '--dax-radius-md': '7px',  '--dax-radius-lg': '10px', '--dax-radius-xl': '13px' },
        spacious:    { '--dax-radius-sm': '8px',  '--dax-radius-md': '13px', '--dax-radius-lg': '18px', '--dax-radius-xl': '24px' },
      };

      // Acento
      if (prefs.accent && ACCENT_COLORS[prefs.accent]) {
        const a = ACCENT_COLORS[prefs.accent];
        root.style.setProperty('--dax-coral',        a.primary);
        root.style.setProperty('--dax-coral-hover',  a.hover);
        root.style.setProperty('--dax-coral-soft',   a.soft);
        root.style.setProperty('--dax-coral-border', a.border);
        root.style.setProperty('--dax-shadow-coral', a.shadow);
      }

      // Densidad
      if (prefs.density && DENSITY_VARS[prefs.density]) {
        Object.entries(DENSITY_VARS[prefs.density]).forEach(([k, v]) => root.style.setProperty(k, v));
      }

      // Tema
      if (prefs.theme === 'light') {
        root.style.setProperty('--dax-bg',             '#F0F4F8');
        root.style.setProperty('--dax-surface',        '#FFFFFF');
        root.style.setProperty('--dax-surface-2',      '#F4F6FA');
        root.style.setProperty('--dax-surface-3',      '#E8EDF5');
        root.style.setProperty('--dax-border',         '#D1D9E6');
        root.style.setProperty('--dax-border-soft',    'rgba(209,217,230,.6)');
        root.style.setProperty('--dax-text-primary',   '#0F1924');
        root.style.setProperty('--dax-text-secondary', '#2A4A6A');
        root.style.setProperty('--dax-text-muted',     '#6A8AAA');
        root.style.setProperty('--dax-navy-900',       '#FFFFFF');
        root.style.setProperty('--dax-navy-800',       '#F4F6FA');
        root.style.setProperty('--dax-navy-700',       '#E8EDF5');
        root.style.setProperty('--dax-navy-600',       '#D1D9E6');
        root.style.setProperty('--dax-navy-500',       '#A0B4C8');
        root.style.setProperty('--dax-navy-400',       '#6A8AAA');
        root.style.setProperty('--dax-shadow-sm',      '0 1px 3px rgba(0,0,0,.08)');
        root.style.setProperty('--dax-shadow-md',      '0 4px 12px rgba(0,0,0,.10)');
        root.style.setProperty('--dax-shadow-lg',      '0 8px 28px rgba(0,0,0,.14)');
        root.setAttribute('data-theme', 'light');
      }
    } catch {}
  }, []);

  return <>{children}</>;
}
