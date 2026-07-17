import { apiClient } from "./apiClient";
import type {
  CouponRedemption,
  CreateCouponRedemptionPayload
} from "../types/couponRedemption";

const COUPON_REDEMPTIONS_ENDPOINT = "/couponRedemptions";

export const couponRedemptionService = {
  async getRedemptions(): Promise<CouponRedemption[]> {
    return apiClient.get<CouponRedemption[]>(COUPON_REDEMPTIONS_ENDPOINT);
  },

  async getRedemptionsByUserId(userId: string): Promise<CouponRedemption[]> {
    return apiClient.get<CouponRedemption[]>(
      `${COUPON_REDEMPTIONS_ENDPOINT}?userId=${encodeURIComponent(userId)}`
    );
  },

  async getRedemptionsByCouponCode(
    couponCode: string
  ): Promise<CouponRedemption[]> {
    return apiClient.get<CouponRedemption[]>(
      `${COUPON_REDEMPTIONS_ENDPOINT}?couponCode=${encodeURIComponent(
        couponCode
      )}`
    );
  },

  async getRedemptionsByCouponCodeAndUserId(
    couponCode: string,
    userId: string
  ): Promise<CouponRedemption[]> {
    return apiClient.get<CouponRedemption[]>(
      `${COUPON_REDEMPTIONS_ENDPOINT}?couponCode=${encodeURIComponent(
        couponCode
      )}&userId=${encodeURIComponent(userId)}`
    );
  },

  async createRedemption(
    payload: CreateCouponRedemptionPayload
  ): Promise<CouponRedemption> {
    const redemption: CouponRedemption = {
      id: `coupon-redemption-db-${Date.now()}`,
      ...payload
    };

    return apiClient.post<CouponRedemption, CouponRedemption>(
      COUPON_REDEMPTIONS_ENDPOINT,
      redemption
    );
  }
};