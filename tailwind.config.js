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
        paper: '#FAF7F2',
        surface: '#FFFFFF',
        'border-paper': '#E8E2D8',
        ink: {
          primary: '#2A2622',
          muted: '#8A8175',
        },
        amber: {
          DEFAULT: '#D97706',
          dark: '#B45309',
          light: '#FEF3C7',
        },
        olive: '#3F7D4F',
        mustard: '#D4A017',
        brick: '#B84B3E',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      screens: {
        'ipad': '820px',
      }
    },
  },
  plugins: [],
}
