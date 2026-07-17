import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Order } from "../../types/order";
import type { ReturnPolicyRule } from "../../types/returnPolicy";
import type { ReturnRequest } from "../../types/returnRequest";
import { returnPolicyService } from "../../services/returnPolicyService";
import { returnRequestService } from "../../services/returnRequestService";
import {
  getFallbackFulfillmentStatus,
  getFulfillmentStatusClass,
  getFulfillmentStatusLabel,
} from "../../utils/fulfillmentUtils";
import { formatCurrency } from "../../utils/currencyFormatter";
import {
  canCancelOrder,
  canReturnOrder,
  getOrderStatusBadgeClass,
} from "../../utils/orderUtils";
import Button from "../common/Button";
import OrderDeliveryPromiseCard from "./OrderDeliveryPromiseCard";
import OrderFulfillmentTimeline from "./OrderFulfillmentTimeline";
import OrderReturnEligibilityCard from "./OrderReturnEligibilityCard";
import OrderRewardRedemptionCard from "./OrderRewardRedemptionCard";
import OrderWalletPaymentCard from "./OrderWalletPaymentCard";
import ReturnRequestModal from "./ReturnRequestModal";

interface OrderCardProps {
  order: Order;
  onReorder: (order: Order) => void;
  onCancelOrder: (order: Order, reason: string) => Promise<void>;
  onReturnOrder: (order: Order, reason: string) => Promise<void>;
  isReordering?: boolean;
  isUpdating?: boolean;
}

const OrderCard = ({
  order,
  onReorder,
  onCancelOrder,
  onReturnOrder,
  isReordering = false,
  isUpdating = false,
}: OrderCardProps) => {
  const [cancelReason, setCancelReason] = useState<string>("");
  const [returnReason, setReturnReason] = useState<string>("");
  const [showCancelBox, setShowCancelBox] = useState<boolean>(false);
  const [showReturnBox, setShowReturnBox] = useState<boolean>(false);

  const [returnRules, setReturnRules] = useState<ReturnPolicyRule[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState<boolean>(false);

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(order.orderDate));

  useEffect(() => {
    const loadReturnData = async (): Promise<void> => {
      try {
        const [rules, requests] = await Promise.all([
          returnPolicyService.getRules(),
          returnRequestService.getRequestsByOrderId(order.orderId),
        ]);

        setReturnRules(rules);
        setReturnRequests(requests);
      } catch {
        setReturnRules([]);
        setReturnRequests([]);
      }
    };

    void loadReturnData();
  }, [order.orderId]);

  const handleCancelSubmit = async (): Promise<void> => {
    const reason = cancelReason.trim() || "Customer requested cancellation";

    await onCancelOrder(order, reason);

    setShowCancelBox(false);
    setCancelReason("");
  };

  const handleReturnSubmit = async (): Promise<void> => {
    const reason = returnReason.trim() || "Customer requested return";

    await onReturnOrder(order, reason);

    setShowReturnBox(false);
    setReturnReason("");
  };

  const handleSubmitReturnRequest = async (
    reason: string,
    comments: string,
  ): Promise<void> => {
    try {
      setIsSubmittingReturn(true);

      const createdRequest = await returnRequestService.createRequest({
        requestId: `RET-${Date.now()}`,
        orderId: order.orderId,
        orderDbId: order.id,
        userId: order.userId,
        requestedAt: new Date().toISOString(),
        reason,
        comments,
        status: "REQUESTED",
        items: order.items,
      });

      setReturnRequests((previousRequests) => [
        createdRequest,
        ...previousRequests,
      ]);

      setIsReturnModalOpen(false);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <div className="order-card bg-white p-4 mb-4 shopease-brand-card">
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-1">Order #{order.orderId}</h5>

          <p className="text-muted mb-0">
            <i className="bi bi-calendar3 me-2" />
            {formattedDate}
          </p>
        </div>

        <div className="text-lg-end">
          <span
            className={`badge mb-2 ${getOrderStatusBadgeClass(
              order.orderStatus,
            )}`}
          >
            {order.orderStatus}
          </span>

          <span
            className={`fulfillment-status-pill ${getFulfillmentStatusClass(
              order.fulfillmentStatus,
            )}`}
          >
            {getFulfillmentStatusLabel(
              order.fulfillmentStatus,
              order.orderStatus,
            )}
          </span>

          <h5 className="fw-bold mb-0">{formatCurrency(order.totalAmount)}</h5>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg">
          <h6 className="fw-bold mb-3">Items</h6>

          <div className="order-items-list">
            {order.items.map((item) => (
              <div
                key={`${order.orderId}-${item.productId}-${
                  item.selectedSize ?? "no-size"
                }`}
                className="order-item-row d-flex align-items-center gap-3 mb-3"
              >
                <img
                  src={item.image}
                  alt={item.image}
                  className="rounded-3 border object-fit-cover"
                  style={{ width: "100px", height: "100px" }}
                />

                <div className="flex-grow-1">
                  <h6 className="mb-1 fw-semibold">{item.name}</h6>
                  <p className="text-muted small mb-1">{item.brand}</p>

                  {item.selectedSize ? (
                    <span className="order-size-badge">
                      Size: {item.selectedSize}
                    </span>
                  ) : null}

                  <p className="small mb-0 mt-1">
                    {formatCurrency(item.price)} × {item.quantity}
                  </p>
                </div>

                <div className="fw-bold">{formatCurrency(item.subtotal)}</div>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <OrderDeliveryPromiseCard deliveryPromise={order.deliveryPromise} />
          </div>

          <div className="mb-4">
            <OrderRewardRedemptionCard
              rewardRedemption={order.rewardRedemption}
            />
          </div>

          <div className="mb-4">
            <OrderWalletPaymentCard walletRedemption={order.walletRedemption} />
          </div>

          <OrderReturnEligibilityCard
            order={order}
            rules={returnRules}
            hasExistingReturnRequest={returnRequests.length > 0}
            onRequestReturn={() => setIsReturnModalOpen(true)}
          />

          {isReturnModalOpen ? (
            <ReturnRequestModal
              order={order}
              isSubmitting={isSubmittingReturn}
              onClose={() => setIsReturnModalOpen(false)}
              onSubmit={handleSubmitReturnRequest}
            />
          ) : null}

          <div className="mt-3">
            <h6 className="fw-bold mb-2">Delivery Address</h6>

            <p className="text-muted mb-0">
              {order.deliveryAddress.fullName}, {order.deliveryAddress.mobile}
              <br />
              {order.deliveryAddress.addressLine}, {order.deliveryAddress.city},{" "}
              {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
            </p>
          </div>

          {order.cancellationReason ? (
            <div className="alert alert-danger mt-3 mb-0" role="alert">
              <strong>Cancellation Reason:</strong> {order.cancellationReason}
            </div>
          ) : null}

          {order.returnReason ? (
            <div className="alert alert-warning mt-3 mb-0" role="alert">
              <strong>Return Reason:</strong> {order.returnReason}
            </div>
          ) : null}
        </div>

        <div className="col-lg">
          <OrderFulfillmentTimeline
            fulfillmentStatus={getFallbackFulfillmentStatus(
              order.orderStatus,
              order.fulfillmentStatus,
            )}
            orderStatus={order.orderStatus}
            events={order.trackingEvents}
          />

          <div className="payment-summary bg-light rounded-4 p-3 mt-4">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Payment Method</span>
              <span className="fw-semibold">{order.paymentMethod}</span>
            </div>

            {order.subtotalAmount !== undefined ? (
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Subtotal</span>
                <span className="fw-semibold">
                  {formatCurrency(order.subtotalAmount)}
                </span>
              </div>
            ) : null}

            {order.discountAmount !== undefined && order.discountAmount > 0 ? (
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Discount</span>
                <span className="fw-semibold text-success">
                  - {formatCurrency(order.discountAmount)}
                </span>
              </div>
            ) : null}

            {order.couponCode ? (
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Coupon</span>
                <span className="fw-semibold">{order.couponCode}</span>
              </div>
            ) : null}

            {order.rewardRedemption?.rewardsApplied ? (
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Reward Discount</span>
                <span className="fw-semibold text-success">
                  -{" "}
                  {formatCurrency(order.rewardRedemption.rewardDiscountAmount)}
                </span>
              </div>
            ) : null}

            {order.walletRedemption?.walletApplied ? (
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Wallet Used</span>
                <span className="fw-semibold text-success">
                  - {formatCurrency(order.walletRedemption.walletAmountUsed)}
                </span>
              </div>
            ) : null}

            <div className="d-flex justify-content-between">
              <span className="text-muted">Total Amount</span>
              <span className="fw-bold">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>

          <div className="d-grid gap-2 mt-3">
            <Button
              variant="outline-primary"
              fullWidth
              isLoading={isReordering}
              disabled={order.orderStatus === "Cancelled"}
              onClick={() => onReorder(order)}
            >
              <i className="bi bi-arrow-repeat me-2" />
              Reorder
            </Button>
            <Link
              to={`/invoice/${order.orderId}`}
              className="btn btn-outline-primary"
            >
              <i className="bi bi-receipt me-2" />
              Invoice
            </Link>

            {canCancelOrder(order.orderStatus) ? (
              <Button
                variant="outline-danger"
                fullWidth
                disabled={isUpdating}
                onClick={() => setShowCancelBox((previous) => !previous)}
              >
                <i className="bi bi-x-circle me-2" />
                Cancel Order
              </Button>
            ) : null}

            {canReturnOrder(order.orderStatus) ? (
              <Button
                variant="warning"
                fullWidth
                disabled={isUpdating}
                onClick={() => setShowReturnBox((previous) => !previous)}
              >
                <i className="bi bi-arrow-counterclockwise me-2" />
                Return Order
              </Button>
            ) : null}
          </div>

          {showCancelBox ? (
            <div className="order-action-box mt-3">
              <label className="form-label fw-semibold">
                Cancellation Reason
              </label>

              <textarea
                className="form-control mb-2"
                rows={3}
                value={cancelReason}
                placeholder="Enter cancellation reason"
                onChange={(event) => setCancelReason(event.target.value)}
              />

              <Button
                variant="danger"
                fullWidth
                isLoading={isUpdating}
                onClick={handleCancelSubmit}
              >
                Confirm Cancellation
              </Button>
            </div>
          ) : null}

          {showReturnBox ? (
            <div className="order-action-box mt-3">
              <label className="form-label fw-semibold">Return Reason</label>

              <textarea
                className="form-control mb-2"
                rows={3}
                value={returnReason}
                placeholder="Enter return reason"
                onChange={(event) => setReturnReason(event.target.value)}
              />

              <Button
                variant="warning"
                fullWidth
                isLoading={isUpdating}
                onClick={handleReturnSubmit}
              >
                Confirm Return Request
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
