// Tabs of the phone bottom bar. `null` is the slot of the centre «+» button.
export const NAV_TABS = [
  { to: '/dashboard', icon: 'home', label: 'الرئيسية' },
  { to: '/transactions', icon: 'list', label: 'العمليات' },
  null,
  { to: '/budget', icon: 'target', label: 'الميزانيات' },
  { to: '/funds', icon: 'wallet', label: 'الصندوق' },
];

// Slot (grid column) of the tab matching the current page, or -1 when no tab matches
// (settings, a page not in the bar). A tab also matches its sub-pages: /funds/12 → /funds.
export const activeSlot = (pathname = '') =>
  NAV_TABS.findIndex(tab => tab && (pathname === tab.to || pathname.startsWith(`${tab.to}/`)));

// Centre of a slot, in % of the bar width measured from the inline start (the right in RTL).
export const slotCenter = slot => ((slot + 0.5) * 100) / NAV_TABS.length;
