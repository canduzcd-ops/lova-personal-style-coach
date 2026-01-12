/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './App.{js,ts,tsx}',
    './components/**/*.{js,ts,tsx}',
    './screens/**/*.{js,ts,tsx}',
    './contexts/**/*.{js,ts,tsx}',
    './hooks/**/*.{js,ts,tsx}',
    './services/**/*.{js,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        page: {
          DEFAULT: '#FFF7F0',
          soft: '#FFFAF0',
          dark: '#0C0C0C',
        },
        surface: {
          DEFAULT: '#F3E5D8',
          soft: '#FAEEE4',
          dark: '#1C1917',
        },
        primary: {
          DEFAULT: '#3A2B27',
          dark: '#F5F5F4',
        },
        secondary: {
          DEFAULT: '#7A6154',
          dark: '#A8A29E',
        },
        border: {
          DEFAULT: '#E4D2C3',
          dark: '#292524',
        },
        accent: {
          DEFAULT: '#D98C6A',
          soft: '#F1C1A6',
          dark: '#D98C6A',
        },
        lova: {
          bg: '#FFF7F0',
          primary: '#3A2B27',
          secondary: '#7A6154',
          accent: '#D98C6A',
          surface: '#F3E5D8',
        },
      },
      boxShadow: {
        soft: '0 18px 40px rgba(58, 43, 39, 0.10)',
        glow: '0 0 20px rgba(217, 140, 106, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};