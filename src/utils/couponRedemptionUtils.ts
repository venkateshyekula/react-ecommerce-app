import type { Coupon } from "../types/coupon";
import type { CouponRedemption } from "../types/couponRedemption";

interface CouponUsageValidationResult {
  isValid: boolean;
  message: string;
}

type CouponWithUsageLimits = Coupon & {
  usageLimit?: number;
  maxUsage?: number;
  totalUsageLimit?: number;
  perUserLimit?: number;
  userUsageLimit?: number;
  maxUsagePerUser?: number;
};

export const getCouponGlobalUsageLimit = (
  coupon: CouponWithUsageLimits
): number | undefined => {
  return coupon.usageLimit ?? coupon.maxUsage ?? coupon.totalUsageLimit;
};

export const getCouponPerUserUsageLimit = (
  coupon: CouponWithUsageLimits
): number | undefined => {
  return coupon.perUserLimit ?? coupon.userUsageLimit ?? coupon.maxUsagePerUser;
};

export const validateCouponRedemptionLimits = ({
  coupon,
  couponRedemptions,
  userCouponRedemptions
}: {
  coupon: Coupon;
  couponRedemptions: CouponRedemption[];
  userCouponRedemptions: CouponRedemption[];
}): CouponUsageValidationResult => {
  const extendedCoupon = coupon as CouponWithUsageLimits;

  const globalUsageLimit = getCouponGlobalUsageLimit(extendedCoupon);
  const perUserUsageLimit = getCouponPerUserUsageLimit(extendedCoupon);

  if (
    globalUsageLimit !== undefined &&
    globalUsageLimit > 0 &&
    couponRedemptions.length >= globalUsageLimit
  ) {
    return {
      isValid: false,
      message: "This coupon has reached its total usage limit."
    };
  }

  if (
    perUserUsageLimit !== undefined &&
    perUserUsageLimit > 0 &&
    userCouponRedemptions.length >= perUserUsageLimit
  ) {
    return {
      isValid: false,
      message: "You have already used this coupon the maximum allowed times."
    };
  }

  return {
    isValid: true,
    message: "Coupon can be used."
  };
};