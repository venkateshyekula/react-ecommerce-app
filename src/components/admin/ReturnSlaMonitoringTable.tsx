import { useEffect, useMemo, useState } from "react";
import Pagination from "../common/Pagination";
import { returnSlaMonitoringService } from "../../services/returnSlaMonitoringService";
import type {
  ReturnSlaEscalationAction,
  ReturnSlaMonitoringRow,
  ReturnSlaRiskLevel,
  ReturnSlaStatus
} from "../../types/returnSlaMonitoring";

type ReturnSlaMonitoringTableProps = {
  rows: ReturnSlaMonitoringRow[];
  onEscalate: (
    row: ReturnSlaMonitoringRow,
    action: ReturnSlaEscalationAction
  ) => void;
};

const pageSizeOptions = [5, 10, 20, 50];

const getRiskBadgeClass = (riskLevel: ReturnSlaRiskLevel): string => {
  switch (riskLevel) {
    case "CRITICAL":
      return "text-bg-danger";
    case "HIGH":
      return "text-bg-warning text-dark";
    case "MEDIUM":
      return "text-bg-info text-dark";
    case "LOW":
    default:
      return "text-bg-success";
  }
};

const getStatusBadgeClass = (status: ReturnSlaStatus): string => {
  switch (status) {
    case "BREACHED":
    case "ESCALATED":
      return "text-bg-danger";
    case "WARNING":
      return "text-bg-warning text-dark";
    case "COMPLETED":
      return "text-bg-secondary";
    case "WITHIN_SLA":
    default:
      return "text-bg-success";
  }
};

const ReturnSlaMonitoringTable = ({
  rows,
  onEscalate
}: ReturnSlaMonitoringTableProps) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);

  // Clamp current page if rows change and current page is out of range
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [rows.length, pageSize, totalPages, currentPage]);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
  }, [rows, safeCurrentPage, pageSize]);

  const startItem = rows.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, rows.length);

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-1">Return SLA Monitoring</h5>
        <p className="small text-muted mb-3">
          Monitor SLA deadlines, breach risk, escalation status, and operational
          ownership across return stages.
        </p>

        {rows.length === 0 ? (
          <div className="alert alert-light border mb-0">
            No SLA records match the selected filters.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Return</th>
                    <th>Stage</th>
                    <th>SLA Timing</th>
                    <th>Status</th>
                    <th>Owner / Escalation</th>
                    <th>Reasons</th>
                    <th>Risk</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRows.map((row) => {
                    const isCompleted = row.status === "COMPLETED";

                    return (
                      <tr key={row.id}>
                        <td>
                          <div className="fw-semibold">
                            {row.returnRequestId}
                          </div>
                          <div className="small text-muted">
                            Order: {row.orderId ?? "N/A"}
                          </div>
                          <div className="small text-muted">
                            Customer:{" "}
                            {row.customerName ?? row.customerId ?? "N/A"}
                          </div>
                        </td>

                        <td>
                          <div className="fw-semibold">{row.stageLabel}</div>
                          <div className="small text-muted">
                            {row.stage.replace(/_/g, " ")}
                          </div>
                        </td>

                        <td>
                          <div>
                            Elapsed: <strong>{row.elapsedHours}</strong> hrs
                          </div>
                          <div className="small text-muted">
                            Allowed: {row.allowedHours} hrs
                          </div>
                          <div className="small text-muted">
                            Remaining: {row.remainingHours} hrs
                          </div>
                          {row.breachedHours > 0 ? (
                            <div className="small text-danger fw-semibold">
                              Breached by {row.breachedHours} hrs
                            </div>
                          ) : null}
                        </td>

                        <td>
                          <span
                            className={`badge ${getStatusBadgeClass(row.status)}`}
                          >
                            {row.status.replace(/_/g, " ")}
                          </span>
                          <div className="small text-muted mt-1">
                            Due:{" "}
                            {returnSlaMonitoringService.formatDateTime(row.dueAt)}
                          </div>
                        </td>

                        <td>
                          <div className="fw-medium">
                            {row.assignedTeam ?? "Not Assigned"}
                          </div>
                          <div className="small text-muted">
                            Escalation: {row.escalationStatus ?? "None"}
                          </div>
                          {row.escalationId ? (
                            <div className="small text-muted font-monospace">
                              {row.escalationId}
                            </div>
                          ) : null}
                        </td>

                        <td style={{ minWidth: 260 }}>
                          <ul className="small mb-0 ps-3">
                            {row.slaReasons.slice(0, 3).map((reason, idx) => (
                              <li key={`${row.id}-reason-${idx}`}>{reason}</li>
                            ))}
                          </ul>
                          <div className="small text-muted mt-1">
                            Last activity:{" "}
                            {returnSlaMonitoringService.formatDateTime(
                              row.lastActivityAt
                            )}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`badge ${getRiskBadgeClass(row.riskLevel)}`}
                          >
                            {row.riskLevel}
                          </span>
                        </td>

                        <td className="text-end" style={{ minWidth: 220 }}>
                          <div className="d-flex flex-wrap justify-content-end gap-2">
                            {row.stage === "PICKUP" && !isCompleted ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-warning"
                                onClick={() =>
                                  onEscalate(row, "ESCALATE_TO_PICKUP_MANAGER")
                                }
                              >
                                Pickup
                              </button>
                            ) : null}

                            {row.stage === "QC" && !isCompleted ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-warning"
                                onClick={() =>
                                  onEscalate(row, "ESCALATE_TO_QC_MANAGER")
                                }
                              >
                                QC
                              </button>
                            ) : null}

                            {row.stage === "REFUND" && !isCompleted ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  onEscalate(row, "ESCALATE_TO_REFUND_TEAM")
                                }
                              >
                                Refund
                              </button>
                            ) : null}

                            {!isCompleted ? (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() =>
                                    onEscalate(row, "ESCALATE_TO_ADMIN")
                                  }
                                >
                                  Admin
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() =>
                                    onEscalate(row, "MARK_RESOLVED")
                                  }
                                >
                                  Resolve
                                </button>
                              </>
                            ) : (
                              <span className="text-muted small">
                                No Actions Needed
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3">
              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalItems={rows.length}
                pageSize={pageSize}
                itemsPerPage={pageSize}
                itemsPerPageOptions={pageSizeOptions}
                startItem={startItem}
                endItem={endItem}
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

export default ReturnSlaMonitoringTable;