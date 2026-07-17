import type { CreateInvoicePayload, InvoiceItem } from "../types/invoice";
import type {
  Order,
  PaymentMethod,
  RewardRedemptionSnapshot,
  WalletRedemptionSnapshot
} from "../types/order";

interface BuildInvoicePayloadInput {
  order: Order;
  user: {
    id: string;
    name: string;
    email: string;
  };
  subtotalAmount: number;
  couponDiscountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  rewardRedemption: RewardRedemptionSnapshot | null;
  walletRedemption: WalletRedemptionSnapshot | null;
}

export const generateInvoiceNumber = (): string => {
  const now = new Date();

  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");

  return `INV-${datePart}-${Date.now()}`;
};

export const mapOrderItemsToInvoiceItems = (
  items: Order["items"]
): InvoiceItem[] => {
  return items.map((item) => ({
    productId: item.productId,
    name: item.name,
    brand: item.brand,
    image: item.image,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.subtotal,
    selectedSize: item.selectedSize,

    hsnCode: item.hsnCode,
    gstRate: item.gstRate,
    cessRate: item.cessRate,
    unit: item.unit,
    category: item.category,
    sellerId: item.sellerId,
    sellerName: item.sellerName
  }));
};

export const buildInvoicePayload = ({
  order,
  user,
  subtotalAmount,
  couponDiscountAmount,
  deliveryFee,
  totalAmount,
  rewardRedemption,
  walletRedemption
}: BuildInvoicePayloadInput): CreateInvoicePayload => {
  const rewardDiscountAmount = rewardRedemption?.rewardDiscountAmount ?? 0;
  const walletAmountUsed = walletRedemption?.walletAmountUsed ?? 0;

  const payableAmount =
    walletRedemption?.payableAmount ??
    rewardRedemption?.payableAmountAfterRewards ??
    Math.max(0, totalAmount - rewardDiscountAmount);

  const finalPaymentMethod: PaymentMethod | "Wallet / Rewards" =
    payableAmount === 0 ? "Wallet / Rewards" : order.paymentMethod;

  const invoiceDate = new Date().toISOString();

  return {
    invoiceNumber: generateInvoiceNumber(),

    orderId: order.orderId,
    orderDbId: order.id,

    userId: user.id,
    userName: user.name,
    userEmail: user.email,

    invoiceDate,

    billingAddress: order.deliveryAddress,
    shippingAddress: order.deliveryAddress,

    items: mapOrderItemsToInvoiceItems(order.items),

    paymentMethod: finalPaymentMethod,

    couponCode: order.couponCode,
    couponId: order.couponId,

    paymentBreakup: {
      subtotalAmount,
      couponDiscountAmount,
      deliveryFee,
      rewardDiscountAmount,
      walletAmountUsed,
      totalAmount,
      payableAmount
    }
  };
};