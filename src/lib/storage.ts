// Moved to DB
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS' }).format(amount);
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
