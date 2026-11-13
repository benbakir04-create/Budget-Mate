// Currencies the app offers. Algeria (DZD) is the launch market, so it is the default.
export const DEFAULT_CURRENCY = 'DZD';

export const CURRENCIES = [
  { code: 'DZD', symbol: 'د.ج', name: 'دينار جزائري' },
  { code: 'EUR', symbol: '€', name: 'يورو' },
  { code: 'USD', symbol: '$', name: 'دولار أمريكي' },
];

// Short label shown next to amounts, e.g. "1,500 د.ج".
export const currencyLabel = code => {
  const wanted = code || DEFAULT_CURRENCY;
  const currency = CURRENCIES.find(c => c.code === wanted);
  return currency ? currency.symbol : wanted;
};
