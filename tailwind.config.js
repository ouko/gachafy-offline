/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF006E',
        secondary: '#8338EC',
      },
      spacing: {
        'thumb': '54mm',
      },
      screens: {
        'xs': '320px',
      },
      minHeight: {
        'screen-safe': '-webkit-fill-available',
      },
    },
  },
  plugins: [],
}
