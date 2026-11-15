// Night mode. The choice is 'light', 'dark' or 'system' (follow the phone), saved in
// localStorage under 'theme'. index.html applies it before the first paint so nothing flashes.
export const THEMES = ['light', 'dark', 'system'];

const KEY = 'theme';

// What the user picked; anything unknown or missing means «follow the phone».
export const readTheme = storage => {
  const saved = storage?.getItem(KEY);
  return THEMES.includes(saved) ? saved : 'system';
};

// Whether the page should be dark for a choice and the phone's own setting.
export const isDark = (theme, systemDark) =>
  theme === 'dark' || (theme === 'system' && Boolean(systemDark));

const systemQuery = () =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

export const applyTheme = theme => {
  const dark = isDark(theme, systemQuery()?.matches);
  document.documentElement.classList.toggle('dark', dark);
  return dark;
};

export const saveTheme = theme => {
  if (theme === 'system') localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new Event('wazen-theme'));
};

// Calls back with { theme, dark } now and whenever the choice or the phone's setting changes.
export const watchTheme = onChange => {
  const emit = () => {
    const theme = readTheme(localStorage);
    onChange({ theme, dark: applyTheme(theme) });
  };
  emit();
  const query = systemQuery();
  query?.addEventListener?.('change', emit);
  window.addEventListener('wazen-theme', emit);
  window.addEventListener('storage', emit);
  return () => {
    query?.removeEventListener?.('change', emit);
    window.removeEventListener('wazen-theme', emit);
    window.removeEventListener('storage', emit);
  };
};
