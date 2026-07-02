export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
};

export const getDiscountedPrice = (price: number, discount: number): number => {
  if (discount <= 0) {
    return price;
  }

  return Math.round(price - (price * discount) / 100);
};