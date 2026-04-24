/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        reads: {
          cream:        '#F5F0E8',
          'cream-mid':  '#EDE7D9',
          navy:         '#0D1F3C',
          'navy-soft':  '#1A3358',
          'gold-light': '#F5CF7A',
          gold:         '#E8B84B',
          'gold-mid':   '#D4A017',
          'gold-dark':  '#B8860B',
          green:        '#16A34A',
          'green-light':'#22C55E',
          'green-bg':   '#DCFCE7',
          teal:         '#0D7A6E',
          'teal-light': '#10A394',
          red:          '#EF4444',
          'red-bg':     '#FEE2E2',
          muted:        '#6B7280',
          'muted-light':'#9CA3AF',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'reads-card':  '0 4px 24px rgba(13,31,60,0.08), 0 1px 4px rgba(13,31,60,0.04)',
        'reads-gold':  '0 4px 16px rgba(180,130,10,0.35)',
        'reads-green': '0 4px 16px rgba(22,163,74,0.30)',
      },
      keyframes: {
        'slide-up': {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'slide-up':  'slide-up 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in':   'fade-in 0.4s ease-out',
        'spin-slow': 'spin-slow 2s linear infinite',
      },
    },
  },
  plugins: [],
};
