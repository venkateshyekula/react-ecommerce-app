import { useEffect, useMemo, useState } from "react";
import AdminTablePagination from "../../components/admin/AdminTablePagination";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { useAdminTablePagination } from "../../hooks/useAdminTablePagination";
import { orderService } from "../../services/orderService";
import { refundService } from "../../services/refundService";
import { returnRequestService } from "../../services/returnRequestService";
import type {
  RefundMethod,
  RefundRecord,
  RefundStatus,
} from "../../types/refund";
import type { ReturnRequest } from "../../types/returnRequest";
import { formatCurrency } from "../../utils/currencyFormatter";
import { walletService } from "../../services/walletService";

const refundStatuses: RefundStatus[] = [
  "PENDING",
  "INITIATED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
];

const refundMethods: RefundMethod[] = ["ORIGINAL_PAYMENT", "WALLET", "COUPON"];

const statusLabels: Record<RefundStatus, string> = {
  PENDING: "Pending",
  INITIATED: "Initiated",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

const methodLabels: Record<RefundMethod, string> = {
  ORIGINAL_PAYMENT: "Original Payment",
  WALLET: "Wallet Credit",
  COUPON: "Coupon",
};

const getBadgeClass = (status: RefundStatus): string => {
  switch (status) {
    case "COMPLETED":
      return "bg-success";

    case "FAILED":
      return "bg-danger";

    case "INITIATED":
    case "PROCESSING":
      return "bg-primary";

    case "PENDING":
    default:
      return "bg-secondary";
  }
};

const AdminRefundsPage = () => {
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<RefundStatus | "">("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string>("");
  const [creatingReturnRequestId, setCreatingReturnRequestId] =
    useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const loadData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [refundList, requestList] = await Promise.all([
        refundService.getRefunds(),
        returnRequestService.getRequests(),
      ]);

      setRefunds(
        refundList.sort(
          (first, second) =>
            new Date(second.initiatedAt).getTime() -
            new Date(first.initiatedAt).getTime(),
        ),
      );

      setReturnRequests(
        requestList.filter((request) =>
          ["APPROVED", "PICKED_UP", "REFUND_INITIATED"].includes(
            request.status,
          ),
        ),
      );
    } catch {
      setErrorMessage("Unable to load refund dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const refundableRequests = useMemo(() => {
    const refundedReturnIds = new Set(
      refunds.map((refund) => refund.returnRequestId),
    );

    return returnRequests.filter(
      (request) => !refundedReturnIds.has(request.id),
    );
  }, [returnRequests, refunds]);

  const filteredRefunds = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return refunds.filter((refund) => {
      const matchesStatus = !statusFilter || refund.status === statusFilter;

      const searchableText = [
        refund.refundId,
        refund.orderId,
        refund.userId,
        refund.method,
        refund.status,
        refund.reason,
        refund.compensationCouponCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchableText.includes(query));
    });
  }, [refunds, searchText, statusFilter]);

  const {
    currentPage,
    itemsPerPage,
    paginatedItems: paginatedRefunds,
    setCurrentPage,
    setItemsPerPage,
  } = useAdminTablePagination({
    items: filteredRefunds,
    defaultItemsPerPage: 10,
    resetDependencies: [searchText, statusFilter],
  });

  const createRefundFromReturnRequest = async (
    request: ReturnRequest,
    method: RefundMethod,
  ): Promise<void> => {
    try {
      setCreatingReturnRequestId(request.id);
      setErrorMessage("");
      setSuccessMessage("");

      const refundAmount = request.items.reduce(
        (sum, item) => sum + item.subtotal,
        0,
      );

      const createdRefund = await refundService.createRefund({
        refundId: `REF-${Date.now()}`,
        orderId: request.orderId,
        orderDbId: request.orderDbId,
        returnRequestId: request.id,
        userId: request.userId,
        amount: refundAmount,
        method,
        status: "INITIATED",
        reason: request.reason,
        initiatedAt: new Date().toISOString(),
        compensationCouponCode:
          method === "COUPON" ? `COMP-${Date.now()}` : undefined,
        walletCreditAmount: method === "WALLET" ? refundAmount : undefined,
      });

      await returnRequestService.updateRequest(request.id, {
        status: "REFUND_INITIATED",
        refundInitiatedAt: new Date().toISOString(),
      });

      await orderService.updateOrder(request.orderDbId, {
        orderStatus: "Returned",
      });

      setRefunds((previousRefunds) => [createdRefund, ...previousRefunds]);

      setSuccessMessage(`Refund ${createdRefund.refundId} initiated.`);
    } catch {
      setErrorMessage("Unable to initiate refund.");
    } finally {
      setCreatingReturnRequestId("");
    }
  };

  const updateRefundStatus = async (
    refund: RefundRecord,
    status: RefundStatus,
  ): Promise<void> => {
    try {
      setUpdatingId(refund.id);
      setErrorMessage("");
      setSuccessMessage("");

      const patchPayload: Partial<RefundRecord> = {
        status,
      };

      if (status === "COMPLETED") {
        patchPayload.completedAt = new Date().toISOString();
      }

      if (status === "FAILED") {
        patchPayload.failedAt = new Date().toISOString();
      }

      const updatedRefund = await refundService.updateRefund(
        refund.id,
        patchPayload,
      );

      setRefunds((previousRefunds) =>
        previousRefunds.map((item) =>
          item.id === updatedRefund.id ? updatedRefund : item,
        ),
      );

      if (status === "COMPLETED") {
        await returnRequestService.updateRequest(refund.returnRequestId, {
          status: "REFUNDED",
          refundedAt: new Date().toISOString(),
        });

        if (refund.method === "WALLET") {
          const existingWalletTransactions =
            await walletService.getTransactionsByReferenceId(refund.refundId);

          const alreadyCredited = existingWalletTransactions.some(
            (transaction) =>
              transaction.source === "REFUND" &&
              transaction.refundId === refund.refundId,
          );

          if (!alreadyCredited) {
            await walletService.createTransaction({
              transactionId: `WAL-${Date.now()}`,
              userId: refund.userId,
              type: "CREDIT",
              source: "REFUND",
              amount: refund.walletCreditAmount ?? refund.amount,
              description: `Wallet credit for refund ${refund.refundId}`,
              createdAt: new Date().toISOString(),
              referenceId: refund.refundId,
              refundId: refund.refundId,
              orderId: refund.orderId,
            });
          }
        }
      }

      setSuccessMessage(`Refund ${refund.refundId} updated.`);
    } catch {
      setErrorMessage("Unable to update refund status.");
    } finally {
      setUpdatingId("");
    }
  };

  if (isLoading) {
    return <Loader message="Loading refunds..." />;
  }

  return (
    <div className="admin-refunds-page">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Refunds</h1>
          <p className="text-muted mb-0">
            Initiate and manage customer refunds, coupons and wallet credits.
          </p>
        </div>

        <Button variant="outline-primary" onClick={() => void loadData()}>
          <i className="bi bi-arrow-repeat me-2" />
          Refresh
        </Button>
      </div>

      {errorMessage ? (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      ) : null}

      <div className="admin-panel-card mb-4">
        <h5 className="fw-bold mb-3">Approved Returns Awaiting Refund</h5>

        {refundableRequests.length === 0 ? (
          <p className="text-muted mb-0">
            No approved return requests pending refund.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Return Request</th>
                  <th>Order</th>
                  <th>Reason</th>
                  <th>Amount</th>
                  <th>Initiate</th>
                </tr>
              </thead>

              <tbody>
                {refundableRequests.map((request) => {
                  const refundAmount = request.items.reduce(
                    (sum, item) => sum + item.subtotal,
                    0,
                  );

                  return (
                    <tr key={request.id}>
                      <td>
                        <strong>{request.requestId}</strong>
                        <p className="small text-muted mb-0">
                          {new Date(request.requestedAt).toLocaleString(
                            "en-IN",
                          )}
                        </p>
                      </td>

                      <td>{request.orderId}</td>

                      <td>{request.reason}</td>

                      <td>
                        <strong>{formatCurrency(refundAmount)}</strong>
                      </td>

                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          {refundMethods.map((method) => (
                            <Button
                              key={method}
                              variant="outline-primary"
                              className="btn-sm"
                              isLoading={creatingReturnRequestId === request.id}
                              onClick={() =>
                                void createRefundFromReturnRequest(
                                  request,
                                  method,
                                )
                              }
                            >
                              {methodLabels[method]}
                            </Button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-panel-card">
        <div className="d-flex flex-column flex-xl-row justify-content-between gap-3 mb-3">
          <h5 className="fw-bold mb-0">Refund Records</h5>

          <div className="d-flex flex-column flex-md-row gap-2">
            <input
              className="form-control admin-search-input"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search refund..."
            />

            <select
              className="form-select admin-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as RefundStatus | "")
              }
            >
              <option value="">All Statuses</option>
              {refundStatuses.map((status) => (
                <option value={status} key={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Refund</th>
                <th>Order</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>

            <tbody>
              {paginatedRefunds.map((refund) => (
                <tr key={refund.id}>
                  <td>
                    <strong>{refund.refundId}</strong>
                    <p className="small text-muted mb-0">
                      {new Date(refund.initiatedAt).toLocaleString("en-IN")}
                    </p>
                  </td>

                  <td>{refund.orderId}</td>

                  <td>{methodLabels[refund.method]}</td>

                  <td>
                    <strong>{formatCurrency(refund.amount)}</strong>
                  </td>

                  <td>
                    <span className={`badge ${getBadgeClass(refund.status)}`}>
                      {statusLabels[refund.status]}
                    </span>
                  </td>

                  <td>
                    <select
                      className="form-select form-select-sm admin-status-filter"
                      value={refund.status}
                      disabled={updatingId === refund.id}
                      onChange={(event) =>
                        void updateRefundStatus(
                          refund,
                          event.target.value as RefundStatus,
                        )
                      }
                    >
                      {refundStatuses.map((status) => (
                        <option value={status} key={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}

              {filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No refunds found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <AdminTablePagination
          totalItems={filteredRefunds.length}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemLabel="refunds"
        />
      </div>
    </div>
  );
};

export default AdminRefundsPage;
