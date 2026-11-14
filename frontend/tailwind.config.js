/** @type {import('tailwindcss').Config} */
// نظام تصميم وازن: اتجاه «دفء البيت».
// كل لون هنا له دور. لا تكتب ألوانًا يدويًا في الصفحات؛ استعمل هذه الأسماء.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // قاشاني: اللون الأساسي (الأزرار، البطل، القائمة)
        qashani: {
          50: '#EEF1F9',
          100: '#DCE2F3',
          200: '#B9C4E6',
          300: '#8E9FD3',
          400: '#5F75B8',
          500: '#3A4F96',
          600: '#2C3F82',
          700: '#23336B',
          800: '#1B2857',
          900: '#141D40',
          950: '#0F1430',
        },
        // زعفران: التمييز وحالة «اقترب»
        saffron: {
          50: '#FFF8EB',
          100: '#FBE7C2',
          200: '#F6D08A',
          300: '#EDBB5E',
          400: '#E6AB45',
          500: '#E0A030',
          600: '#B98117',
          700: '#9A6200',
          800: '#7A4D05',
          900: '#5C3A06',
        },
        // نعناع: المال الداخل والحالة المريحة فقط
        mint: {
          50: '#EEF7F2',
          100: '#E4F2EA',
          200: '#C3E3D1',
          300: '#92CCAE',
          400: '#5FAF86',
          500: '#3B9168',
          600: '#2E7D5B',
          700: '#24624A',
          800: '#1D4E3B',
          900: '#163C2E',
        },
        // آجر: التجاوز والحذف فقط
        brick: {
          50: '#FDF1EC',
          100: '#FBE1D6',
          200: '#F5BFA8',
          300: '#EC9673',
          400: '#DB6A40',
          500: '#C9511F',
          600: '#B93D12',
          700: '#962F0E',
          800: '#74250D',
          900: '#561C0B',
        },
        ivory: '#FBF6EE',
        sand: '#F5EBDA',
        ink: '#23201C',
        night: {
          DEFAULT: '#0F1430',
          card: '#182045',
          line: '#2A3462',
        },
        primary: '#23336B',
        danger: '#B93D12',
        warning: '#E0A030',
        info: '#3A4F96',
      },
      fontFamily: {
        sans: ['Almarai', 'Segoe UI', 'Tahoma', 'sans-serif'],
        display: ['"Noto Kufi Arabic"', 'Almarai', 'Tahoma', 'sans-serif'],
      },
      borderRadius: {
        field: '12px',
        card: '22px',
      },
    },
  },
  plugins: [],
};
