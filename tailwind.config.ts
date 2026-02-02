import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        dark: {
          primary: '#0E0B16',
          secondary: '#16122A',
        },
        purple: {
          primary: '#7C3AED',
        },
        pink: {
          primary: '#EC4899',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
