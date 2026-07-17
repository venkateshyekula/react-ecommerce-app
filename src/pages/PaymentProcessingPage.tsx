import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import MockPaymentGatewayPanel from "../components/payment/MockPaymentGatewayPanel";
import PaymentGatewayCallbackHistory from "../components/payment/PaymentGatewayCallbackHistory";
import PaymentStatusTimeline from "../components/payment/PaymentStatusTimeline";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";
import { useToast } from "../context/useToast";
import { checkoutOrderCreationService } from "../services/checkoutOrderCreationService";
import { checkoutPaymentSessionService } from "../services/checkoutPaymentSessionService";
import { paymentGatewayCallbackService } from "../services/paymentGatewayCallbackService";
import { paymentGatewayService } from "../services/paymentGatewayService";
import { paymentTransactionService } from "../services/paymentTransactionService";
import type { CheckoutPaymentSession } from "../types/checkoutPayment";
import type {
  PaymentGatewayStatus,
  PaymentTransaction
} from "../types/payment";
import type { PaymentGatewayCallback } from "../types/paymentGateway";

const PaymentProcessingPage = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const { currentUser } = useAuth();
  const { clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [payment, setPayment] = useState<PaymentTransaction | null>(null);
  const [session, setSession] = useState<CheckoutPaymentSession | null>(null);
  const [callbacks, setCallbacks] = useState<PaymentGatewayCallback[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    const loadPayment = async (): Promise<void> => {
      if (!paymentId) {
        if (isMounted) {
          setPayment(null);
          setSession(null);
          setCallbacks([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setIsLoading(true);
          setErrorMessage("");
        }

        const [paymentData, sessionData, callbackData] = await Promise.all([
          paymentTransactionService.getTransactionByPaymentId(paymentId),
          checkoutPaymentSessionService.getSessionByPaymentId(paymentId),
          paymentGatewayCallbackService.getCallbacksByPaymentId(paymentId)
        ]);

        if (isMounted) {
          setPayment(paymentData);
          setSession(sessionData);
          setCallbacks(callbackData);
        }
      } catch {
        if (isMounted) {
          setErrorMessage(
            "Unable to load payment details. Please make sure JSON Server is running."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPayment();

    return () => {
      isMounted = false;
    };
  }, [paymentId]);

  const createOrderAfterPaymentSuccess = async ({
    updatedPayment,
    callbackDbId,
    shouldForceOrderFailure
  }: {
    updatedPayment: PaymentTransaction;
    callbackDbId: string;
    shouldForceOrderFailure?: boolean;
  }): Promise<void> => {
    if (!session) {
      throw new Error("Checkout payment session was not found.");
    }

    if (shouldForceOrderFailure) {
      throw new Error("Mock order creation failure triggered.");
    }

    const creatingSession =
      await checkoutPaymentSessionService.updateSessionStatus({
        session,
        status: "ORDER_CREATING"
      });

    setSession(creatingSession);

    const result =
      await checkoutOrderCreationService.createOrderFromCheckoutSnapshot(
        session.checkoutSnapshot
      );

    const linkedPayment = await paymentGatewayService.markPaymentLinkedToOrder({
      payment: updatedPayment,
      orderId: result.order.orderId
    });

    setPayment(linkedPayment);

    const completedSession =
      await checkoutPaymentSessionService.updateSessionStatus({
        session: creatingSession,
        status: "ORDER_CREATED",
        orderId: result.order.orderId
      });

    setSession(completedSession);

    if (!result.invoiceCreated) {
      showToast(
        "Invoice warning",
        "Order placed, but invoice could not be generated right now.",
        "warning"
      );
    }

    if (!result.couponRedemptionSaved) {
      showToast(
        "Warning",
        "Order placed, but coupon redemption history could not be saved right now.",
        "warning"
      );
    }

    // Mark completed BEFORE unmounting/navigating away to prevent incomplete persistence runs
    await paymentGatewayCallbackService.markCallbackProcessed(callbackDbId);

    clearCart();

    showToast(
      "Order placed",
      "Payment successful and order created.",
      "success"
    );

    navigate(`/order-success/${result.order.orderId}`, {
      replace: true
    });
  };

  const processGatewayCallback = async ({
    gatewayStatus,
    gatewayMessage,
    failureReason,
    forceOrderFailure
  }: {
    gatewayStatus: PaymentGatewayStatus;
    gatewayMessage: string;
    failureReason?: string | null;
    forceOrderFailure?: boolean;
  }): Promise<void> => {
    if (!payment) {
      return;
    }

    try {
      setIsProcessing(true);

      const callback =
        await paymentGatewayCallbackService.createCallback({
          paymentId: payment.paymentId,
          checkoutReferenceId: payment.checkoutReferenceId,
          gatewayStatus,
          gatewayReferenceId: payment.gatewayReferenceId,
          gatewayMessage,
          failureReason,
          forceOrderFailure
        });

      const updatedPayment = await paymentGatewayService.simulateGatewayCallback(
        {
          payment,
          gatewayStatus,
          failureReason: failureReason ?? undefined
        }
      );

      setPayment(updatedPayment);

      if (gatewayStatus === "CAPTURED") {
        try {
          await createOrderAfterPaymentSuccess({
            updatedPayment,
            callbackDbId: callback.id,
            shouldForceOrderFailure: forceOrderFailure
          });
          // If successful, the redirection sequence handles finishing the chain.
          return; 
        } catch (orderCreationError) {
          const message =
            orderCreationError instanceof Error
              ? orderCreationError.message
              : "Order creation failed after successful payment.";

          const refundRequiredPayment =
            await paymentGatewayService.markPaymentAsRefundRequired({
              payment: updatedPayment,
              reason: "Payment captured but order creation failed.",
              userName: currentUser?.name
            });

          setPayment(refundRequiredPayment);

          if (session) {
            const failedSession =
              await checkoutPaymentSessionService.updateSessionStatus({
                session,
                status: "REFUND_REQUIRED",
                errorMessage: message
              });

            setSession(failedSession);
          }

          showToast(
            "Refund review created",
            "Payment was captured, but order creation failed. Refund request has been queued.",
            "warning"
          );
        }
      }

      if (gatewayStatus === "FAILED" || gatewayStatus === "TIMEOUT") {
        if (session) {
          const failedSession =
            await checkoutPaymentSessionService.updateSessionStatus({
              session,
              status: "PAYMENT_FAILED",
              errorMessage: failureReason ?? "Payment failed."
            });

          setSession(failedSession);
        }

        showToast(
          "Payment failed",
          "Payment failed. Please retry checkout.",
          "danger"
        );
      }

      if (gatewayStatus === "PENDING_GATEWAY_CONFIRMATION") {
        if (session) {
          const pendingSession =
            await checkoutPaymentSessionService.updateSessionStatus({
              session,
              status: "PAYMENT_PENDING"
            });

          setSession(pendingSession);
        }

        showToast(
          "Payment pending",
          "Payment is pending gateway confirmation.",
          "warning"
        );
      }

      if (gatewayStatus === "REFUND_REQUESTED") {
        showToast(
          "Refund requested",
          "Gateway refund request callback has been captured.",
          "info"
        );
      }

      if (gatewayStatus === "REFUND_PROCESSED") {
        showToast(
          "Refund processed",
          "Gateway refund processed callback has been captured.",
          "success"
        );
      }

      // Finalize fallback processing states
      await paymentGatewayCallbackService.markCallbackProcessed(callback.id);

      const latestCallbacks =
        await paymentGatewayCallbackService.getCallbacksByPaymentId(
          payment.paymentId
        );

      setCallbacks(latestCallbacks);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to process gateway callback.";

      showToast("Callback failed", message, "danger");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <main className="payment-processing-page bg-light">
        <div className="container py-5">
          <Loader message="Loading payment..." />
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="payment-processing-page bg-light">
        <section className="container py-5">
          <div className="alert alert-danger">{errorMessage}</div>

          <Link to="/checkout" className="btn btn-primary">
            Back to Checkout
          </Link>
        </section>
      </main>
    );
  }

  if (!payment) {
    return (
      <main className="payment-processing-page bg-light">
        <section className="container py-5">
          <EmptyState
            title="Payment Not Found"
            message="Unable to find the payment attempt."
          />

          <Link to="/checkout" className="btn btn-primary mt-3">
            Back to Checkout
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="payment-processing-page bg-light">
      <section className="container py-5">
        <div className="mb-4">
          <h1 className="fw-bold mb-1">Payment Processing</h1>

          <p className="text-muted mb-0">
            Submit a mock gateway callback to continue payment and order
            lifecycle processing.
          </p>
        </div>

        {session ? (
          <div className="alert alert-light border mb-4">
            <strong>Checkout Session:</strong> {session.checkoutReferenceId}

            <div className="small text-muted">
              Session Status: {session.status}
            </div>
          </div>
        ) : null}

        <div className="row g-4">
          <div className="col-lg-7">
            <MockPaymentGatewayPanel
              payment={payment}
              isProcessing={isProcessing}
              onSubmitGatewayCallback={processGatewayCallback}
            />

            <PaymentGatewayCallbackHistory callbacks={callbacks} />
          </div>

          <div className="col-lg-5">
            <PaymentStatusTimeline payment={payment} />
          </div>
        </div>
      </section>
    </main>
  );
};

export default PaymentProcessingPage;