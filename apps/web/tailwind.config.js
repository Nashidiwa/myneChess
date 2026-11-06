/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chess: {
          bg: '#f8fafc',
          card: '#ffffff',
          surface: '#f1f5f9',
          border: '#e2e8f0',
          boardLight: '#f0f5fa',
          boardDark: '#6ba3c8',
          boardHighlight: '#bae6fd',
          primary: '#0284c7',
          primaryHover: '#0369a1',
          accent: '#38bdf8',
          accentLight: '#f0f9ff',
          ice: '#e0f2fe',
        }
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 8px 24px -4px rgba(15, 23, 42, 0.08), 0 4px 8px -2px rgba(15, 23, 42, 0.03)',
        'glow-primary': '0 0 24px -4px rgba(2, 132, 199, 0.35)',
        'modal': '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
      },
      letterSpacing: {
        'tight-title': '-0.02em',
      }
    },
  },
  plugins: [],
}
