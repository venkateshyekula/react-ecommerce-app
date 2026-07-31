import type { DeliveryPromiseSnapshot } from "./delivery";

export type PaymentMethod = "Credit Card" | "UPI" | "Cash on Delivery" | "Wallet";

export type OrderStatus =
  | "Order Placed"
  | "Packed"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | "Return Requested"
  | "Returned";

export type FulfillmentStatus =
  | "PENDING"
  | "ALLOCATED"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED";  
export interface DeliveryAddress {
  fullName: string;
  mobile: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  quantity: number;
  subtotal: number;
  selectedSize?: string;

  category?: string;
  sellerId?: string;
  sellerName?: string;
  hsnCode?: string;
  gstRate?: number;
  cessRate?: number;
  unit?: string;
}

export interface TrackingSubStep {
  title: string;
  timestamp: string;
  location: string;
}

export interface TrackingStep {
  label: OrderStatus;
  isCompleted: boolean;
  subSteps?: TrackingSubStep[];
}

export interface TrackingEvent {
  id: string;
  status: OrderStatus;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  isCompleted: boolean;
}

export interface Order {
  id: string;
  userId: string;
  orderId: string;
  orderDate: string;
  items: OrderItem[];
  subtotalAmount?: number;
  discountAmount?: number;
  deliveryFee?: number;
  couponCode?: string;
  couponId?: string | number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  deliveryAddress: CheckoutFormValues["deliveryAddress"];
  orderStatus: OrderStatus;
  trackingSteps: TrackingStep[];
  trackingEvents?: TrackingEvent[];
  cancelledAt?: string;
  cancellationReason?: string;
  returnRequestedAt?: string;
  returnReason?: string;
  deliveryPromise?: DeliveryPromiseSnapshot | null;
  fulfillmentStatus?: FulfillmentStatus;
  walletRedemption?: WalletRedemptionSnapshot | null;
  rewardRedemption?: RewardRedemptionSnapshot | null;
  invoiceId?: string;
  invoiceNumber?: string;
}
export interface WalletRedemptionSnapshot {
  walletApplied: boolean;
  walletAmountUsed: number;
  payableAmount: number;
  walletTransactionId?: string;
}

export type CreateOrderPayload = Omit<Order, "id">;

export interface CardPaymentDetails {
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv: string;
}

export interface UpiPaymentDetails {
  upiId: string;
}

export interface CheckoutFormValues {
  deliveryAddress: DeliveryAddress;
  paymentMethod: PaymentMethod | "";
  cardDetails: CardPaymentDetails;
  upiDetails: UpiPaymentDetails;
}

export interface RewardRedemptionSnapshot {
  rewardsApplied: boolean;
  pointsUsed: number;
  rewardDiscountAmount: number;
  payableAmountAfterRewards: number;
  rewardTransactionId?: string;
}