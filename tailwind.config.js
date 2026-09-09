/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        page: 'var(--bg-page)',
        surface: 'var(--bg-surface)',
        card: {
          DEFAULT: 'var(--bg-card)',
          hover: 'var(--bg-card-hover)',
        },
        input: 'var(--bg-input)',
        border: {
          DEFAULT: 'var(--border)',
          hover: 'var(--border-hover)',
        },
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
        dim: 'var(--text-dim)',
        accent: {
          DEFAULT: 'var(--accent)',
          dim: 'var(--accent-dim)',
        },
        'bg-page': 'var(--bg-page)',
        'bg-surface': 'var(--bg-surface)',
        'bg-card': 'var(--bg-card)',
        'bg-card-hover': 'var(--bg-card-hover)',
        'bg-input': 'var(--bg-input)',
        'border-main': 'var(--border)',
        'border-hover': 'var(--border-hover)',
        'text-main': 'var(--text-main)',
        'text-muted': 'var(--text-muted)',
        'text-dim': 'var(--text-dim)',
        'btn-bg': 'var(--btn-bg)',
        'btn-text': 'var(--btn-text)',
        'btn-hover': 'var(--btn-hover)',
        'btn-sec-bg': 'var(--btn-sec-bg)',
        'btn-sec-text': 'var(--btn-sec-text)',
        'btn-sec-border': 'var(--btn-sec-border)',
        'btn-sec-hover': 'var(--btn-sec-hover)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        indeterminate: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(300%)' },
        },
      },
      animation: {
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.2s ease-out both',
        'indeterminate-loading': 'indeterminate 1.4s infinite ease-in-out',
      },
    },
  },
  plugins: [],
};
