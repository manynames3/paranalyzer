export const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v);

export const fmtPercent = (v: number, decimals = 1) =>
  `${v.toFixed(decimals)}%`;

export const fmtNumber = (v: number) =>
  new Intl.NumberFormat('en-US').format(v);
