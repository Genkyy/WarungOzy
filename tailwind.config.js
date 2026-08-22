/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f9ff',
          100: '#b3f0ff',
          400: '#00d2ff',
          500: '#00b8e6',
          600: '#0099cc',
          900: '#004d66',
        },
        dark: {
          bg: '#0b0f19',
          card: '#151c2c',
          border: '#232d42',
          hover: '#1e293b',
          sidebar: '#0f172a',
        },
        neon: {
          blue: '#00D2FF',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
          purple: '#8B5CF6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      screens: {
        'ipad': '820px',
      }
    },
  },
  plugins: [],
}
