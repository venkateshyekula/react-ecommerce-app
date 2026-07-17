import type { Invoice, InvoiceItem } from "../types/invoice";

export type GstSupplyType = "INTRA_STATE" | "INTER_STATE";

export interface GstInvoiceCalculationOptions {
  supplierState: string;
  placeOfSupply: string;
  defaultGstRate?: number;
  isTaxInclusive?: boolean;
}

export interface GstInvoiceLine {
  id: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  grossAmount: number;
  discountAmount: number;
  otherCharges: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalAmount: number;
}

export interface GstInvoiceSummary {
  supplyType: GstSupplyType;
  placeOfSupply: string;
  reverseCharge: "No" | "Yes";
  grossTotal: number;
  discountTotal: number;
  otherChargesTotal: number;
  taxableTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  cessTotal: number;
  totalAmount: number;
  payableAmount: number;
  walletAmountUsed: number;
  rewardDiscountAmount: number;
  couponDiscountAmount: number;
  deliveryFee: number;
  lines: GstInvoiceLine[];
}

const roundMoney = (amount: number): number => {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

const normalizeState = (state: string): string => {
  return state.trim().toUpperCase();
};

export const getGstSupplyType = ({
  supplierState,
  placeOfSupply
}: {
  supplierState: string;
  placeOfSupply: string;
}): GstSupplyType => {
  return normalizeState(supplierState) === normalizeState(placeOfSupply)
    ? "INTRA_STATE"
    : "INTER_STATE";
};

const getFallbackHsnCode = (item: InvoiceItem): string => {
  const text = `${item.name} ${item.brand ?? ""} ${item.category ?? ""}`
    .toLowerCase()
    .trim();

  if (
    text.includes("jeans") ||
    text.includes("shirt") ||
    text.includes("t-shirt") ||
    text.includes("tshirt") ||
    text.includes("kurta") ||
    text.includes("dress")
  ) {
    return "62052000";
  }

  if (
    text.includes("shoe") ||
    text.includes("sneaker") ||
    text.includes("footwear")
  ) {
    return "640399";
  }

  if (
    text.includes("bag") ||
    text.includes("wallet") ||
    text.includes("belt")
  ) {
    return "420222";
  }

  return "000000";
};

const getFallbackGstRate = (
  item: InvoiceItem,
  defaultGstRate: number
): number => {
  if (typeof item.gstRate === "number") {
    return item.gstRate;
  }

  const text = `${item.name} ${item.brand ?? ""} ${item.category ?? ""}`
    .toLowerCase()
    .trim();

  if (
    text.includes("jeans") ||
    text.includes("shirt") ||
    text.includes("t-shirt") ||
    text.includes("tshirt") ||
    text.includes("kurta") ||
    text.includes("dress")
  ) {
    return 5;
  }

  return defaultGstRate;
};

const getItemDescription = (item: InvoiceItem): string => {
  const brandText = item.brand ? `${item.brand} - ` : "";
  const sizeText = item.selectedSize ? `, Size: ${item.selectedSize}` : "";

  return `${brandText}${item.name}${sizeText}`;
};

const calculateTaxableAmount = ({
  amount,
  gstRate,
  cessRate,
  isTaxInclusive
}: {
  amount: number;
  gstRate: number;
  cessRate: number;
  isTaxInclusive: boolean;
}): number => {
  if (!isTaxInclusive) {
    return roundMoney(amount);
  }

  const totalRate = gstRate + cessRate;

  if (totalRate <= 0) {
    return roundMoney(amount);
  }

  return roundMoney((amount * 100) / (100 + totalRate));
};

export const buildGstInvoiceSummary = (
  invoice: Invoice,
  options: GstInvoiceCalculationOptions
): GstInvoiceSummary => {
  const supplierState = options.supplierState;
  const placeOfSupply = options.placeOfSupply;
  const supplyType = getGstSupplyType({
    supplierState,
    placeOfSupply
  });

  const defaultGstRate = options.defaultGstRate ?? 5;
  const isTaxInclusive = options.isTaxInclusive ?? true;

  const grossItemsTotal = invoice.items.reduce(
    (total, item) => total + item.subtotal,
    0
  );

  const couponDiscountAmount = invoice.paymentBreakup?.couponDiscountAmount ?? 0;
  const rewardDiscountAmount = invoice.paymentBreakup?.rewardDiscountAmount ?? 0;
  const walletAmountUsed = invoice.paymentBreakup?.walletAmountUsed ?? 0;
  const deliveryFee = invoice.paymentBreakup?.deliveryFee ?? 0;

  /**
   * Coupon and rewards reduce taxable value.
   * Wallet is treated as payment mode, not discount.
   */
  const totalTaxableDiscount = couponDiscountAmount + rewardDiscountAmount;

  const lines: GstInvoiceLine[] = invoice.items.map((item) => {
    const grossAmount = roundMoney(item.subtotal);

    const discountAmount =
      grossItemsTotal > 0
        ? roundMoney((grossAmount / grossItemsTotal) * totalTaxableDiscount)
        : 0;

    const netAmount = Math.max(0, grossAmount - discountAmount);

    const gstRate = getFallbackGstRate(item, defaultGstRate);
    const cessRate = item.cessRate ?? 0;

    const taxableAmount = calculateTaxableAmount({
      amount: netAmount,
      gstRate,
      cessRate,
      isTaxInclusive
    });

    const gstAmount = roundMoney((taxableAmount * gstRate) / 100);
    const cessAmount = roundMoney((taxableAmount * cessRate) / 100);

    const cgstAmount =
      supplyType === "INTRA_STATE" ? roundMoney(gstAmount / 2) : 0;

    const sgstAmount =
      supplyType === "INTRA_STATE" ? roundMoney(gstAmount / 2) : 0;

    const igstAmount = supplyType === "INTER_STATE" ? gstAmount : 0;

    const totalAmount = roundMoney(
      taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount
    );

    return {
      id: `${item.productId}-${item.selectedSize ?? "na"}`,
      description: getItemDescription(item),
      hsnCode: item.hsnCode ?? getFallbackHsnCode(item),
      quantity: item.quantity,
      unit: item.unit ?? "PCS",
      grossAmount,
      discountAmount,
      otherCharges: 0,
      taxableAmount,
      gstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      cessAmount,
      totalAmount
    };
  });

  if (deliveryFee > 0) {
    const gstRate = 18;
    const taxableAmount = calculateTaxableAmount({
      amount: deliveryFee,
      gstRate,
      cessRate: 0,
      isTaxInclusive
    });

    const gstAmount = roundMoney((taxableAmount * gstRate) / 100);

    lines.push({
      id: "delivery-fee",
      description: "Delivery / Logistics Charges",
      hsnCode: "996812",
      quantity: 1,
      unit: "SERVICE",
      grossAmount: deliveryFee,
      discountAmount: 0,
      otherCharges: 0,
      taxableAmount,
      gstRate,
      cgstAmount: supplyType === "INTRA_STATE" ? roundMoney(gstAmount / 2) : 0,
      sgstAmount: supplyType === "INTRA_STATE" ? roundMoney(gstAmount / 2) : 0,
      igstAmount: supplyType === "INTER_STATE" ? gstAmount : 0,
      cessAmount: 0,
      totalAmount: deliveryFee
    });
  }

  const grossTotal = roundMoney(
    lines.reduce((total, line) => total + line.grossAmount, 0)
  );

  const discountTotal = roundMoney(
    lines.reduce((total, line) => total + line.discountAmount, 0)
  );

  const otherChargesTotal = roundMoney(
    lines.reduce((total, line) => total + line.otherCharges, 0)
  );

  const taxableTotal = roundMoney(
    lines.reduce((total, line) => total + line.taxableAmount, 0)
  );

  const cgstTotal = roundMoney(
    lines.reduce((total, line) => total + line.cgstAmount, 0)
  );

  const sgstTotal = roundMoney(
    lines.reduce((total, line) => total + line.sgstAmount, 0)
  );

  const igstTotal = roundMoney(
    lines.reduce((total, line) => total + line.igstAmount, 0)
  );

  const cessTotal = roundMoney(
    lines.reduce((total, line) => total + line.cessAmount, 0)
  );

  const totalAmount = roundMoney(
    lines.reduce((total, line) => total + line.totalAmount, 0)
  );

  const payableAmount =
    invoice.paymentBreakup?.payableAmount ??
    roundMoney(Math.max(0, totalAmount - walletAmountUsed));

  return {
    supplyType,
    placeOfSupply,
    reverseCharge: "No",
    lines,
    grossTotal,
    discountTotal,
    otherChargesTotal,
    taxableTotal,
    cgstTotal,
    sgstTotal,
    igstTotal,
    cessTotal,
    totalAmount,
    payableAmount,
    walletAmountUsed,
    rewardDiscountAmount,
    couponDiscountAmount,
    deliveryFee
  };
};