export interface CouponRedemption {
  id: string;
  redemptionId: string;
  couponId: string | number;
  couponCode: string;
  userId: string;
  orderId: string;
  orderDbId: string;
  cartTotal: number;
  discountAmount: number;
  finalOrderAmount: number;
  redeemedAt: string;
}

export interface CreateCouponRedemptionPayload {
  redemptionId: string;
  couponId: string | number;
  couponCode: string;
  userId: string;
  orderId: string;
  orderDbId: string;
  cartTotal: number;
  discountAmount: number;
  finalOrderAmount: number;
  redeemedAt: string;
}