/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F1F38',
          mid: '#1A3358',
          light: '#243F6A',
        },
        teal: {
          DEFAULT: '#1A8A72',
          light: '#22B594',
          pale: '#E8F7F4',
        },
        gold: {
          DEFAULT: '#C8962A',
          pale: '#FFF8E6',
        },
        cream: {
          DEFAULT: '#FAF8F4',
          dark: '#F0ECE3',
          darker: '#E5DDD0',
        },
      },
      fontFamily: {
        fraunces: ['Fraunces', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '28px',
      },
    },
  },
  plugins: [],
}
