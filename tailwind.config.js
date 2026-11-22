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
        sage: {
          50: '#f4f7f2',
          100: '#e7ede2',
          200: '#d1ddc8',
          300: '#b4c7a6',
          400: '#9CAF88',
          500: '#83976f',
          600: '#677857',
          700: '#525f46',
          800: '#434d3a',
          900: '#384131',
        },
        offwhite: '#F7F5EF',
        tomato: {
          50: '#fdf3f2',
          100: '#fce4e1',
          200: '#f9ccc7',
          300: '#f4a8a0',
          400: '#ee776b',
          500: '#E8412C',
          600: '#d4301c',
          700: '#b22413',
          800: '#932013',
          900: '#7a2016',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Urbanist', 'Outfit', 'Sora', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Playfair Display"', '"Plus Jakarta Sans"', 'Urbanist', 'serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-sage': '0 0 25px rgba(156, 175, 136, 0.25)',
        'glow-tomato': '0 0 25px rgba(232, 65, 44, 0.35)',
        'premium': '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple': 'ripple 1.5s ease-out infinite',
        'float': 'float 4s ease-in-out infinite'
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        }
      }
    },
  },
  plugins: [],
}
