import { couponRedemptionService } from "./couponRedemptionService";
import { invoiceService } from "./invoiceService";
import { orderService } from "./orderService";
import { rewardService } from "./rewardService";
import { walletService } from "./walletService";
import type { CheckoutPaymentSnapshot } from "../types/checkoutPayment";
import type { Order } from "../types/order";
import { buildInvoicePayload } from "../utils/invoiceUtils";

export interface CheckoutOrderCreationResult {
  order: Order;
  invoiceCreated: boolean;
  couponRedemptionSaved: boolean;
  rewardTransactionSaved: boolean;
  walletTransactionSaved: boolean;
}

export const checkoutOrderCreationService = {
  /**
   * Translates a finalized checkout snapshot directly into a system order, 
   * handling invoicing, coupon redemptions, and digital asset ledger transactions.
   */
  createOrderFromCheckoutSnapshot: async (
    snapshot: CheckoutPaymentSnapshot
  ): Promise<CheckoutOrderCreationResult> => {
    // 1. Core Action: Order must be created first
    const createdOrder = await orderService.createOrder(snapshot.orderPayload);

    let invoiceCreated = true;
    let couponRedemptionSaved = true;
    let rewardTransactionSaved = true;
    let walletTransactionSaved = true;

    // 2. Soft-fail Operation: Generate PDF invoice details
    try {
      await invoiceService.createInvoice(
        buildInvoicePayload({
          order: createdOrder,
          user: snapshot.user,
          subtotalAmount: snapshot.subtotalAmount,
          couponDiscountAmount: snapshot.couponDiscountAmount,
          deliveryFee: snapshot.deliveryFee,
          totalAmount: snapshot.totalAmount,
          rewardRedemption: snapshot.rewardRedemption,
          walletRedemption: snapshot.walletRedemption
        })
      );
    } catch (invoiceError) {
      console.error("Non-blocking failure: Invoice generation failed:", invoiceError);
      invoiceCreated = false;
    }

    // 3. Soft-fail Operation: Track Coupon Redemption stats
    if (
      snapshot.couponRedemption &&
      snapshot.couponRedemption.couponCode &&
      snapshot.couponRedemption.discountAmount > 0
    ) {
      try {
        await couponRedemptionService.createRedemption({
          redemptionId: `CPN-RED-${Date.now()}`,
          // FIX: Use the nullish coalescing operator to guarantee it is never undefined
          couponId: snapshot.couponRedemption.couponId ?? "",
          couponCode: snapshot.couponRedemption.couponCode,
          userId: snapshot.user.id,
          orderId: createdOrder.orderId,
          orderDbId: createdOrder.id,
          cartTotal: snapshot.couponRedemption.cartTotal,
          discountAmount: snapshot.couponRedemption.discountAmount,
          finalOrderAmount: snapshot.couponRedemption.finalOrderAmount,
          redeemedAt: new Date().toISOString()
        });
      } catch (couponError) {
        console.error("Non-blocking failure: Coupon record saving failed:", couponError);
        couponRedemptionSaved = false;
      }
    }

    // 4. Hard-fail Operation: Record Reward Points Redemption
    if (
      snapshot.rewardRedemption?.rewardsApplied &&
      snapshot.rewardTransaction
    ) {
      try {
        await rewardService.createTransaction({
          transactionId: snapshot.rewardTransaction.transactionId,
          userId: snapshot.user.id,
          type: "REDEEMED",
          source: "ORDER",
          points: snapshot.rewardTransaction.pointsUsed,
          description: `Reward points redeemed for order ${createdOrder.orderId}`,
          createdAt: new Date().toISOString(),
          orderId: createdOrder.orderId,
          referenceId: `reward-redeem-${createdOrder.orderId}`
        });
      } catch (rewardError) {
        rewardTransactionSaved = false;
        console.error("Critical: Reward point transaction recording failed for Order ID: ", createdOrder.orderId, rewardError);
        throw new Error(
          "Order was created, but reward redemption could not be recorded. Please contact support before placing another order."
        );
      }
    }

    // 5. Hard-fail Operation: Record Wallet Debit
    if (
      snapshot.walletRedemption?.walletApplied &&
      snapshot.walletTransaction
    ) {
      try {
        await walletService.createTransaction({
          transactionId: snapshot.walletTransaction.transactionId,
          userId: snapshot.user.id,
          type: "DEBIT",
          source: "ORDER_PAYMENT",
          amount: snapshot.walletTransaction.walletAmountUsed,
          description: `Wallet used for order ${createdOrder.orderId}`,
          createdAt: new Date().toISOString(),
          referenceId: createdOrder.orderId,
          orderId: createdOrder.orderId
        });
      } catch (walletError) {
        walletTransactionSaved = false;
        console.error("Critical: Wallet debit transaction recording failed for Order ID: ", createdOrder.orderId, walletError);
        throw new Error(
          "Order was created, but wallet debit could not be recorded. Please contact support before placing another order."
        );
      }
    }

    return {
      order: createdOrder,
      invoiceCreated,
      couponRedemptionSaved,
      rewardTransactionSaved,
      walletTransactionSaved
    };
  }
};