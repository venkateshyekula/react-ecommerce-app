import { apiClient } from "./apiClient";
import type {
  Coupon,
  CouponRedemption,
  CreateCouponPayload,
  CreateCouponRedemptionPayload,
  UpdateCouponPayload
} from "../types/coupon";
import { assertValidDeleteId } from "../utils/deleteSafetyUtils";

const COUPONS_ENDPOINT = "/coupons";
const COUPON_REDEMPTIONS_ENDPOINT = "/couponRedemptions";

export const couponService = {
  getCoupons: async (): Promise<Coupon[]> => {
    const coupons = await apiClient.get<Coupon[]>(COUPONS_ENDPOINT);

    return coupons.sort(
      (firstCoupon, secondCoupon) =>
        new Date(secondCoupon.createdAt).getTime() -
        new Date(firstCoupon.createdAt).getTime()
    );
  },

  getCouponByCode: async (code: string): Promise<Coupon | null> => {
    const normalizedCode = code.trim().toUpperCase();

    const coupons = await apiClient.get<Coupon[]>(
      `${COUPONS_ENDPOINT}?code=${encodeURIComponent(normalizedCode)}`
    );

    return coupons[0] ?? null;
  },

  createCoupon: async (payload: CreateCouponPayload): Promise<Coupon> => {
    const now = new Date().toISOString();

    const coupon: Coupon = {
      id: `coupon-${Date.now()}`,
      usedCount: 0,
      createdAt: now,
      updatedAt: now,
      ...payload,
      code: payload.code.trim().toUpperCase()
    };

    return apiClient.post<Coupon, Coupon>(COUPONS_ENDPOINT, coupon);
  },

  updateCoupon: async (
    couponId: string,
    payload: UpdateCouponPayload
  ): Promise<Coupon> => {
    return apiClient.patch<Coupon, UpdateCouponPayload>(
      `${COUPONS_ENDPOINT}/${couponId}`,
      payload
    );
  },

  /*deleteCoupon: async (couponId: string): Promise<void> => {
    await apiClient.delete<void>(`${COUPONS_ENDPOINT}/${couponId}`);
  },*/

  deleteCoupon: async (couponId: string): Promise<void> => {
  assertValidDeleteId({
    entityType: "coupon",
    id: couponId
  });

  await apiClient.delete<void>(
    `${COUPONS_ENDPOINT}/${encodeURIComponent(couponId)}`
  );
},

  getRedemptions: async (): Promise<CouponRedemption[]> => {
    const redemptions = await apiClient.get<CouponRedemption[]>(
      COUPON_REDEMPTIONS_ENDPOINT
    );

    return redemptions.sort(
      (firstRedemption, secondRedemption) =>
        new Date(secondRedemption.redeemedAt).getTime() -
        new Date(firstRedemption.redeemedAt).getTime()
    );
  },

  getRedemptionsByUserId: async (
    userId: string
  ): Promise<CouponRedemption[]> => {
    return apiClient.get<CouponRedemption[]>(
      `${COUPON_REDEMPTIONS_ENDPOINT}?userId=${encodeURIComponent(userId)}`
    );
  },

  getRedemptionsByCouponId: async (
    couponId: string
  ): Promise<CouponRedemption[]> => {
    return apiClient.get<CouponRedemption[]>(
      `${COUPON_REDEMPTIONS_ENDPOINT}?couponId=${encodeURIComponent(couponId)}`
    );
  },

  createRedemption: async (
    payload: CreateCouponRedemptionPayload
  ): Promise<CouponRedemption> => {
    const redemption: CouponRedemption = {
      id: `coupon-redemption-${Date.now()}`,
      redeemedAt: new Date().toISOString(),
      ...payload
    };

    return apiClient.post<CouponRedemption, CouponRedemption>(
      COUPON_REDEMPTIONS_ENDPOINT,
      redemption
    );
  },

  incrementCouponUsage: async (coupon: Coupon): Promise<Coupon> => {
    return couponService.updateCoupon(coupon.id, {
      usedCount: coupon.usedCount + 1,
      updatedAt: new Date().toISOString()
    });
  }
};