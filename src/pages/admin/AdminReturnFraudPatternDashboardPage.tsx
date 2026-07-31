import React, { useEffect, useMemo, useState } from "react";
import ReturnFraudSummaryCards from "../../components/admin/ReturnFraudSummaryCards";
import ReturnFraudDistributionCharts from "../../components/admin/ReturnFraudDistributionCharts";
import ReturnFraudIntelligenceTable from "../../components/admin/ReturnFraudIntelligenceTable";
import {
  ReturnFraudInvestigationStatus,
  ReturnFraudPatternFilters,
  ReturnFraudPatternRecord,
  ReturnFraudPatternSummary,
  ReturnFraudPatternType,
  ReturnFraudRiskLevel,
  returnFraudPatternTypeLabels,
} from "../../types/returnFraudPattern";
import { returnFraudPatternService } from "../../services/returnFraudPatternService";

const PAGE_SIZE = 10;

const emptySummary: ReturnFraudPatternSummary = {
  totalFlaggedPatterns: 0,
  lowRiskPatterns: 0,
  mediumRiskPatterns: 0,
  highRiskPatterns: 0,
  criticalRiskPatterns: 0,
  totalRefundExposure: 0,
  customersUnderReview: 0,
  sellersLinkedToPatterns: 0,
  productsLinkedToPatterns: 0,
  averageFraudScore: 0,
};

const defaultFilters: ReturnFraudPatternFilters = {
  searchText: "",
  riskLevel: "ALL",
  investigationStatus: "ALL",
  patternType: "ALL",
  minFraudScore: "",
  maxFraudScore: "",
};

const convertToCsv = (records: ReturnFraudPatternRecord[]): string => {
  const headers = [
    "Pattern ID",
    "Customer ID",
    "Customer Name",
    "Customer Email",
    "Customer Phone",
    "Total Orders",
    "Total Returns",
    "Refund Exposure",
    "Fraud Score",
    "Risk Level",
    "Investigation Status",
    "Pattern Types",
    "Common Return Reason",
    "Most Returned Product",
    "Linked Seller",
    "Location Cluster",
    "Order IDs",
    "Return IDs",
    "Risk Reasons",
    "Recommended Actions",
    "First Return Date",
    "Last Return Date",
  ];

  const rows = records.map((item) => [
    item.id,
    item.customerId,
    item.customerName,
    item.customerEmail ?? "",
    item.customerPhone ?? "",
    item.totalOrders,
    item.totalReturns,
    item.totalRefundAmount,
    item.fraudScore,
    item.riskLevel,
    item.investigationStatus,
    item.patternTypes
      .map((type) => returnFraudPatternTypeLabels[type] || type)
      .join(" | "),
    item.mostCommonReturnReason,
    item.mostReturnedProduct ?? "",
    item.mostLinkedSeller ?? "",
    item.locationCluster ?? "",
    item.orderIds.join(" | "),
    item.returnIds.join(" | "),
    item.riskReasons.join(" | "),
    item.recommendedActions.join(" | "),
    item.firstReturnDate ?? "",
    item.lastReturnDate ?? "",
  ]);

  const escapeCsvValue = (value: unknown): string => {
    const text = String(value ?? "");
    const escaped = text.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
};

const downloadCsv = (
  records: ReturnFraudPatternRecord[],
  filePrefix = "return-fraud-patterns"
): void => {
  if (records.length === 0) return;

  const csv = convertToCsv(records);
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${filePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

const AdminReturnFraudPatternDashboardPage: React.FC = () => {
  const [records, setRecords] = useState<ReturnFraudPatternRecord[]>([]);
  const [summary, setSummary] =
    useState<ReturnFraudPatternSummary>(emptySummary);
  const [filters, setFilters] =
    useState<ReturnFraudPatternFilters>(defaultFilters);
  const [selectedPattern, setSelectedPattern] =
    useState<ReturnFraudPatternRecord | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const loadReturnFraudPatterns = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      const response =
        await returnFraudPatternService.getReturnFraudPatterns();

      setRecords(response.records);
      setSummary(response.summary);
    } catch {
      setError("Unable to load return fraud pattern intelligence data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturnFraudPatterns();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const filteredRecords = useMemo(() => {
    const search = filters.searchText.trim().toLowerCase();

    return records.filter((item) => {
      const matchesSearch =
        !search ||
        item.customerName.toLowerCase().includes(search) ||
        item.customerId.toLowerCase().includes(search) ||
        String(item.customerEmail ?? "").toLowerCase().includes(search) ||
        String(item.customerPhone ?? "").toLowerCase().includes(search) ||
        String(item.sellerName ?? "").toLowerCase().includes(search) ||
        String(item.productName ?? "").toLowerCase().includes(search) ||
        String(item.locationCluster ?? "").toLowerCase().includes(search) ||
        item.patternTypes.some((type) =>
          (returnFraudPatternTypeLabels[type] || type)
            .toLowerCase()
            .includes(search)
        );

      const matchesRiskLevel =
        filters.riskLevel === "ALL" || item.riskLevel === filters.riskLevel;

      const matchesStatus =
        filters.investigationStatus === "ALL" ||
        item.investigationStatus === filters.investigationStatus;

      const matchesPatternType =
        filters.patternType === "ALL" ||
        item.patternTypes.includes(filters.patternType);

      const minScore = filters.minFraudScore
        ? Number(filters.minFraudScore)
        : null;

      const maxScore = filters.maxFraudScore
        ? Number(filters.maxFraudScore)
        : null;

      const matchesMinScore =
        minScore === null || item.fraudScore >= minScore;
      const matchesMaxScore =
        maxScore === null || item.fraudScore <= maxScore;

      return (
        matchesSearch &&
        matchesRiskLevel &&
        matchesStatus &&
        matchesPatternType &&
        matchesMinScore &&
        matchesMaxScore
      );
    });
  }, [records, filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / PAGE_SIZE)
  );

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRecords, currentPage]);

  const resetFilters = (): void => {
    setFilters(defaultFilters);
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4 flex-wrap">
        <div>
          <p className="text-primary fw-bold text-uppercase mb-1 small">
            Phase 12P.4
          </p>
          <h2 className="fw-bold mb-1">Return Fraud Pattern Intelligence</h2>
          <p className="text-muted mb-0">
            Detect repeated return abuse, high refund exposure, seller-linked
            patterns, product return clusters, fast returns, QC failure signals,
            and suspicious refund behavior.
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={loadReturnFraudPatterns}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => downloadCsv(filteredRecords)}
            disabled={filteredRecords.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* Summary Cards Section */}
      <ReturnFraudSummaryCards summary={summary} />

      {/* Distribution Charts */}
      <ReturnFraudDistributionCharts summary={summary} records={records} />

      {/* Filter Toolbar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-3 align-items-end">
            <div className="col-xl-3 col-lg-4 col-md-6">
              <label className="form-label fw-semibold small">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Customer, seller, product, location..."
                value={filters.searchText}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    searchText: event.target.value,
                  }))
                }
              />
            </div>

            <div className="col-xl-2 col-lg-4 col-md-6">
              <label className="form-label fw-semibold small">Risk Level</label>
              <select
                className="form-select"
                value={filters.riskLevel}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    riskLevel: event.target.value as
                      | "ALL"
                      | ReturnFraudRiskLevel,
                  }))
                }
              >
                <option value="ALL">All Risk Levels</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="col-xl-2 col-lg-4 col-md-6">
              <label className="form-label fw-semibold small">Status</label>
              <select
                className="form-select"
                value={filters.investigationStatus}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    investigationStatus: event.target.value as
                      | "ALL"
                      | ReturnFraudInvestigationStatus,
                  }))
                }
              >
                <option value="ALL">All Status</option>
                <option value="AUTO_FLAGGED">Auto Flagged</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="ACTION_REQUIRED">Action Required</option>
                <option value="ESCALATED">Escalated</option>
                <option value="CLEARED">Cleared</option>
              </select>
            </div>

            <div className="col-xl-2 col-lg-4 col-md-6">
              <label className="form-label fw-semibold small">Pattern Type</label>
              <select
                className="form-select"
                value={filters.patternType}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    patternType: event.target.value as
                      | "ALL"
                      | ReturnFraudPatternType,
                  }))
                }
              >
                <option value="ALL">All Patterns</option>
                {Object.entries(returnFraudPatternTypeLabels).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="col-xl-1 col-lg-2 col-md-3 col-6">
              <label className="form-label fw-semibold small">Min Score</label>
              <input
                type="number"
                className="form-control"
                placeholder="0"
                min="0"
                max="100"
                value={filters.minFraudScore}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    minFraudScore: event.target.value,
                  }))
                }
              />
            </div>

            <div className="col-xl-1 col-lg-2 col-md-3 col-6">
              <label className="form-label fw-semibold small">Max Score</label>
              <input
                type="number"
                className="form-control"
                placeholder="100"
                min="0"
                max="100"
                value={filters.maxFraudScore}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    maxFraudScore: event.target.value,
                  }))
                }
              />
            </div>

            <div className="col-xl-1 col-lg-2 col-md-6">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={resetFilters}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Records Table */}
      <ReturnFraudIntelligenceTable
        records={paginatedRecords}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredRecords.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        onViewPattern={setSelectedPattern}
      />

      {/* Pattern Detail Modal */}
      {selectedPattern && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{ background: "rgba(15, 23, 42, 0.55)" }}
          onClick={() => setSelectedPattern(null)}
        >
          <div
            className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold">
                    {selectedPattern.customerName}
                  </h5>
                  <p className="text-muted mb-0 small">
                    {selectedPattern.customerEmail ||
                      selectedPattern.customerId}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedPattern(null)}
                />
              </div>

              <div className="modal-body py-4">
                <div className="row g-3 mb-4">
                  <div className="col-md-2 col-sm-6">
                    <div className="border rounded p-3 h-100 bg-light">
                      <small className="text-muted fw-semibold d-block mb-1">
                        Fraud Score
                      </small>
                      <h4 className="fw-bold mb-0 text-danger">
                        {selectedPattern.fraudScore}
                      </h4>
                    </div>
                  </div>

                  <div className="col-md-2 col-sm-6">
                    <div className="border rounded p-3 h-100 bg-light">
                      <small className="text-muted fw-semibold d-block mb-1">
                        Risk Level
                      </small>
                      <h4 className="fw-bold mb-0">
                        {selectedPattern.riskLevel}
                      </h4>
                    </div>
                  </div>

                  <div className="col-md-2 col-sm-6">
                    <div className="border rounded p-3 h-100 bg-light">
                      <small className="text-muted fw-semibold d-block mb-1">
                        Returns
                      </small>
                      <h4 className="fw-bold mb-0">
                        {selectedPattern.totalReturns}
                      </h4>
                    </div>
                  </div>

                  <div className="col-md-3 col-sm-6">
                    <div className="border rounded p-3 h-100 bg-light">
                      <small className="text-muted fw-semibold d-block mb-1">
                        Seller
                      </small>
                      <h6 className="fw-bold mb-0 text-truncate">
                        {selectedPattern.sellerName || "N/A"}
                      </h6>
                    </div>
                  </div>

                  <div className="col-md-3 col-sm-6">
                    <div className="border rounded p-3 h-100 bg-light">
                      <small className="text-muted fw-semibold d-block mb-1">
                        Location
                      </small>
                      <h6 className="fw-bold mb-0 text-truncate">
                        {selectedPattern.locationCluster || "N/A"}
                      </h6>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold mb-2">Score Breakdown</h6>
                <div className="row g-2 mb-4">
                  <div className="col-md-3 col-sm-6">
                    <span className="badge text-bg-light border w-100 py-2 fw-normal text-start px-3">
                      Return Frequency: <strong>{selectedPattern.returnFrequencyScore}</strong>
                    </span>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <span className="badge text-bg-light border w-100 py-2 fw-normal text-start px-3">
                      Refund Value: <strong>{selectedPattern.refundValueScore}</strong>
                    </span>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <span className="badge text-bg-light border w-100 py-2 fw-normal text-start px-3">
                      Reason Pattern: <strong>{selectedPattern.reasonPatternScore}</strong>
                    </span>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <span className="badge text-bg-light border w-100 py-2 fw-normal text-start px-3">
                      Seller Pattern: <strong>{selectedPattern.sellerPatternScore}</strong>
                    </span>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <span className="badge text-bg-light border w-100 py-2 fw-normal text-start px-3">
                      Product Pattern: <strong>{selectedPattern.productPatternScore}</strong>
                    </span>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <span className="badge text-bg-light border w-100 py-2 fw-normal text-start px-3">
                      Location Pattern: <strong>{selectedPattern.locationPatternScore}</strong>
                    </span>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <span className="badge text-bg-light border w-100 py-2 fw-normal text-start px-3">
                      QC Failure: <strong>{selectedPattern.qcFailureScore}</strong>
                    </span>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <span className="badge text-bg-light border w-100 py-2 fw-normal text-start px-3">
                      Fast Return: <strong>{selectedPattern.fastReturnScore}</strong>
                    </span>
                  </div>
                </div>

                <h6 className="fw-bold mb-2">Detected Pattern Types</h6>
                <div className="d-flex flex-wrap gap-2 mb-4">
                  {selectedPattern.patternTypes.map((type) => (
                    <span key={type} className="badge rounded-pill text-bg-primary">
                      {returnFraudPatternTypeLabels[type] || type}
                    </span>
                  ))}
                </div>

                <h6 className="fw-bold mb-2">Risk Reasons</h6>
                <ul className="text-secondary small mb-4">
                  {selectedPattern.riskReasons.map((reason, idx) => (
                    <li key={`${reason}-${idx}`}>{reason}</li>
                  ))}
                </ul>

                <h6 className="fw-bold mb-2">Recommended Actions</h6>
                <ul className="text-secondary small mb-0">
                  {selectedPattern.recommendedActions.map((action, idx) => (
                    <li key={`${action}-${idx}`}>{action}</li>
                  ))}
                </ul>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setSelectedPattern(null)}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    downloadCsv([selectedPattern], "return-fraud-pattern")
                  }
                >
                  Export Pattern CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReturnFraudPatternDashboardPage;