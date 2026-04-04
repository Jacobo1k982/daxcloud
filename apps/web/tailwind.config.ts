import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'mobile':  {'max': '639px'},
        'tablet':  {'min': '640px', 'max': '1023px'},
        'desktop': {'min': '1024px'},
        'touch':   {'max': '1023px'},
      },
      colors: {
        dax: {
          bg:           'var(--dax-bg)',
          surface:      'var(--dax-surface)',
          'surface-2':  'var(--dax-surface-2)',
          border:       'var(--dax-border)',
          'border-soft':'var(--dax-border-soft)',
          primary:      'var(--dax-text-primary)',
          secondary:    'var(--dax-text-secondary)',
          tertiary:     'var(--dax-text-tertiary)',
          muted:        'var(--dax-text-muted)',
          silver:       'var(--dax-silver)',
          slate:        'var(--dax-slate)',
          success:      'var(--dax-success)',
          warning:      'var(--dax-warning)',
          danger:       'var(--dax-danger)',
          info:         'var(--dax-info)',
        },
      },
      fontFamily: {
        display:   ['Outfit', 'sans-serif'],
        editorial: ['Cormorant Garamond', 'serif'],
        sans:      ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'dax-sm': 'var(--dax-shadow-sm)',
        'dax-md': 'var(--dax-shadow-md)',
        'dax-lg': 'var(--dax-shadow-lg)',
      },
      borderRadius: {
        'dax-sm': 'var(--dax-radius-sm)',
        'dax-md': 'var(--dax-radius-md)',
        'dax-lg': 'var(--dax-radius-lg)',
        'dax-xl': 'var(--dax-radius-xl)',
      },
      spacing: {
        'touch': '48px',
      },
    },
  },
  plugins: [],
};

export default config;