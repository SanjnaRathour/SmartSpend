/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff', 100: '#dae7ff', 200: '#b9d0ff',
          300: '#8bafff', 400: '#5a85ff', 500: '#3a5dff',
          600: '#2a3ef0', 700: '#222fd2', 800: '#2029aa',
          900: '#202a86', 950: '#121749',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        smartspend: {
          "primary":   "#3a5dff",
          "secondary": "#8b5cf6",
          "accent":    "#10b981",
          "neutral":   "#1e293b",
          "base-100":  "#ffffff",
          "info":      "#3abff8",
          "success":   "#10b981",
          "warning":   "#f59e0b",
          "error":     "#ef4444",
        },
      },
      {
        smartspend_dark: {
          "primary":   "#5a85ff",
          "secondary": "#a78bfa",
          "accent":    "#34d399",
          "neutral":   "#0f172a",
          "base-100":  "#0f172a",
          "base-200":  "#1e293b",
          "base-300":  "#334155",
          "info":      "#38bdf8",
          "success":   "#10b981",
          "warning":   "#fbbf24",
          "error":     "#f87171",
        },
      },
    ],
    darkTheme: "smartspend_dark",
    logs: false,
  },
};
