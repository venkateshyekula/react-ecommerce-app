import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "../components/common/Loader";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { orderService } from "../services/orderService";
import { returnRequestService } from "../services/returnRequestService";
import type { Order, OrderItem } from "../types/order";
import type { ReturnRefundPreference } from "../types/returnRequest";
import { formatCurrency } from "../utils/currencyFormatter";
import {
  calculateReturnRefundAmount,
  pickupSlotOptions,
  returnReasonOptions,
} from "../utils/returnWorkflowUtils";

const ReturnRequestPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [returnReason, setReturnReason] = useState<string>(
    returnReasonOptions[0],
  );
  const [customerComment, setCustomerComment] = useState<string>("");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupSlot, setPickupSlot] = useState<string>(pickupSlotOptions[0]);
  const [refundPreference, setRefundPreference] =
    useState<ReturnRefundPreference>("ORIGINAL_PAYMENT_MODE");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const minSelectableDate = useMemo(() => {
    return new Date().toISOString().slice(0, 10);
  }, []);

  const loadOrder = useCallback(async (): Promise<void> => {
    if (!orderId) {
      setOrder(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await orderService.getOrderByOrderId(orderId);
      setOrder(data);
    } catch {
      showToast("Order load failed", "Unable to load order details.", "danger");
    } finally {
      setIsLoading(false);
    }
  }, [orderId, showToast]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const selectedItems: OrderItem[] = useMemo(() => {
    if (!order) {
      return [];
    }

    return order.items
      .filter((item) => selectedProductIds.includes(item.productId))
      .map((item) => ({
        ...item,
      }));
  }, [order, selectedProductIds]);

  const refundAmount = useMemo(() => {
    return calculateReturnRefundAmount(selectedItems);
  }, [selectedItems]);

  const pickupAddress = useMemo(() => {
    if (!order) {
      return "";
    }

    const address = order.deliveryAddress;
    return `${address.fullName}, ${address.mobile}, ${address.addressLine}, ${address.city}, ${address.state} - ${address.pincode}`;
  }, [order]);

  const handleItemToggle = (productId: string): void => {
    if (isSaving) {
      return;
    }

    setSelectedProductIds((previousIds) =>
      previousIds.includes(productId)
        ? previousIds.filter((id) => id !== productId)
        : [...previousIds, productId],
    );
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!currentUser || !order) {
      return;
    }

    if (selectedItems.length === 0) {
      showToast(
        "Select item",
        "Please select at least one item to return.",
        "warning",
      );
      return;
    }

    if (!pickupDate) {
      showToast(
        "Pickup date required",
        "Please select a pickup date.",
        "warning",
      );
      return;
    }

    try {
      setIsSaving(true);

      // Appending local mid-day time prevents local dates from sliding backwards due to UTC offsets
      const structuredPickupDateTime = new Date(`${pickupDate}T12:00:00`).toISOString();

      await returnRequestService.createReturnRequest({
        orderId: order.orderId,
        orderDbId: order.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        items: selectedItems,
        reason: returnReason,
        returnReason,
        comments: customerComment.trim() || undefined,
        customerComment: customerComment.trim() || null,
        refundAmount,
        refundPreference,
        pickupAddress,
        pickupDate: structuredPickupDateTime,
        pickupSlot,
      });

      showToast(
        "Return requested",
        "Your return request has been submitted.",
        "success",
      );

      navigate("/my-returns", {
        replace: true,
      });
    } catch {
      showToast(
        "Return failed",
        "Unable to create return request.",
        "danger",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="return-request-page bg-light">
        <div className="container py-5">
          <Loader message="Loading order..." />
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="return-request-page bg-light">
        <div className="container py-5">
          <div className="alert alert-danger shadow-sm">Order not found.</div>
        </div>
      </main>
    );
  }

  return (
    <main className="return-request-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <h1 className="fw-bold mb-1">Request Return</h1>
          <p className="text-muted mb-0">
            Select items, reason, pickup slot, and refund preference.
          </p>
        </div>
      </section>

      <section className="container-fluid py-4">
        <form
          className="return-request-form bg-white border rounded-4 p-4 shadow-sm"
          onSubmit={handleSubmit}
        >
          <fieldset disabled={isSaving} className="border-0 p-0 m-0">
            <h5 className="fw-bold mb-3">Select Items</h5>

            <div className="d-flex flex-column gap-2 mb-4">
              {order.items.map((item, index) => {
                const isSelected = selectedProductIds.includes(item.productId);

                return (
                  <div
                    className={`return-select-item d-flex align-items-center gap-3 p-3 border rounded-3 text-start ${
                      isSelected ? "border-primary bg-light-subtle" : ""
                    }`}
                    // FIXED: Appended array item index to secure unique structural keys
                    key={`${item.productId}-${item.selectedSize ?? "no-size"}-${index}`}
                    style={{
                      cursor: isSaving ? "not-allowed" : "pointer",
                    }}
                    onClick={() => handleItemToggle(item.productId)}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input flex-shrink-0"
                      checked={isSelected}
                      // FIXED: Swapped out nested internal onChange to avoid event bubbling bugs from div container wrapper click triggers
                      readOnly 
                    />

                    {/* FIXED: Repaired broken JSX inner braces object reference syntax evaluation bug */}
                    {item.image ? (
                      typeof item.image === "string" ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="img-fluid rounded" 
                          style={{ width: "40px", height: "40px", objectFit: "cover" }} 
                        />
                      ) : (
                        item.image
                      )
                    ) : (
                      <div className="return-request-item-placeholder">
                        <i className="bi bi-box" />
                      </div>
                    )}

                    <span className="flex-grow-1 min-w-0">
                      <strong className="d-block text-truncate small">
                        {item.name}
                      </strong>

                      <small
                        className="text-muted d-block"
                        style={{ fontSize: "0.8rem" }}
                      >
                        Qty {item.quantity}
                        {item.selectedSize
                          ? ` · Size ${item.selectedSize}`
                          : ""}
                      </small>
                    </span>

                    <strong className="flex-shrink-0 small">
                      {formatCurrency(item.price * item.quantity)}
                    </strong>
                  </div>
                );
              })}
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold small">
                  Return Reason
                </label>

                <select
                  className="form-select"
                  value={returnReason}
                  onChange={(event) => setReturnReason(event.target.value)}
                >
                  {returnReasonOptions.map((reason) => (
                    <option value={reason} key={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold small">
                  Refund Preference
                </label>

                <select
                  className="form-select"
                  value={refundPreference}
                  onChange={(event) =>
                    setRefundPreference(
                      event.target.value as ReturnRefundPreference,
                    )
                  }
                >
                  <option value="ORIGINAL_PAYMENT_MODE">
                    Original Payment Mode
                  </option>
                  <option value="WALLET">Wallet</option>
                  <option value="MANUAL_BANK_TRANSFER">
                    Manual Bank Transfer
                  </option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold small">
                  Pickup Date
                </label>

                <input
                  type="date"
                  className="form-control"
                  min={minSelectableDate}
                  value={pickupDate}
                  onChange={(event) => setPickupDate(event.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold small">
                  Pickup Slot
                </label>

                <select
                  className="form-select"
                  value={pickupSlot}
                  onChange={(event) => setPickupSlot(event.target.value)}
                >
                  {pickupSlotOptions.map((slot) => (
                    <option value={slot} key={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold small">
                  Pickup Address
                </label>

                <textarea
                  className="form-control bg-light text-muted"
                  rows={2}
                  value={pickupAddress}
                  readOnly
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold small">
                  Customer Comment
                </label>

                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Describe the issue with the product (optional)."
                  value={customerComment}
                  onChange={(event) => setCustomerComment(event.target.value)}
                />
              </div>
            </div>

            <div className="alert alert-light border mt-4 d-flex justify-content-between align-items-center">
              <span className="text-muted small">Estimated Refund Total:</span>
              <strong className="fs-5 text-primary">
                {formatCurrency(refundAmount)}
              </strong>
            </div>

            <button
              type="submit"
              className="btn btn-primary px-4 mt-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  Submitting Request...
                </>
              ) : (
                "Submit Return Request"
              )}
            </button>
          </fieldset>
        </form>
      </section>
    </main>
  );
};

export default ReturnRequestPage;