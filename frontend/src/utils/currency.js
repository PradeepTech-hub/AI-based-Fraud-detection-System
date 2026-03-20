const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export function formatCurrencyINR(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return inrFormatter.format(0);
  }
  return inrFormatter.format(amount);
}

