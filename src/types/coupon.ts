export type CouponDiscountType = "PERCENTAGE" | "FLAT";

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maxDiscountAmount?: number;
  isActive: boolean;
}

export interface AppliedCoupon {
  coupon: Coupon;
  discountAmount: number;
}