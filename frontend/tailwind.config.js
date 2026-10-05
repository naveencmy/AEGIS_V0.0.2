/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Indigo Primary Brand
        brand: {
          DEFAULT:  '#4F46E5',
          hover:    '#4338CA',
          light:    '#EEF2FF',
          border:   '#C7D2FE',
          text:     '#3730A3',
          50:       '#EEF2FF',
          100:      '#E0E7FF',
          200:      '#C7D2FE',
          300:      '#A5B4FC',
          400:      '#818CF8',
          500:      '#6366F1',
          600:      '#4F46E5',
          700:      '#4338CA',
          800:      '#3730A3',
          900:      '#312E81',
        },
        // Cyber Electric Cyan / Neon Defense Palette
        cyber: {
          DEFAULT:  '#06B6D4',
          neon:     '#00F2FE',
          hover:    '#0891B2',
          light:    '#ECFEFF',
          border:   '#A5F3FC',
          text:     '#0E7490',
          glow:     'rgba(6, 182, 212, 0.35)',
          50:       '#ECFEFF',
          100:      '#CFFAFE',
          200:      '#A5F3FC',
          300:      '#67E8F9',
          400:      '#22D3EE',
          500:      '#06B6D4',
          600:      '#0891B2',
          700:      '#0E7490',
          800:      '#155E75',
          900:      '#164E63',
          950:      '#083344',
        },
        // Semantic Signals
        success: {
          DEFAULT: '#16A34A',
          bg:      '#F0FDF4',
          border:  '#BBF7D0',
          text:    '#15803D',
        },
        warning: {
          DEFAULT: '#D97706',
          bg:      '#FFFBEB',
          border:  '#FDE68A',
          text:    '#B45309',
        },
        critical: {
          DEFAULT: '#DC2626',
          bg:      '#FEF2F2',
          border:  '#FECACA',
          text:    '#B91C1C',
        },
        high: {
          DEFAULT: '#EA580C',
          bg:      '#FFF7ED',
          border:  '#FFEDD5',
          text:    '#C2410C',
        },
        info: {
          DEFAULT: '#0284C7',
          bg:      '#F0F9FF',
          border:  '#BAE6FD',
          text:    '#0369A1',
        },
        // White Enterprise Surface Hierarchy
        surface: {
          base:    '#F8FAFC',
          card:    '#FFFFFF',
          muted:   '#F1F5F9',
          border:  '#E2E8F0',
          'border-strong': '#CBD5E1',
          dark:    '#0F172A',
        },
        // Text System
        slate: {
          950: '#020617',
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50:  '#F8FAFC',
        }
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'card':        '0 1px 3px rgba(15,23,42,0.05), 0 0 0 1px #E2E8F0',
        'card-hover':  '0 4px 14px rgba(15,23,42,0.06), 0 0 0 1px #CBD5E1',
        'card-active': '0 0 0 2px #4F46E5, 0 4px 12px rgba(79,70,229,0.12)',
        'elevated':    '0 8px 24px rgba(15,23,42,0.08), 0 0 0 1px #E2E8F0',
        'drawer':      '-8px 0 24px rgba(15,23,42,0.08)',
        'cyber-sm':    '0 0 10px rgba(6,182,212,0.25)',
        'cyber':       '0 0 20px rgba(6,182,212,0.35), 0 0 0 1px rgba(6,182,212,0.4)',
        'cyber-lg':    '0 0 35px rgba(6,182,212,0.45), 0 0 0 1px rgba(6,182,212,0.5)',
      },
      animation: {
        'cyber-radar': 'cyberRadar 8s linear infinite',
        'cyber-scan':  'cyberScan 4s ease-in-out infinite',
        'cyber-pulse': 'cyberPulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'cyber-float': 'cyberFloat 6s ease-in-out infinite',
      },
      keyframes: {
        cyberRadar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        cyberScan: {
          '0%, 100%': { transform: 'translateY(-100%)', opacity: '0.1' },
          '50%': { transform: 'translateY(100%)', opacity: '0.6' },
        },
        cyberPulse: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.04)' },
        },
        cyberFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      borderRadius: {
        'xl': '12px',
        'lg': '10px',
        'md': '8px',
        'sm': '6px',
      }
    },
  },
  plugins: [],
}
