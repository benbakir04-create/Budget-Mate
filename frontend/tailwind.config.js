/** @type {import('tailwindcss').Config} */
// نظام تصميم وازن: الاتجاه الرابع «مشرق ومرح» باللون الزمردي.
// كل لون هنا له دور. لا تكتب ألوانًا يدويًا في الصفحات؛ استعمل هذه الأسماء.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // زمردي: اللون الأساسي (الأزرار، بطاقة الرصيد، القسم المفتوح)
        brand: {
          50: '#E8F7F0',
          100: '#D1F0E2',
          200: '#A6E2C6',
          300: '#6FCFA3',
          400: '#36B87F',
          500: '#12A26E',
          600: '#0E8A5D',
          700: '#0B7A59',
          800: '#0A5E45',
          900: '#084A37',
          950: '#052E22',
        },
        // شمس: التمييز (شريط ما بقي) وحالة «اقترب»
        sun: {
          50: '#FFF8E6',
          100: '#FFF0C7',
          200: '#FFE08F',
          300: '#FFD66B',
          400: '#F9C440',
          500: '#F5B829',
          600: '#D99A0B',
          700: '#A06A00',
          800: '#7A5000',
          900: '#5C3C00',
        },
        // نعناع: المال الداخل والحالة المريحة فقط
        mint: {
          50: '#E6F7EF',
          100: '#CFF3DC',
          200: '#A3E5BF',
          300: '#6DD19B',
          400: '#34B875',
          500: '#17A060',
          600: '#0E8F58',
          700: '#0B7347',
          800: '#0A5A39',
          900: '#08462D',
        },
        // تنبيه: التجاوز والحذف فقط
        alert: {
          50: '#FEF0F0',
          100: '#FDE8E8',
          200: '#FBC9CA',
          300: '#F69C9F',
          400: '#EE6A6E',
          500: '#E5484D',
          600: '#D2343A',
          700: '#AF262C',
          800: '#8C1F24',
          900: '#6E1A1E',
        },
        canvas: '#F5F6FA',
        soft: '#EEF0F6',
        ink: '#161827',
        night: {
          DEFAULT: '#0F1220',
          card: '#181C2E',
          line: '#262B42',
        },
        primary: '#12A26E',
        danger: '#E5484D',
        warning: '#F5B829',
        info: '#2F5BEA',
      },
      fontFamily: {
        sans: ['"Readex Pro"', 'Segoe UI', 'Tahoma', 'sans-serif'],
        display: ['"Readex Pro"', 'Segoe UI', 'Tahoma', 'sans-serif'],
      },
      borderRadius: {
        field: '14px',
        card: '24px',
      },
    },
  },
  plugins: [],
};
