/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    sans: ['"Open Sans"', 'sans-serif'],
    serif: ['Georgia', 'serif'],
    mono: ['Menlo', 'monospace'],
    inter: ['Inter', 'sans-serif'],
    montserrat: ['Montserrat', 'sans-serif']
  },
  plugins: [],
}

