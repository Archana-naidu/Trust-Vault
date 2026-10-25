/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          dark: '#0b132b',
          navy: '#0f172a',
          sidebar: '#111827',
          card: '#1e293b',
          border: '#334155',
          accent: '#3b82f6',
          purple: '#8b5cf6',
          emerald: '#10b981',
          rose: '#ef4444',
          amber: '#f59e0b'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}
