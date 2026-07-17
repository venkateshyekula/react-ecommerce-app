import type { PaymentMethod } from "./order";

export interface InvoiceAddressSnapshot {
  fullName: string;
  mobile: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  brand?: string;
  image?: string;
  price: number;
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

export interface InvoicePaymentBreakup {
  subtotalAmount: number;
  couponDiscountAmount: number;
  deliveryFee: number;
  rewardDiscountAmount: number;
  walletAmountUsed: number;
  totalAmount: number;
  payableAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;

  orderId: string;
  orderDbId: string;

  userId: string;
  userName: string;
  userEmail: string;

  invoiceDate: string;

  billingAddress: InvoiceAddressSnapshot;
  shippingAddress?: InvoiceAddressSnapshot;

  items: InvoiceItem[];

  paymentMethod: PaymentMethod | "Wallet / Rewards";

  couponCode?: string;
  couponId?: string | number;

  paymentBreakup?: InvoicePaymentBreakup;

  createdAt: string;
  updatedAt?: string;
}

export interface CreateInvoicePayload {
  invoiceNumber: string;

  orderId: string;
  orderDbId: string;

  userId: string;
  userName: string;
  userEmail: string;

  invoiceDate: string;

  billingAddress: InvoiceAddressSnapshot;
  shippingAddress: InvoiceAddressSnapshot;

  items: InvoiceItem[];

  paymentMethod: PaymentMethod | "Wallet / Rewards";

  couponCode?: string;
  couponId?: string | number;

  paymentBreakup: InvoicePaymentBreakup;
}