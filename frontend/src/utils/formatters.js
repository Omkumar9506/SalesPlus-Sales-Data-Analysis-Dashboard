/**
 * Formatting utilities for numbers, currencies, dates, and percentages.
 */

export const formatCurrency = (amount, decimals = 2) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

export const formatCompactNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) return '0';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(number);
};

export const formatNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) return '0';
  return new Intl.NumberFormat('en-US').format(number);
};

export const formatPercent = (percent) => {
  if (percent === null || percent === undefined || isNaN(percent)) return '0%';
  const prefix = percent > 0 ? '+' : '';
  return `${prefix}${percent.toFixed(1)}%`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
};
