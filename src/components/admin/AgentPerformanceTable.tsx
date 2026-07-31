import { useEffect, useMemo, useState } from "react";
import Pagination from "../common/Pagination";
import type {
  AgentPerformanceRiskLevel,
  AgentPerformanceRow
} from "../../types/agentPerformance";

type AgentPerformanceTableProps = {
  rows: AgentPerformanceRow[];
  onExportCsv?: () => void;
};

const pageSizeOptions = [5, 10, 20, 50];

const formatLabel = (value?: string): string => {
  if (!value) {
    return "Not Available";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getRiskBadgeClass = (riskLevel: AgentPerformanceRiskLevel): string => {
  switch (riskLevel) {
    case "CRITICAL":
      return "text-bg-danger";
    case "POOR":
      return "text-bg-warning text-dark";
    case "AVERAGE":
      return "text-bg-info";
    case "GOOD":
      return "text-bg-primary";
    case "EXCELLENT":
      return "text-bg-success";
    default:
      return "text-bg-secondary";
  }
};

const getScoreProgressClass = (score: number): string => {
  if (score < 40) {
    return "bg-danger";
  }

  if (score < 60) {
    return "bg-warning";
  }

  if (score < 75) {
    return "bg-info";
  }

  return "bg-success";
};

const AgentPerformanceTable = ({
  rows,
  onExportCsv
}: AgentPerformanceTableProps) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length, pageSize]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
  }, [rows, currentPage, pageSize]);

  const startRecord = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, rows.length);

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
          <div>
            <h5 className="fw-bold mb-1">Agent Performance Details</h5>
            <p className="text-muted small mb-0">
              Agent-wise task completion, attempts, proof verification,
              turn-around times, and performance scores.
            </p>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {onExportCsv ? (
              <button
                type="button"
                className="btn btn-outline-success btn-sm"
                onClick={onExportCsv}
                disabled={rows.length === 0}
              >
                <i
                  className="bi bi-file-earmark-spreadsheet me-2"
                  aria-hidden="true"
                />
                Export CSV
              </button>
            ) : null}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="alert alert-light border mb-0">
            No agent performance records match the selected filters.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Tasks</th>
                    <th>Completed</th>
                    <th>Attempts / Failed</th>
                    <th>Avg Speed</th>
                    <th>Proofs</th>
                    <th>Rates</th>
                    <th>Score</th>
                    <th>Risk</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.agentId}>
                      <td>
                        <div className="fw-semibold">{row.agentName}</div>
                        <div className="small text-muted">{row.agentId}</div>
                        <div className="small text-muted">
                          {formatLabel(row.agentType)}
                          {row.agentPhone ? ` · ${row.agentPhone}` : ""}
                        </div>
                      </td>

                      <td>
                        <div>Total: {row.totalTasks}</div>
                        <div className="small text-muted">
                          Pickup: {row.pickupTasks} · Delivery:{" "}
                          {row.deliveryTasks}
                        </div>
                      </td>

                      <td>
                        <div>{row.completedTasks}</div>
                        <div className="small text-muted">
                          Pickups: {row.pickupCompleted} · Deliveries:{" "}
                          {row.deliveriesCompleted}
                        </div>
                      </td>

                      <td>
                        <div>Attempted: {row.attemptedTasks}</div>
                        <div className="small text-muted">
                          Failed: {row.failedTasks} · Cancelled:{" "}
                          {row.cancelledTasks}
                        </div>
                      </td>

                      <td>
                        <div>
                          {row.averageCompletionHours > 0
                            ? `${row.averageCompletionHours} hrs`
                            : "N/A"}
                        </div>
                        <div className="small text-muted">
                          In Progress: {row.inProgressTasks}
                        </div>
                      </td>

                      <td>
                        <div>Total: {row.totalProofs}</div>
                        <div className="small text-muted">
                          Verified: {row.verifiedProofs} · Pending:{" "}
                          {row.pendingProofs} · Rejected: {row.rejectedProofs}
                        </div>
                      </td>

                      <td>
                        <div>Completion: {row.completionRate}%</div>
                        <div className="small text-muted">
                          Proof Verified: {row.proofVerificationRate}% ·
                          Failure: {row.failureRate}%
                        </div>
                      </td>

                      <td style={{ minWidth: 120 }}>
                        <div className="fw-semibold">
                          {row.performanceScore}/100
                        </div>
                        <div className="progress mt-1" style={{ height: 6 }}>
                          <div
                            className={`progress-bar ${getScoreProgressClass(
                              row.performanceScore
                            )}`}
                            role="progressbar"
                            style={{ width: `${row.performanceScore}%` }}
                            aria-valuenow={row.performanceScore}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge align-self-start ${getRiskBadgeClass(
                            row.riskLevel
                          )}`}
                        >
                          {row.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={rows.length}
                pageSize={pageSize}
                itemsPerPage={pageSize}
                itemsPerPageOptions={pageSizeOptions}
                startItem={startRecord}
                endItem={endRecord}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(nextPageSize: number) => {
                  setPageSize(nextPageSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AgentPerformanceTable;