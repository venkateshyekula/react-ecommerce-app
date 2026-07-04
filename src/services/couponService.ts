import { apiClient } from "./apiClient";
import type { Coupon } from "../types/coupon";

const COUPONS_ENDPOINT = "/coupons";

export const couponService = {
  getCoupons: async (): Promise<Coupon[]> => {
    return apiClient.get<Coupon[]>(COUPONS_ENDPOINT);
  },

  getCouponByCode: async (code: string): Promise<Coupon | null> => {
    const normalizedCode = code.trim().toUpperCase();

    const coupons = await apiClient.get<Coupon[]>(
      `${COUPONS_ENDPOINT}?code=${encodeURIComponent(normalizedCode)}`
    );

    return coupons.length > 0 ? coupons[0] : null;
  }
};