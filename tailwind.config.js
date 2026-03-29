/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          opacity: 'rgba(var(--color-primary-rgb), <alpha-value>)'
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          opacity: 'rgba(var(--color-secondary-rgb), <alpha-value>)'
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(99, 102, 241, 0.2)' },
          '50%': { boxShadow: '0 0 28px rgba(99, 102, 241, 0.45)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
};
