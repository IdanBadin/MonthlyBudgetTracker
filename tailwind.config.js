/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        manrope: ['Manrope', 'system-ui', 'sans-serif'],
        headline: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          opacity: 'rgba(var(--color-primary-rgb), <alpha-value>)'
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          opacity: 'rgba(var(--color-secondary-rgb), <alpha-value>)'
        },
        // Material Design 3 color tokens
        'md-primary': '#00342b',
        'md-on-primary': '#ffffff',
        'md-primary-container': '#004d40',
        'md-on-primary-container': '#7ebdac',
        'md-primary-fixed': '#afefdd',
        'md-primary-fixed-dim': '#94d3c1',
        'md-secondary': '#006a63',
        'md-on-secondary': '#ffffff',
        'md-secondary-container': '#8bf1e6',
        'md-on-secondary-container': '#006f67',
        'md-surface-tint': '#29695b',
        'md-background': '#f8fafb',
        'md-surface': '#f8fafb',
        'md-surface-container-lowest': '#ffffff',
        'md-surface-container-low': '#f2f4f5',
        'md-surface-container': '#eceeef',
        'md-surface-container-high': '#e6e8e9',
        'md-surface-container-highest': '#e1e3e4',
        'md-on-surface': '#191c1d',
        'md-on-surface-variant': '#3f4945',
        'md-outline': '#707975',
        'md-outline-variant': '#bfc9c4',
        'md-inverse-primary': '#94d3c1',
        'md-inverse-surface': '#2e3132',
        'md-error': '#ba1a1a',
        'md-error-container': '#ffdad6',
        // Shorthand MD3 tokens (no prefix)
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f4f5',
        'surface-container': '#eceeef',
        'surface-container-high': '#e6e8e9',
        'surface-container-highest': '#e1e3e4',
        'on-surface': '#191c1d',
        'on-surface-variant': '#3f4945',
        'on-primary': '#ffffff',
        'on-secondary': '#ffffff',
        'secondary-container': '#8bf1e6',
        'on-secondary-container': '#006f67',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        'primary-container': '#004d40',
        'on-primary-container': '#7ebdac',
        'outline-variant': '#bfc9c4',
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
          '0%, 100%': { boxShadow: '0 0 12px rgba(0, 52, 43, 0.2)' },
          '50%': { boxShadow: '0 0 28px rgba(0, 52, 43, 0.45)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',
        'DEFAULT': '0.5rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'full': '9999px',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
};
