export type PaymentMethod = "Credit Card" | "UPI" | "Cash on Delivery";

export type OrderStatus =
  | "Order Placed"
  | "Packed"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered";

export interface DeliveryAddress {
  fullName: string;
  mobile: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  quantity: number;
  subtotal: number;
}

export interface SubStep {
  title: string;
  timestamp: string;
  location?: string;
}

export interface TrackingStep {
  label: OrderStatus;
  isCompleted: boolean;
  subSteps?: SubStep[];
}

export interface Order {
  id: string;
  userId: string;
  orderId: string;
  orderDate: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  deliveryAddress: DeliveryAddress;
  orderStatus: OrderStatus;
  trackingSteps: TrackingStep[];
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