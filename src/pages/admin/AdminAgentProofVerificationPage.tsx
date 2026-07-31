import { useCallback, useEffect, useMemo, useState } from "react";
import AdminAgentProofReviewCard from "../../components/admin/AdminAgentProofReviewCard";
import AdminAgentProofSummaryCards from "../../components/admin/AdminAgentProofSummaryCards";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import Pagination from "../../components/common/Pagination";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";
import { agentProofVerificationService } from "../../services/agentProofVerificationService";
import type {
  AgentProofReviewRow,
  AgentProofSourceType,
  AgentProofVerificationDashboardData,
  AgentProofVerificationStatus,
} from "../../types/agentProofVerification";

type ProofTypeFilter = "ALL" | AgentProofSourceType;
type VerificationFilter = "ALL" | AgentProofVerificationStatus;

const AdminAgentProofVerificationPage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<AgentProofVerificationDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savingProofId, setSavingProofId] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [proofTypeFilter, setProofTypeFilter] =
    useState<ProofTypeFilter>("ALL");
  const [verificationFilter, setVerificationFilter] =
    useState<VerificationFilter>("ALL");

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const data = await agentProofVerificationService.getDashboardData();

      setDashboardData(data);
    } catch {
      showToast(
        "Proof verification load failed",
        "Unable to load pickup and delivery proof verification dashboard.",
        "danger",
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, proofTypeFilter, verificationFilter]);

  const filteredRows = useMemo(() => {
    const rows = dashboardData?.proofRows ?? [];
    const normalizedSearch = searchText.trim().toLowerCase();

    return rows.filter((row) => {
      const searchableText = [
        row.proofId ?? "",
        row.assignmentId ?? "",
        row.taskId ?? "",
        row.orderId ?? "",
        row.returnRequestId ?? "",
        row.agentId ?? "",
        row.agentName ?? "",
        row.customerName ?? "",
        row.proofType ?? "",
        row.verificationStatus ?? "",
        row.sourceType ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const matchesProofType =
        proofTypeFilter === "ALL" || row.sourceType === proofTypeFilter;

      const matchesVerification =
        verificationFilter === "ALL" ||
        row.verificationStatus === verificationFilter;

      return matchesSearch && matchesProofType && matchesVerification;
    });
  }, [dashboardData, searchText, proofTypeFilter, verificationFilter]);

  const totalItems = filteredRows.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const isFilterActive =
    Boolean(searchText.trim()) ||
    proofTypeFilter !== "ALL" ||
    verificationFilter !== "ALL";

  const handleResetFilters = () => {
    setSearchText("");
    setProofTypeFilter("ALL");
    setVerificationFilter("ALL");
  };

  const handleReviewProof = async ({
    row,
    status,
    remarks,
  }: {
    row: AgentProofReviewRow;
    status: AgentProofVerificationStatus;
    remarks: string;
  }): Promise<void> => {
    if (!currentUser) {
      showToast(
        "Login required",
        "Please login as admin to verify proof.",
        "warning",
      );
      return;
    }

    try {
      setSavingProofId(row.id);

      await agentProofVerificationService.reviewProof({
        row,
        payload: {
          status,
          reviewRemarks: remarks,
          reviewedByUserId: currentUser.id,
          reviewedByName: currentUser.name,
        },
      });

      showToast(
        "Proof review saved",
        `Proof ${row.proofId} has been ${status.toLowerCase()}.`,
        "success",
      );

      await loadDashboard();
    } catch {
      showToast(
        "Proof review failed",
        "Unable to update proof verification status.",
        "danger",
      );
    } finally {
      setSavingProofId("");
    }
  };

  if (isLoading) {
    return (
      <main className="admin-agent-proof-verification-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading proof verification dashboard..." />
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="admin-agent-proof-verification-page bg-light min-vh-100">
        <section className="container-fluid py-5">
          <EmptyState
            title="Proof verification unavailable"
            message="Pickup and delivery proof data could not be loaded."
            iconClassName="bi bi-card-checklist text-primary"
          />
        </section>
      </main>
    );
  }

  return (
    <main className="admin-agent-proof-verification-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <div>
              <h1 className="fw-bold mb-1">
                Proof of Pickup + Delivery Verification
              </h1>
              <p className="text-muted mb-0">
                Verify pickup and delivery proof submitted by field agents.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm mb-1 align-self-lg-start"
              onClick={() => void loadDashboard()}
              title="Refresh Dashboard Data"
            >
              <i className="bi bi-arrow-clockwise me-1" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        {/* Metric Summary Cards */}
        <AdminAgentProofSummaryCards summary={dashboardData.summary} />

        {/* Search & Filter Options */}
        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-4">
              <label className="form-label fw-semibold">Search</label>
              <input
                className="form-control"
                value={searchText}
                placeholder="Search proof, task, order, return, agent, customer..."
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-semibold">Proof Source</label>
              <select
                className="form-select"
                value={proofTypeFilter}
                onChange={(event) =>
                  setProofTypeFilter(event.target.value as ProofTypeFilter)
                }
              >
                <option value="ALL">All Sources</option>
                <option value="PICKUP_PROOF">Pickup Proof</option>
                <option value="DELIVERY_PROOF">Delivery Proof</option>
              </select>
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-semibold">Verification</label>
              <select
                className="form-select"
                value={verificationFilter}
                onChange={(event) =>
                  setVerificationFilter(
                    event.target.value as VerificationFilter,
                  )
                }
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="col-lg-2 d-flex justify-content-lg-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                disabled={!isFilterActive}
                onClick={handleResetFilters}
              >
                <i className="bi bi-x-circle me-1" />
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Proof Cards Grid */}
        {filteredRows.length === 0 ? (
          <EmptyState
            title="No proof records found"
            message="No pickup or delivery proof records match the selected filters."
            iconClassName="bi bi-card-checklist text-primary"
          />
        ) : (
          <>
            <div className="row g-3">
              {paginatedRows.map((row) => (
                <div
                  className="col-12 col-xl-6"
                  key={`${row.sourceType}-${row.id}`}
                >
                  <AdminAgentProofReviewCard
                    row={row}
                    isSaving={savingProofId === row.id}
                    onReview={handleReviewProof}
                  />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 pt-3 border-top bg-white p-3 rounded-4 shadow-sm">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={pageSize}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(newPageSize) => {
                  setPageSize(newPageSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default AdminAgentProofVerificationPage;