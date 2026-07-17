import { useEffect, useMemo, useState } from "react";
import AdminTablePagination from "../../components/admin/AdminTablePagination";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { useAdminTablePagination } from "../../hooks/useAdminTablePagination";
import { orderService } from "../../services/orderService";
import { returnRequestService } from "../../services/returnRequestService";
import type { ReturnRequest, ReturnRequestStatus } from "../../types/returnRequest";

const statuses: ReturnRequestStatus[] = [
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "PICKUP_SCHEDULED",
  "PICKED_UP",
  "REFUND_INITIATED",
  "REFUNDED",
  "CLOSED"
];

const statusLabels: Record<ReturnRequestStatus, string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PICKUP_SCHEDULED: "Pickup Scheduled",
  PICKED_UP: "Picked Up",
  REFUND_INITIATED: "Refund Initiated",
  REFUNDED: "Refunded",
  CLOSED: "Closed"
};

const getBadgeClass = (status: ReturnRequestStatus): string => {
  switch (status) {
    case "APPROVED":
    case "PICKUP_SCHEDULED":
    case "PICKED_UP":
      return "bg-primary";

    case "REFUND_INITIATED":
      return "bg-info";

    case "REFUNDED":
    case "CLOSED":
      return "bg-success";

    case "REJECTED":
      return "bg-danger";

    case "REQUESTED":
    default:
      return "bg-secondary";
  }
};

const AdminReturnRequestsPage = () => {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<ReturnRequestStatus | "">("");
  const [updatingId, setUpdatingId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const loadRequests = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await returnRequestService.getRequests();

      setRequests(
        data.sort(
          (first, second) =>
            new Date(second.requestedAt).getTime() -
            new Date(first.requestedAt).getTime()
        )
      );
    } catch {
      setErrorMessage("Unable to load return requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus = !statusFilter || request.status === statusFilter;

      const searchableText = [
        request.requestId,
        request.orderId,
        request.userId,
        request.reason,
        request.status
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [requests, searchText, statusFilter]);

  const {
    currentPage,
    itemsPerPage,
    paginatedItems: paginatedRequests,
    setCurrentPage,
    setItemsPerPage
  } = useAdminTablePagination({
    items: filteredRequests,
    defaultItemsPerPage: 10,
    resetDependencies: [searchText, statusFilter]
  });

  const updateReturnStatus = async (
    request: ReturnRequest,
    status: ReturnRequestStatus
  ): Promise<void> => {
    try {
      setUpdatingId(request.id);
      setErrorMessage("");
      setSuccessMessage("");

      const timestamp = new Date().toISOString();

      const patchPayload: Partial<ReturnRequest> = {
        status
      };

      if (status === "APPROVED") {
        patchPayload.approvedAt = timestamp;
      }

      if (status === "REJECTED") {
        patchPayload.rejectedAt = timestamp;
      }

      if (status === "PICKUP_SCHEDULED") {
        patchPayload.pickupScheduledAt = timestamp;
      }

      if (status === "PICKED_UP") {
        patchPayload.pickedUpAt = timestamp;
      }

      if (status === "REFUND_INITIATED") {
        patchPayload.refundInitiatedAt = timestamp;
      }

      if (status === "REFUNDED") {
        patchPayload.refundedAt = timestamp;
      }

      const updatedRequest = await returnRequestService.updateRequest(
        request.id,
        patchPayload
      );

      setRequests((previousRequests) =>
        previousRequests.map((item) =>
          item.id === updatedRequest.id ? updatedRequest : item
        )
      );

      if (status === "APPROVED") {
        await orderService.updateOrder(request.orderDbId, {
          orderStatus: "Return Requested"
        });
      }

      setSuccessMessage(`Return request ${request.requestId} updated.`);
    } catch {
      setErrorMessage("Unable to update return request.");
    } finally {
      setUpdatingId("");
    }
  };

  if (isLoading) {
    return <Loader message="Loading return requests..." />;
  }

  return (
    <div className="admin-return-requests-page">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Return Requests</h1>
          <p className="text-muted mb-0">
            Review, approve, reject and process customer return requests.
          </p>
        </div>

        <Button variant="outline-primary" onClick={() => void loadRequests()}>
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

      <div className="admin-panel-card">
        <div className="d-flex flex-column flex-xl-row justify-content-between gap-3 mb-3">
          <h5 className="fw-bold mb-0">Return Queue</h5>

          <div className="d-flex flex-column flex-md-row gap-2">
            <input
              className="form-control admin-search-input"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search return request..."
            />

            <select
              className="form-select admin-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ReturnRequestStatus | "")
              }
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
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
                <th>Request</th>
                <th>Order</th>
                <th>Reason</th>
                <th>Items</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>

            <tbody>
              {paginatedRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <strong>{request.requestId}</strong>
                    <p className="small text-muted mb-0">
                      {new Date(request.requestedAt).toLocaleString("en-IN")}
                    </p>
                  </td>

                  <td>
                    <strong>{request.orderId}</strong>
                    <p className="small text-muted mb-0">{request.userId}</p>
                  </td>

                  <td>
                    <strong>{request.reason}</strong>
                    {request.comments ? (
                      <p className="small text-muted mb-0">
                        {request.comments}
                      </p>
                    ) : null}
                  </td>

                  <td>{request.items.length}</td>

                  <td>
                    <span className={`badge ${getBadgeClass(request.status)}`}>
                      {statusLabels[request.status]}
                    </span>
                  </td>

                  <td>
                    <select
                      className="form-select form-select-sm admin-status-filter"
                      value={request.status}
                      disabled={updatingId === request.id}
                      onChange={(event) =>
                        void updateReturnStatus(
                          request,
                          event.target.value as ReturnRequestStatus
                        )
                      }
                    >
                      {statuses.map((status) => (
                        <option value={status} key={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}

              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No return requests found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <AdminTablePagination
          totalItems={filteredRequests.length}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemLabel="requests"
        />
      </div>
    </div>
  );
};

export default AdminReturnRequestsPage;