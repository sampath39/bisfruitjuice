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
        primary: {
          light: '#dcfce7', // light green
          DEFAULT: '#22c55e', // fresh green
          dark: '#15803d',
        },
        citrus: {
          orange: {
            light: '#ffedd5',
            DEFAULT: '#f97316', // orange
            dark: '#ea580c',
          },
          yellow: {
            light: '#fef9c3',
            DEFAULT: '#eab308', // bright yellow
            dark: '#ca8a04',
          }
        },
        darkBg: '#0f172a',
        darkCard: '#1e293b',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'spin-slow': 'spin 12s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
