import type { Coupon } from "../types/coupon";

interface CouponValidationResult {
  isValid: boolean;
  message: string;
}

export const calculateCouponDiscount = (
  coupon: Coupon,
  subtotalAmount: number
): number => {
  if (!coupon.isActive) {
    return 0;
  }

  if (subtotalAmount < coupon.minimumOrderAmount) {
    return 0;
  }

  if (coupon.discountType === "FLAT") {
    return Math.min(coupon.discountValue, subtotalAmount);
  }

  const percentageDiscount = Math.round(
    (subtotalAmount * coupon.discountValue) / 100
  );

  if (coupon.maxDiscountAmount) {
    return Math.min(percentageDiscount, coupon.maxDiscountAmount);
  }

  return percentageDiscount;
};

export const validateCouponForCart = (
  coupon: Coupon | null,
  subtotalAmount: number
): CouponValidationResult => {
  if (!coupon) {
    return {
      isValid: false,
      message: "Invalid coupon code."
    };
  }

  if (!coupon.isActive) {
    return {
      isValid: false,
      message: "This coupon is no longer active."
    };
  }

  if (subtotalAmount < coupon.minimumOrderAmount) {
    return {
      isValid: false,
      message: `Minimum order amount should be ₹${coupon.minimumOrderAmount}.`
    };
  }

  return {
    isValid: true,
    message: "Coupon applied successfully."
  };
};