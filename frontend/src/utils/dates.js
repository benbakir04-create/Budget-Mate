// Human dates for lists: «اليوم», «أمس», otherwise «12 نوفمبر» (with the year only when it differs).
// ar-DZ gives the month names used in Algeria; -u-nu-latn keeps digits 0-9.
const DAY_MONTH = new Intl.DateTimeFormat('ar-DZ-u-nu-latn', { day: 'numeric', month: 'long' });
const DAY_MONTH_YEAR = new Intl.DateTimeFormat('ar-DZ-u-nu-latn', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const formatDate = (value, now = new Date()) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.getFullYear() === now.getFullYear()
    ? DAY_MONTH.format(date)
    : DAY_MONTH_YEAR.format(date);
};

export const formatDay = (value, now = new Date()) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  return formatDate(date, now);
};
