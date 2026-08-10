import { useMemo, useState } from "react";
import Pagination from "../common/Pagination";
import { unifiedOperationsAuditService } from "../../services/unifiedOperationsAuditService";
import type {
  UnifiedAuditComplianceStatus,
  UnifiedAuditSeverity,
  UnifiedOperationsAuditRecord
} from "../../types/unifiedOperationsAudit";

type UnifiedOperationsAuditTableProps = {
  records?: UnifiedOperationsAuditRecord[];
};

const pageSizeOptions = [5, 10, 20, 50];

const getSeverityBadgeClass = (severity: UnifiedAuditSeverity): string => {
  switch (severity) {
    case "CRITICAL":
      return "text-bg-danger";
    case "HIGH":
      return "text-bg-warning text-dark";
    case "MEDIUM":
      return "text-bg-info";
    case "LOW":
    default:
      return "text-bg-success";
  }
};

const getComplianceBadgeClass = (
  status: UnifiedAuditComplianceStatus
): string => {
  switch (status) {
    case "NON_COMPLIANT":
      return "text-bg-danger";
    case "REVIEW_REQUIRED":
      return "text-bg-warning text-dark";
    case "COMPLIANT":
    default:
      return "text-bg-success";
  }
};

// Formats ENUM strings like "SELLER_PAYOUT" to "Seller Payout"
const formatEnumLabel = (str?: string): string => {
  if (!str) return "";
  return str
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const UnifiedOperationsAuditTable = ({
  records = []
}: UnifiedOperationsAuditTableProps) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = Math.max(Math.ceil(records.length / pageSize), 1);

  // Clamp current page to ensure it never exceeds totalPages on dataset changes
  const safePage = Math.min(currentPage, totalPages);

  const paginatedRecords = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return records.slice(startIndex, startIndex + pageSize);
  }, [records, safePage, pageSize]);

  const startItem = records.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, records.length);

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-1">Unified Operations Audit Log</h5>
        <p className="small text-muted mb-3">
          Centralized audit trail across return, logistics, SLA, agent, support,
          seller payout, automation, and export operations.
        </p>

        {records.length === 0 ? (
          <div className="alert alert-light border mb-0">
            No audit records match the selected filters.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th scope="col">Audit</th>
                    <th scope="col">Source</th>
                    <th scope="col">Entity</th>
                    <th scope="col">Actor</th>
                    <th scope="col">Summary</th>
                    <th scope="col">Severity</th>
                    <th scope="col">Compliance</th>
                    <th scope="col">Created</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRecords.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <div className="fw-semibold">{record.auditId}</div>
                        <div className="small text-muted">{record.id}</div>
                      </td>

                      <td>
                        <div>{formatEnumLabel(record.source)}</div>
                        <div className="small text-muted">
                          {formatEnumLabel(record.action)}
                        </div>
                      </td>

                      <td>
                        <div>{record.entityType}</div>
                        <div className="small text-muted">{record.entityId}</div>

                        {record.returnRequestId ? (
                          <div className="small text-muted">
                            Return: {record.returnRequestId}
                          </div>
                        ) : null}

                        {record.orderId ? (
                          <div className="small text-muted">
                            Order: {record.orderId}
                          </div>
                        ) : null}
                      </td>

                      <td>
                        <div>{record.actorName}</div>
                        <div className="small text-muted">
                          {record.actorRole}
                        </div>
                      </td>

                      <td style={{ minWidth: 280 }}>
                        <div>{record.summary}</div>
                        {record.details ? (
                          <div className="small text-muted mt-1">
                            {record.details}
                          </div>
                        ) : null}
                      </td>

                      <td>
                        <span
                          className={`badge ${getSeverityBadgeClass(
                            record.severity
                          )}`}
                        >
                          {formatEnumLabel(record.severity)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${getComplianceBadgeClass(
                            record.complianceStatus
                          )}`}
                        >
                          {formatEnumLabel(record.complianceStatus)}
                        </span>
                      </td>

                      <td className="small text-muted">
                        {unifiedOperationsAuditService.formatDateTime(
                          record.createdAt
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3">
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={records.length}
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

export default UnifiedOperationsAuditTable;