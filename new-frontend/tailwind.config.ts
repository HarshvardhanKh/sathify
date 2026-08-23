import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Brand Raw Constants for explicit reference
        saathi: {
          navy: '#022F84',
          blue: '#024DA8',
          azure: '#0477CC',
          sky: '#03AAEC',
          amber: '#FD7203',
          'amber-text': '#B84A00',
          mist: '#D2E2ED',
          surface: '#FDFDFD',
          ink: '#0A1633',
        },
        // Semantic Tokens (Backed by CSS Variables)
        surface: 'var(--color-surface)',
        'surface-raised': 'var(--color-surface-raised)',
        border: 'var(--color-border)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        accent: 'var(--color-accent)',
        'accent-fg': 'var(--color-accent-fg)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        'focus-ring': 'var(--color-focus-ring)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        dyslexic: ['OpenDyslexic', 'Lexend', 'Comic Sans MS', 'sans-serif'],
      },
      boxShadow: {
        'focus': '0 0 0 3px var(--color-focus-ring)',
        'card': '0 4px 20px -2px rgba(2, 47, 132, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
