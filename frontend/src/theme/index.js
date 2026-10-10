import { createTheme } from '@mui/material/styles';
import { arSA } from '@mui/material/locale';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';

// إنشاء ذاكرة تخزين مؤقت للاتجاه من اليمين إلى اليسار
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [rtlPlugin],
});

// تعريف الألوان الأساسية
const palette = {
  primary: {
    main: '#2E7D32', // أخضر داكن
    light: '#4CAF50', // أخضر فاتح
    dark: '#1B5E20', // أخضر أغمق
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#FF9800', // برتقالي
    light: '#FFB74D', // برتقالي فاتح
    dark: '#F57C00', // برتقالي أغمق
    contrastText: '#ffffff',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  text: {
    primary: '#212121',
    secondary: '#757575',
  },
};

// تعريف الخطوط
const typography = {
  fontFamily: [
    'Cairo',
    'Amiri',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  h1: {
    fontSize: '2.125rem',
    fontWeight: 600,
  },
  h2: {
    fontSize: '1.5rem',
    fontWeight: 600,
  },
  h3: {
    fontSize: '1.25rem',
    fontWeight: 600,
  },
  h4: {
    fontSize: '1.125rem',
    fontWeight: 600,
  },
  h5: {
    fontSize: '1rem',
    fontWeight: 600,
  },
  h6: {
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  body1: {
    fontSize: '1rem',
  },
  body2: {
    fontSize: '0.875rem',
  },
};

// تعريف التباعد
const spacing = 8;

// تعريف الظلال
const shadows = [
  'none',
  '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
  '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
  // ... باقي الظلال
];

// إنشاء الثيم
const theme = createTheme({
  direction: 'rtl',
  palette,
  typography,
  spacing,
  shadows,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateX(-4px)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#212121',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
}, arSA);

export { theme, cacheRtl };