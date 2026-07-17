import { apiClient } from "./apiClient";
import type {
  CheckoutPaymentSession,
  CheckoutPaymentSessionStatus,
  CreateCheckoutPaymentSessionPayload
} from "../types/checkoutPayment";
import { createCheckoutPaymentSessionPayload } from "../utils/checkoutPaymentSessionUtils";

const CHECKOUT_PAYMENT_SESSIONS_ENDPOINT = "/checkoutPaymentSessions";

export const checkoutPaymentSessionService = {
  /**
   * Retrieves all checkout payment session records for reconciliation.
   */
  getSessions: async (): Promise<CheckoutPaymentSession[]> => {
    return apiClient.get<CheckoutPaymentSession[]>(
      CHECKOUT_PAYMENT_SESSIONS_ENDPOINT
    );
  },
  
  /**
   * Retrieves a checkout payment session associated with a specific payment gateway ID.
   */
  getSessionByPaymentId: async (
    paymentId: string
  ): Promise<CheckoutPaymentSession | null> => {
    const sessions = await apiClient.get<CheckoutPaymentSession[]>(
      `${CHECKOUT_PAYMENT_SESSIONS_ENDPOINT}?paymentId=${encodeURIComponent(
        paymentId
      )}`
    );

    return sessions[0] ?? null;
  },

  /**
   * Initializes and creates a new checkout payment transaction session records.
   */
  createSession: async (
    payload: CreateCheckoutPaymentSessionPayload
  ): Promise<CheckoutPaymentSession> => {
    // Standardizes the payload structure before sending it to the database
    const sessionPayload = createCheckoutPaymentSessionPayload(payload);

    return apiClient.post<CheckoutPaymentSession, typeof sessionPayload>(
      CHECKOUT_PAYMENT_SESSIONS_ENDPOINT,
      sessionPayload
    );
  },

  /**
   * Performs partial updates on a target checkout payment session record by its database ID.
   */
  updateSession: async (
    sessionDbId: string,
    payload: Partial<Omit<CheckoutPaymentSession, "id" | "createdAt">>
  ): Promise<CheckoutPaymentSession> => {
    return apiClient.patch<
      CheckoutPaymentSession,
      Partial<CheckoutPaymentSession>
    >(
      `${CHECKOUT_PAYMENT_SESSIONS_ENDPOINT}/${encodeURIComponent(sessionDbId)}`, 
      {
        ...payload,
        updatedAt: new Date().toISOString() // Keeps the timestamp accurate
      }
    );
  },

  /**
   * Helper utility to quickly transition states, link final Order IDs, or register errors.
   */
  updateSessionStatus: async ({
    session,
    status,
    orderId,
    errorMessage
  }: {
    session: CheckoutPaymentSession;
    status: CheckoutPaymentSessionStatus;
    orderId?: string | null;
    errorMessage?: string | null;
  }): Promise<CheckoutPaymentSession> => {
    return checkoutPaymentSessionService.updateSession(session.id, {
      status,
      // Fallback safely to previous database properties to avoid overwriting existing data with undefined
      orderId: orderId ?? session.orderId ?? null,
      errorMessage: errorMessage ?? null
    });
  }
};