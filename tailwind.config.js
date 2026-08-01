/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#EEF0FD',
          100: '#D9D9FB',
          200: '#B8BCF9',
          300: '#9296F6',
          400: '#7C7FF3',
          500: '#5B5FEF',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        accent: {
          50: '#E6FAF7',
          100: '#CCF5EF',
          200: '#99EBDF',
          300: '#5FDCCD',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
      },
      boxShadow: {
        'brand': '0 4px 20px -2px rgba(91, 95, 239, 0.25)',
        'brand-lg': '0 8px 30px -4px rgba(91, 95, 239, 0.3)',
      },
    },
  },
  plugins: [],
};
