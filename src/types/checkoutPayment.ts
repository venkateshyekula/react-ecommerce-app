import type {
  CreateOrderPayload,
  RewardRedemptionSnapshot,
  WalletRedemptionSnapshot
} from "./order";

// ==========================================
// 1. SHARED COMMON TYPES
// ==========================================

export type CheckoutPaymentSessionStatus =
  | "PAYMENT_INITIATED"
  | "PAYMENT_PENDING"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "ORDER_CREATING"
  | "ORDER_CREATED"
  | "ORDER_CREATION_FAILED"
  | "REFUND_REQUIRED";

// ==========================================
// 2. STRICT / MODULAR SCHEMAS (Version B)
// ==========================================

export interface CheckoutPaymentUserSnapshot {
  id: string;
  name: string;
  email: string;
}

export interface CheckoutPaymentCouponSnapshot {
  couponId?: string | number;
  couponCode?: string;
  cartTotal: number;
  discountAmount: number;
  finalOrderAmount: number;
}

export interface CheckoutPaymentRewardTransactionSnapshot {
  transactionId: string;
  pointsUsed: number;
}

export interface CheckoutPaymentWalletTransactionSnapshot {
  transactionId: string;
  walletAmountUsed: number;
}

/**
 * Strict, fully typed Snapshot. Use this when you require 
 * rigid compiler safety matching your domain entities.
 */
export interface CheckoutPaymentSnapshot {
  user: CheckoutPaymentUserSnapshot;
  orderPayload: CreateOrderPayload;
  subtotalAmount: number;
  couponDiscountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  rewardRedemption: RewardRedemptionSnapshot | null;
  walletRedemption: WalletRedemptionSnapshot | null;
  couponRedemption?: CheckoutPaymentCouponSnapshot | null;
  rewardTransaction?: CheckoutPaymentRewardTransactionSnapshot | null;
  walletTransaction?: CheckoutPaymentWalletTransactionSnapshot | null;
}

// ==========================================
// 3. LOOSE / FLAT SCHEMAS (Version A)
// ==========================================

/**
 * Loose, flat Snapshot. Extremely useful for persistence logs, 
 * saving simple drafts, or handling flexible payload payloads.
 */
export interface CheckoutPaymentSnapshotLoose {
  userId: string;
  userName?: string;
  userEmail?: string;
  paymentMethod: string;
  payableAmount: number;

  orderPayload?: unknown;
  invoicePayload?: unknown;

  couponCode?: string;
  couponId?: string | number;
  walletAmountUsed?: number;
  rewardPointsUsed?: number;
  rewardDiscountAmount?: number;

  cartItems?: unknown[];
  deliveryAddress?: unknown;
  paymentBreakup?: unknown;
}

// ==========================================
// 4. UNIFIED SESSIONS & PAYLOADS
// ==========================================

// --- Strict Session Models ---
export interface CheckoutPaymentSession {
  id: string;
  checkoutReferenceId: string;
  paymentId: string;
  userId: string;
  status: CheckoutPaymentSessionStatus;
  checkoutSnapshot: CheckoutPaymentSnapshot; // Uses strict version
  createdAt: string;
  updatedAt: string;
  orderId?: string | null;
  errorMessage?: string | null;
}

export interface CreateCheckoutPaymentSessionPayload {
  checkoutReferenceId: string;
  paymentId: string;
  userId: string;
  checkoutSnapshot: CheckoutPaymentSnapshot; // Uses strict version
}

// --- Loose / Flexible Session Models ---
export interface CheckoutPaymentSessionLoose {
  id: string;
  checkoutReferenceId: string;
  paymentId: string;
  userId: string;
  status: CheckoutPaymentSessionStatus;
  checkoutSnapshot: CheckoutPaymentSnapshotLoose; // Uses loose version
  createdAt: string;
  updatedAt: string;
  orderId?: string | null;
  errorMessage?: string | null;
}

export interface CreateCheckoutPaymentSessionPayloadLoose {
  checkoutReferenceId: string;
  paymentId: string;
  userId: string;
  checkoutSnapshot: CheckoutPaymentSnapshotLoose; // Uses loose version
}