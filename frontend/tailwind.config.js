/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF6B35',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        slideUp: { from: { transform: 'translateY(20px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideInRight: { from: { transform: 'translateX(20px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        scaleIn: { from: { transform: 'scale(0.9)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        bounceIn: { '0%': { transform: 'scale(0.3)', opacity: 0 }, '50%': { transform: 'scale(1.05)' }, '70%': { transform: 'scale(0.9)' }, '100%': { transform: 'scale(1)', opacity: 1 } },
        pulseSoft: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.7 } },
        wiggle: { '0%, 100%': { transform: 'rotate(-3deg)' }, '50%': { transform: 'rotate(3deg)' } },
        glow: { '0%, 100%': { boxShadow: '0 0 5px rgba(255,107,53,0.5)' }, '50%': { boxShadow: '0 0 20px rgba(255,107,53,0.8), 0 0 40px rgba(255,107,53,0.3)' } }
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgba(255,107,53,0.3)',
        'glow-green': '0 0 20px rgba(34,197,94,0.3)',
        'glow-red': '0 0 20px rgba(239,68,68,0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.15)',
      }
    }
  },
  plugins: []
}
