// What went out on each day of a month: an array with one total per day (index 0 is the 1st).
// Only expenses count; income and fund top-ups are not spending.
export const dailySpending = (transactions, monthStart) => {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const totals = Array.from({ length: days }, () => 0);
  for (const tx of transactions || []) {
    if (tx.type !== 'expense') continue;
    const d = new Date(tx.date);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    totals[d.getDate() - 1] += Number(tx.amount) || 0;
  }
  return totals;
};
