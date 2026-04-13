'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect } from 'react';
import { useTheme, ACCENT_COLORS } from '@/hooks/useTheme';

const DENSITY_VARS: Record<string, Record<string, string>> = {
  comfortable: { '--dax-radius-sm': '6px', '--dax-radius-md': '10px', '--dax-radius-lg': '14px', '--dax-radius-xl': '18px' },
  compact: { '--dax-radius-sm': '4px', '--dax-radius-md': '7px', '--dax-radius-lg': '10px', '--dax-radius-xl': '13px' },
  spacious: { '--dax-radius-sm': '8px', '--dax-radius-md': '13px', '--dax-radius-lg': '18px', '--dax-radius-xl': '24px' },
};

// Aplica acento y densidad al montar
function PrefsApplier() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dax-prefs');
      if (!saved) return;
      const prefs = JSON.parse(saved);
      const root = document.documentElement;

      const accentKey = prefs.accent as keyof typeof ACCENT_COLORS;
      if (accentKey && ACCENT_COLORS[accentKey]) {
        const a = ACCENT_COLORS[accentKey];
        root.style.setProperty('--dax-coral', a.primary);
        root.style.setProperty('--dax-coral-hover', a.hover);
        root.style.setProperty('--dax-coral-soft', a.soft);
        root.style.setProperty('--dax-coral-border', a.border);
        root.style.setProperty('--dax-shadow-coral', a.shadow);
      }

      const densityKey = prefs.density as keyof typeof DENSITY_VARS;
      if (densityKey && DENSITY_VARS[densityKey]) {
        Object.entries(DENSITY_VARS[densityKey]).forEach(([k, v]) =>
          root.style.setProperty(k, v)
        );
      }
    } catch { }
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 1000 * 60, retry: 1 },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <PrefsApplier />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
