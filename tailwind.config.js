/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#f7f8f3',
          100: '#e8ebd9',
          200: '#d4dab8',
          300: '#b8c38d',
          400: '#9aab66',
          500: '#7d9048',
          600: '#627239',
          700: '#4c582e',
          800: '#3f4828',
          900: '#363d24',
        },
        beige: {
          50: '#fdfcf9',
          100: '#f8f5ed',
          200: '#f0e9d8',
          300: '#e5d8bd',
          400: '#d6c29d',
          500: '#c7ab7f',
          600: '#b89565',
          700: '#9a7a51',
          800: '#7d6345',
          900: '#66523b',
        },
        gold: {
          50: '#fdfbea',
          100: '#faf5c7',
          200: '#f6e992',
          300: '#f0d654',
          400: '#e9c127',
          500: '#d4a64a',
          600: '#b7862f',
          700: '#926321',
          800: '#794f21',
          900: '#674121',
        }
      },
      fontFamily: {
        arabic: ['Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
