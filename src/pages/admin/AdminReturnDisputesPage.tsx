import { useCallback, useEffect, useMemo, useState } from "react";
import AdminReturnDisputeReviewPanel from "../../components/admin/AdminReturnDisputeReviewPanel";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";
import { sellerReturnDisputeService } from "../../services/sellerReturnDisputeService";
import type { SellerReturnDispute } from "../../types/sellerReturnDispute";

type AdminDisputeStatusFilter =
  | "ALL"
  | "PENDING_REVIEW"
  | "NEEDS_MORE_EVIDENCE"
  | "APPROVED"
  | "REJECTED";

const AdminReturnDisputesPage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [disputes, setDisputes] = useState<SellerReturnDispute[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [savingDisputeId, setSavingDisputeId] = useState<string>("");
  const [statusFilter, setStatusFilter] =
    useState<AdminDisputeStatusFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const loadDisputes = useCallback(
    async (isManualRefresh = false): Promise<void> => {
      try {
        if (isManualRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const data = await sellerReturnDisputeService.getDisputes();
        setDisputes(data);
      } catch {
        showToast(
          "Disputes load failed",
          "Unable to load seller return disputes.",
          "danger"
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    void loadDisputes();
  }, [loadDisputes]);

  // Filter disputes by both status and search term
  const filteredDisputes = useMemo(() => {
    return disputes.filter((dispute) => {
      const matchesStatus =
        statusFilter === "ALL" || dispute.status === statusFilter;

      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        dispute.disputeId?.toLowerCase().includes(query) ||
        dispute.orderId?.toLowerCase().includes(query) ||
        dispute.sellerName?.toLowerCase().includes(query) ||
        dispute.productName?.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [disputes, statusFilter, searchTerm]);

  const summary = useMemo(() => {
    return {
      total: disputes.length,
      pending: disputes.filter((dispute) => dispute.status === "PENDING_REVIEW")
        .length,
      needsEvidence: disputes.filter(
        (dispute) => dispute.status === "NEEDS_MORE_EVIDENCE"
      ).length,
      approved: disputes.filter((dispute) => dispute.status === "APPROVED")
        .length,
      rejected: disputes.filter((dispute) => dispute.status === "REJECTED")
        .length
    };
  }, [disputes]);

  const updateDisputeDecision = async ({
    dispute,
    status,
    adminDecision,
    remarks
  }: {
    dispute: SellerReturnDispute;
    status: SellerReturnDispute["status"];
    adminDecision: SellerReturnDispute["adminDecision"];
    remarks: string;
  }): Promise<void> => {
    if (!currentUser) {
      showToast(
        "Login required",
        "Please login as admin to update dispute decision.",
        "warning"
      );
      return;
    }

    try {
      setSavingDisputeId(dispute.id);

      const updatedDispute =
        await sellerReturnDisputeService.updateAdminDecision({
          dispute,
          status,
          adminDecision,
          adminRemarks: remarks,
          reviewedByUserId: currentUser.id,
          reviewedByName: currentUser.name
        });

      setDisputes((previousDisputes) =>
        previousDisputes.map((currentDispute) =>
          currentDispute.id === updatedDispute.id
            ? updatedDispute
            : currentDispute
        )
      );

      showToast(
        "Dispute updated",
        `Dispute ${updatedDispute.disputeId} has been updated.`,
        "success"
      );
    } catch {
      showToast(
        "Dispute update failed",
        "Unable to update seller dispute decision.",
        "danger"
      );
    } finally {
      setSavingDisputeId("");
    }
  };

  if (isLoading) {
    return (
      <main className="admin-return-disputes-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading return disputes..." />
        </div>
      </main>
    );
  }

  return (
    <main className="admin-return-disputes-page bg-light min-vh-100">
      {/* Header Section */}
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
            <div>
              <span className="badge rounded-pill text-bg-primary mb-2">
                Phase 12N.3.1
              </span>

              <h1 className="fw-bold mb-1">Admin Return Disputes</h1>

              <p className="text-muted mb-0">
                Review seller evidence, decision history, and return dispute
                re-review requests.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary align-self-lg-start"
              disabled={isRefreshing}
              onClick={() => void loadDisputes(true)}
            >
              <i
                className={`bi ${
                  isRefreshing ? "bi-arrow-repeat spin" : "bi-arrow-clockwise"
                } me-2`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        {/* Metric Summary Cards */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md">
            <div
              className={`bg-white border rounded-4 p-3 shadow-sm role-button cursor-pointer ${
                statusFilter === "ALL" ? "border-primary" : ""
              }`}
              onClick={() => setStatusFilter("ALL")}
            >
              <span className="text-muted small">Total</span>
              <strong className="d-block fs-5">{summary.total}</strong>
            </div>
          </div>

          <div className="col-6 col-md">
            <div
              className={`bg-white border rounded-4 p-3 shadow-sm cursor-pointer ${
                statusFilter === "PENDING_REVIEW" ? "border-warning" : ""
              }`}
              onClick={() => setStatusFilter("PENDING_REVIEW")}
            >
              <span className="text-muted small">Pending</span>
              <strong className="d-block fs-5">{summary.pending}</strong>
            </div>
          </div>

          <div className="col-6 col-md">
            <div
              className={`bg-white border rounded-4 p-3 shadow-sm cursor-pointer ${
                statusFilter === "NEEDS_MORE_EVIDENCE" ? "border-info" : ""
              }`}
              onClick={() => setStatusFilter("NEEDS_MORE_EVIDENCE")}
            >
              <span className="text-muted small">Needs Evidence</span>
              <strong className="d-block fs-5">{summary.needsEvidence}</strong>
            </div>
          </div>

          <div className="col-6 col-md">
            <div
              className={`bg-white border rounded-4 p-3 shadow-sm cursor-pointer ${
                statusFilter === "APPROVED" ? "border-success" : ""
              }`}
              onClick={() => setStatusFilter("APPROVED")}
            >
              <span className="text-muted small">Approved</span>
              <strong className="d-block fs-5">{summary.approved}</strong>
            </div>
          </div>

          <div className="col-6 col-md">
            <div
              className={`bg-white border rounded-4 p-3 shadow-sm cursor-pointer ${
                statusFilter === "REJECTED" ? "border-danger" : ""
              }`}
              onClick={() => setStatusFilter("REJECTED")}
            >
              <span className="text-muted small">Rejected</span>
              <strong className="d-block fs-5">{summary.rejected}</strong>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Status Filter</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as AdminDisputeStatusFilter
                  )
                }
              >
                <option value="ALL">All</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="NEEDS_MORE_EVIDENCE">Needs More Evidence</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="col-md-5">
              <label className="form-label fw-semibold">Search Disputes</label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Dispute ID, Order ID, Seller or Product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dispute List or Empty State */}
        {filteredDisputes.length === 0 ? (
          <EmptyState
            title="No seller disputes"
            message="No seller return disputes match the selected filter or search term."
            iconClassName="bi bi-shield-check text-primary"
          />
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredDisputes.map((dispute) => (
              <AdminReturnDisputeReviewPanel
                dispute={dispute}
                isSaving={savingDisputeId === dispute.id}
                onApprove={(remarks) =>
                  updateDisputeDecision({
                    dispute,
                    status: "APPROVED",
                    adminDecision: "SELLER_APPROVED",
                    remarks
                  })
                }
                onReject={(remarks) =>
                  updateDisputeDecision({
                    dispute,
                    status: "REJECTED",
                    adminDecision: "SELLER_REJECTED",
                    remarks
                  })
                }
                onNeedEvidence={(remarks) =>
                  updateDisputeDecision({
                    dispute,
                    status: "NEEDS_MORE_EVIDENCE",
                    adminDecision: "MORE_EVIDENCE",
                    remarks
                  })
                }
                key={dispute.id}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default AdminReturnDisputesPage;