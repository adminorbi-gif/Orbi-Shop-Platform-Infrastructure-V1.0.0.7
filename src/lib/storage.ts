// Moved to DB
type CurrencyFormatOptions = {
  compact?: boolean;
  showDecimals?: boolean;
};

export const formatCurrency = (amount: number, options: CurrencyFormatOptions = {}) => {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  const { compact = false, showDecimals = false } = options;

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(num);

  if (compact) {
    const abs = Math.abs(value);
    const compactValue =
      abs >= 1_000_000_000
        ? `${formatNumber(value / 1_000_000_000)}B`
        : abs >= 1_000_000
          ? `${formatNumber(value / 1_000_000)}M`
          : abs >= 100_000
            ? `${formatNumber(value / 1_000)}K`
            : formatNumber(value);

    return `TSh ${compactValue}`;
  }

  return `TSh ${formatNumber(value)}`;
};

export const getCouponsLocal = () => {
  try {
    const data = localStorage.getItem('orbishop_coupons');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveCouponsLocal = (coupons: any[]) => {
  localStorage.setItem('orbishop_coupons', JSON.stringify(coupons));
};
