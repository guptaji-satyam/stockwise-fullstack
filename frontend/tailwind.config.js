/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c2d9ec',
          300: '#94bfe0',
          400: '#5e9ed0',
          500: '#3880be',
          600: '#2866a2',
          700: '#215284',
          800: '#1e466d',
          900: '#0f172a', // Deep navy
          950: '#090d16',
        },
        brand: {
          blue: '#2563eb',
          light: '#3b82f6',
          dark: '#1d4ed8',
        }
      },
    },
  },
  plugins: [],
}
