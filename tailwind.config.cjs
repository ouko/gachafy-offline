/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#FF006E',
        secondary: '#8338EC',
        success: '#00E5A8',
        warning: '#FB5607',
        error: '#FF006E',
        background: {
          dark: '#1A1A1A',
          light: '#FFFFFF'
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A3A3A3'
        }
      },
      keyframes: {
        burst: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          '50%': { transform: 'scale(1.2) rotate(15deg)', opacity: 1 },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: 1 }
        },
        pulse: {
          '0%': { transform: 'scale(1)', opacity: 0.25 },
          '100%': { transform: 'scale(1.5)', opacity: 0 }
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        }
      },
      animation: {
        burst: 'burst 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        pulse: 'pulse 1.5s linear infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'reduced-motion': 'none'
      },
      colors: {
        primary: '#FF006E',
        secondary: '#8338EC',
        success: '#00E5A8',
        warning: '#FFC107',
        error: '#FF3B30',
        background: {
          light: '#0f0f14',
          dark: '#000000'
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#C7C7D0'
        }
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      spacing: {
        'thumb': '54mm'
      },
      minHeight: {
        'tap': '48px'
      },
      minWidth: {
        'tap': '48px'
      }
    }
  },
  plugins: []
}
