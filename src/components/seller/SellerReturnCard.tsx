import type { FC } from "react";
import type { ReturnRequest } from "../../types/returnRequest";
import type { SellerReturnDispute } from "../../types/sellerReturnDispute";
import {
  canSellerRaiseReturnDispute,
  formatReturnCurrency,
  formatReturnLabel,
  getRestockDecision,
  getReturnDisplayId,
  getSellerItemsFromReturn
} from "../../utils/sellerReturnWorkflowUtils";
import SellerReturnQcSummary from "./SellerReturnQcSummary";

type SellerReturnCardProps = {
  request: ReturnRequest;
  sellerId: string;
  disputes: SellerReturnDispute[];
  onRaiseDispute: (request: ReturnRequest, productId: string) => void;
};

const getStatusBadgeClassName = (status?: string | null): string => {
  const normalizedStatus = status?.trim().toUpperCase() ?? "";

  if (
    ["PASSED", "APPROVED", "COMPLETED", "REFUND_COMPLETED"].includes(
      normalizedStatus
    )
  ) {
    return "text-bg-success";
  }

  if (
    ["FAILED", "REJECTED", "QUALITY_CHECK_FAILED", "QC_REJECTED"].includes(
      normalizedStatus
    )
  ) {
    return "text-bg-danger";
  }

  if (
    ["IN_PROGRESS", "PENDING", "QUALITY_CHECK_PENDING"].includes(
      normalizedStatus
    )
  ) {
    return "text-bg-warning";
  }

  if (
    ["SCHEDULED", "PICKED_UP", "PICKUP_SCHEDULED", "OUT_FOR_PICKUP"].includes(
      normalizedStatus
    )
  ) {
    return "text-bg-info";
  }

  return "text-bg-secondary";
};

const SellerReturnCard: FC<SellerReturnCardProps> = ({
  request,
  sellerId,
  disputes,
  onRaiseDispute
}) => {
  const sellerItems = getSellerItemsFromReturn(request, sellerId);

  return (
    <div className="card border-0 shadow-sm rounded-4 seller-return-card">
      <div className="card-body p-4">
        {/* Header Summary */}
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
          <div>
            <div className="d-flex flex-wrap gap-2 mb-2">
              <span className="badge text-bg-light border">
                {getReturnDisplayId(request)}
              </span>

              <span className="badge text-bg-light border">
                Order {request.orderId}
              </span>
            </div>

            <h5 className="fw-bold mb-1">
              {sellerItems.length} seller item
              {sellerItems.length === 1 ? "" : "s"} in return
            </h5>

            <p className="text-muted small mb-0">
              Customer reason:{" "}
              {request.returnReason ?? request.reason ?? "No reason provided"}
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2 align-items-start">
            <span className={`badge ${getStatusBadgeClassName(request.status)}`}>
              Return: {formatReturnLabel(request.status)}
            </span>

            <span
              className={`badge ${getStatusBadgeClassName(
                request.pickupStatus
              )}`}
            >
              Pickup: {formatReturnLabel(request.pickupStatus)}
            </span>

            <span
              className={`badge ${getStatusBadgeClassName(
                request.qualityCheckStatus
              )}`}
            >
              QC: {formatReturnLabel(request.qualityCheckStatus)}
            </span>

            <span
              className={`badge ${getStatusBadgeClassName(
                request.refundStatus
              )}`}
            >
              Refund: {formatReturnLabel(request.refundStatus)}
            </span>
          </div>
        </div>

        {/* Quality Check Component */}
        <SellerReturnQcSummary request={request} />

        {/* Individual Seller Items */}
        <div className="mt-3 d-flex flex-column gap-2">
          {sellerItems.map((item) => {
            const activeDispute = disputes.find(
              (dispute) =>
                dispute.returnRequestDbId === request.id &&
                dispute.productId === item.productId &&
                dispute.sellerId === sellerId &&
                !["REJECTED", "CANCELLED"].includes(dispute.status)
            );

            const canDispute = canSellerRaiseReturnDispute({
              request,
              productId: item.productId,
              sellerId,
              disputes
            });

            const restockDecision = getRestockDecision({
              qcStatus: request.qualityCheckStatus,
              conditionGrade:
                request.qualityCheckStatus === "PASSED" ? "A" : undefined,
              hasPendingDispute: Boolean(activeDispute)
            });

            return (
              <div
                className="border rounded-4 p-3 bg-white seller-return-item-row"
                key={`${request.id}-${item.productId}`}
              >
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                  <div className="d-flex gap-3">
                    {/* Fixed Product Image Markup */}
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="rounded border object-fit-cover flex-shrink-0"
                        style={{
                          width: 64,
                          height: 64
                        }}
                      />
                    ) : (
                      <div
                        className="rounded border bg-light text-muted d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: 64,
                          height: 64
                        }}
                      >
                        <i className="bi bi-box fs-4" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h6 className="fw-bold mb-1">{item.name}</h6>

                      <p className="text-muted small mb-1">
                        Product ID: {item.productId}
                      </p>

                      <p className="small mb-2">
                        Qty: {item.quantity} · Value:{" "}
                        <strong>
                          {formatReturnCurrency(item.price * item.quantity)}
                        </strong>
                      </p>

                      <div className="d-flex flex-wrap gap-2">
                        <span className="badge text-bg-light border text-dark">
                          {restockDecision.label}
                        </span>

                        {activeDispute ? (
                          <span className="badge text-bg-warning">
                            Dispute Raised:{" "}
                            {formatReturnLabel(activeDispute.status)}
                          </span>
                        ) : canDispute ? (
                          <span className="badge text-bg-danger">
                            Dispute Eligible
                          </span>
                        ) : (
                          <span className="badge text-bg-light border text-dark">
                            Dispute Not Eligible
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-md-end align-self-md-center">
                    {activeDispute ? (
                      <div className="small text-muted">
                        Dispute ID:
                        <br />
                        <strong>{activeDispute.disputeId}</strong>
                      </div>
                    ) : canDispute ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onRaiseDispute(request, item.productId)}
                      >
                        <i className="bi bi-shield-exclamation me-2" />
                        Raise Dispute
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        disabled
                      >
                        No Action
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SellerReturnCard;