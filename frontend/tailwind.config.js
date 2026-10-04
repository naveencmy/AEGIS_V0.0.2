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
        // Core Surface Palette — obsidian dark sovereign
        surface: {
          base:    '#020817',
          raised:  '#0B1120',
          overlay: '#0E1628',
          card:    '#111827',
          muted:   '#1A2235',
          border:  '#1E293B',
          'border-hi': '#334155',
        },
        // Brand — indigo-electric
        brand: {
          DEFAULT:  '#6366F1',
          dim:      'rgba(99,102,241,0.12)',
          glow:     'rgba(99,102,241,0.25)',
          50:       '#EEF2FF',
          100:      '#E0E7FF',
          400:      '#818CF8',
          500:      '#6366F1',
          600:      '#4F46E5',
          700:      '#4338CA',
        },
        // Accent — cyan tactical
        teal: {
          DEFAULT: '#06B6D4',
          dim:     'rgba(6,182,212,0.12)',
          400:     '#22D3EE',
          500:     '#06B6D4',
          600:     '#0891B2',
        },
        // Severity Signal
        critical: { DEFAULT: '#EF4444', dim: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.25)' },
        high:     { DEFAULT: '#F97316', dim: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.25)' },
        medium:   { DEFAULT: '#F59E0B', dim: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
        low:      { DEFAULT: '#22C55E', dim: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.25)' },
        // Status
        online:  '#22C55E',
        warn:    '#F59E0B',
        offline: '#EF4444',
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        display: ['Inter', 'ui-sans-serif', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      backgroundImage: {
        'grid-sovereign': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cpath d='M0 0h32v32H0z' fill='none'/%3E%3Cpath d='M32 0L0 0 0 32' stroke='%231E293B' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
        'radial-brand': 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.18), transparent)',
        'gradient-card': 'linear-gradient(135deg, #111827 0%, #0E1628 100%)',
      },
      boxShadow: {
        'glow-brand':    '0 0 24px rgba(99,102,241,0.20)',
        'glow-teal':     '0 0 24px rgba(6,182,212,0.18)',
        'glow-critical': '0 0 24px rgba(239,68,68,0.18)',
        'card':          '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(30,41,59,0.6)',
        'card-hover':    '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.25)',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in-up':  'slideInUp 0.2s ease-out',
        'fade-in':      'fadeIn 0.15s ease-out',
        'scan-line':    'scanLine 2s linear infinite',
      },
      keyframes: {
        slideInUp: { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        scanLine:  { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
      },
    },
  },
  plugins: [],
}
