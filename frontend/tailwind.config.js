/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7fb',
          100: '#ebf0f8',
          200: '#dbe3f1',
          300: '#c0cde5',
          400: '#9db1d5',
          500: '#758ebf', // Relaxing slate blue/indigo
          600: '#5c74a6',
          700: '#4b5e8a',
          800: '#3e4d72',
          900: '#36415f',
        },
        calm: {
          green: {
            50: '#f0fdf4',
            100: '#dcfce7',
            500: '#22c55e',
            600: '#16a34a',
          },
          yellow: {
            50: '#fefce8',
            100: '#fef9c3',
            500: '#eab308',
          },
          red: {
            50: '#fef2f2',
            100: '#fee2e2',
            500: '#ef4444',
          }
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
