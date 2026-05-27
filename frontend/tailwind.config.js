/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        checkpoint: {
          bg:      '#09090b',
          surface: '#111116',
          card:    '#18181f',
          green:   '#00e187',
          muted:   '#71717a',
        },
      },
    },
  },
  plugins: [],
};
