/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#080B12',
        'bg-secondary': '#111722',
        'gunmetal': '#252D39',
        'metallic': '#AAB7C4',
        'laser-cyan': '#00E5FF',
        'electric-blue': '#2563FF',
        'laser-violet': '#8B5CF6',
        'text-primary': '#F3F7FC',
        'text-secondary': '#94A3B8',
      },
      fontFamily: {
        display: ['"Rajdhani"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'laser-pulse': 'laser-pulse 3s ease-in-out infinite',
        'laser-flow': 'laser-flow 4s linear infinite',
        'glow-breath': 'glow-breath 4s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'spin-slow-rev': 'spin-slow-rev 25s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan-line': 'scan-line 8s linear infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'shimmer': 'shimmer 3s linear infinite',
        'arrow-travel': 'arrow-travel 6s linear infinite',
      },
      keyframes: {
        'laser-pulse': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        'laser-flow': {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        'glow-breath': {
          '0%, 100%': { opacity: '0.4', filter: 'blur(8px)' },
          '50%': { opacity: '0.9', filter: 'blur(12px)' },
        },
        'spin-slow-rev': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'arrow-travel': {
          '0%': { strokeDashoffset: '200' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
};
