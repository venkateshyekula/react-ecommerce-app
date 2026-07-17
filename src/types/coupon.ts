export type CouponDiscountType = "PERCENTAGE" | "FLAT" | "FREE_SHIPPING";

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minCartValue: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppliedCoupon {
  coupon: Coupon;
  discountAmount: number;
}

export interface CouponRedemption {
  id: string;
  couponId: string | number;
  couponCode: string;
  userId: string;
  orderId: string;
  discountAmount: number;
  redeemedAt: string;
}

export interface CreateCouponPayload {
  code: string;
  title: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minCartValue: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
}

export interface UpdateCouponPayload {
  code?: string;
  title?: string;
  description?: string;
  discountType?: CouponDiscountType;
  discountValue?: number;
  minCartValue?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount?: number;
  perUserLimit?: number;
  isActive?: boolean;
  validFrom?: string;
  validUntil?: string;
  updatedAt: string;
}

export interface CreateCouponRedemptionPayload {
  couponId: string;
  couponCode: string;
  userId: string;
  orderId: string;
  discountAmount: number;
}