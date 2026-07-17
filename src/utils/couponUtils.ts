import type { Coupon } from "../types/coupon";

interface CouponValidationResult {
  isValid: boolean;
  message: string;
}

export const calculateCouponDiscount = (
  coupon: Coupon,
  cartTotal: number
): number => {
  if (coupon.discountType === "FREE_SHIPPING") {
    return 0;
  }

  if (coupon.discountType === "FLAT") {
    return Math.min(coupon.discountValue, cartTotal);
  }

  const percentageDiscount = Math.round(
    (cartTotal * coupon.discountValue) / 100
  );

  if (coupon.maxDiscountAmount) {
    return Math.min(percentageDiscount, coupon.maxDiscountAmount);
  }

  return percentageDiscount;
};

export const validateCouponForCart = (
  coupon: Coupon | null,
  cartTotal: number
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
      message: "This coupon is currently inactive."
    };
  }

  const now = new Date();
  const validFrom = new Date(coupon.validFrom);
  const validUntil = new Date(coupon.validUntil);

  if (now < validFrom) {
    return {
      isValid: false,
      message: "This coupon is not active yet."
    };
  }

  if (now > validUntil) {
    return {
      isValid: false,
      message: "This coupon has expired."
    };
  }

  if (cartTotal < coupon.minCartValue) {
    return {
      isValid: false,
      message: `Minimum cart value should be ₹${coupon.minCartValue}.`
    };
  }

  if (
    typeof coupon.usageLimit === "number" &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return {
      isValid: false,
      message: "This coupon usage limit has been reached."
    };
  }

  return {
    isValid: true,
    message: "Coupon applied successfully."
  };
};