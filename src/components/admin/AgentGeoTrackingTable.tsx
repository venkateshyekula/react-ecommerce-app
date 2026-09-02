import { useEffect, useMemo, useState } from "react";
import Pagination from "../common/Pagination";
import { agentGeoTrackingService } from "../../services/agentGeoTrackingService";
import type {
  AgentGeoRiskLevel,
  AgentGeoTrackingRow,
  AgentGeoTrackingStatus
} from "../../types/agentGeoTracking";

type AgentGeoTrackingTableProps = {
  rows: AgentGeoTrackingRow[];
};

const pageSizeOptions = [5, 10, 20, 50];

const getRiskBadgeClass = (riskLevel: AgentGeoRiskLevel): string => {
  if (riskLevel === "CRITICAL") {
    return "text-bg-danger";
  }

  if (riskLevel === "HIGH") {
    return "text-bg-warning text-dark";
  }

  if (riskLevel === "MEDIUM") {
    return "text-bg-info";
  }

  return "text-bg-success";
};

const getTrackingBadgeClass = (status: AgentGeoTrackingStatus): string => {
  if (status === "LIVE") {
    return "text-bg-success";
  }

  if (status === "STALE") {
    return "text-bg-warning text-dark";
  }

  if (status === "NO_LOCATION" || status === "FAILED") {
    return "text-bg-danger";
  }

  return "text-bg-secondary";
};

const formatLabel = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const AgentGeoTrackingTable = ({ rows }: AgentGeoTrackingTableProps) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows, pageSize]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
  }, [rows, currentPage, pageSize]);

  const startItem = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, rows.length);

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-1">
          Agent Geo Tracking + Live Task Monitoring
        </h5>
        <p className="small text-muted mb-3">
          Monitor live agent location, task progress, stale GPS updates, SLA
          risk, and customer distance.
        </p>

        {rows.length === 0 ? (
          <div className="alert alert-light border mb-0">
            No tracking rows match the selected filters.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Agent</th>
                    <th>Customer / Address</th>
                    <th>Tracking</th>
                    <th>SLA</th>
                    <th>Flags</th>
                    <th>Risk</th>
                    <th className="text-end">Map</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="fw-semibold">{row.taskId || "N/A"}</div>
                        <div className="small text-muted">
                          {formatLabel(row.taskType)}
                        </div>
                        <div className="small text-muted">
                          Status: {formatLabel(row.taskStatus)}
                        </div>
                        <div className="small text-muted">
                          Return: {row.returnRequestId ?? "N/A"}
                        </div>
                        <div className="small text-muted">
                          Order: {row.orderId ?? "N/A"}
                        </div>
                      </td>

                      <td>
                        <div>{row.agentName}</div>
                        <div className="small text-muted">{row.agentId}</div>
                        <div className="small text-muted">
                          {row.agentPhone ?? "Phone N/A"}
                        </div>
                      </td>

                      <td style={{ minWidth: 240 }}>
                        <div>{row.customerName ?? "Customer N/A"}</div>
                        <div className="small text-muted">
                          {row.customerPhone ?? "Phone N/A"}
                        </div>
                        <div className="small text-muted">
                          {[row.addressLine, row.city, row.state, row.pincode]
                            .filter(Boolean)
                            .join(", ") || "Address N/A"}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge ${getTrackingBadgeClass(
                            row.trackingStatus
                          )}`}
                        >
                          {formatLabel(row.trackingStatus)}
                        </span>

                        <div className="small text-muted mt-1">
                          Age: {row.lastLocationAgeMinutes} min
                        </div>

                        <div className="small text-muted">
                          Distance:{" "}
                          {row.distanceKm !== undefined
                            ? `${row.distanceKm} km`
                            : "N/A"}
                        </div>

                        <div className="small text-muted">
                          Last GPS:{" "}
                          {agentGeoTrackingService.formatDateTime(
                            row.agentLocation.capturedAt
                          )}
                        </div>
                      </td>

                      <td>
                        <div>Elapsed: {row.elapsedHours} hrs</div>
                        {row.breachedHours > 0 ? (
                          <div className="small text-danger">
                            Breached: {row.breachedHours} hrs
                          </div>
                        ) : (
                          <div className="small text-muted">Within SLA</div>
                        )}
                      </td>

                      <td style={{ minWidth: 250 }}>
                        <ul className="small mb-0 ps-3">
                          {row.issueFlags.slice(0, 3).map((flag, index) => (
                            <li key={`${row.id}-flag-${index}`}>{flag}</li>
                          ))}
                        </ul>
                      </td>

                      <td>
                        <span
                          className={`badge ${getRiskBadgeClass(row.riskLevel)}`}
                        >
                          {row.riskLevel}
                        </span>
                      </td>

                      <td className="text-end">
                        <div className="d-flex flex-column gap-1 align-items-end">
                          <a
                            href={agentGeoTrackingService.buildMapUrl(
                              row.agentLocation
                            )}
                            className="btn btn-sm btn-outline-primary w-100"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Agent
                          </a>

                          <a
                            href={agentGeoTrackingService.buildMapUrl(
                              row.customerLocation
                            )}
                            className="btn btn-sm btn-outline-secondary w-100"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Customer
                          </a>
                        </div>
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

export default AgentGeoTrackingTable;