import { useEffect, useMemo, useState } from "react";
import Pagination from "../common/Pagination";
import { returnOperationsAuditService } from "../../services/returnOperationsAuditService";
import type {
  ReturnAuditComplianceStatus,
  ReturnAuditSeverity,
  ReturnOperationsAuditRecord
} from "../../types/returnOperationsAudit";

type ReturnOperationsAuditTableProps = {
  records: ReturnOperationsAuditRecord[];
};

const pageSizeOptions = [5, 10, 20, 50];

const getSeverityBadgeClass = (severity: ReturnAuditSeverity): string => {
  if (severity === "CRITICAL") {
    return "text-bg-danger";
  }

  if (severity === "HIGH") {
    return "text-bg-warning text-dark";
  }

  if (severity === "MEDIUM") {
    return "text-bg-info";
  }

  return "text-bg-success";
};

const getComplianceBadgeClass = (
  status: ReturnAuditComplianceStatus
): string => {
  if (status === "NON_COMPLIANT") {
    return "text-bg-danger";
  }

  if (status === "REVIEW_REQUIRED") {
    return "text-bg-warning text-dark";
  }

  return "text-bg-success";
};

const ReturnOperationsAuditTable = ({
  records
}: ReturnOperationsAuditTableProps) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = Math.max(Math.ceil(records.length / pageSize), 1);
  
  // Guard against out-of-bounds page numbers when filter/records change rapidly
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [records.length, pageSize]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return records.slice(startIndex, startIndex + pageSize);
  }, [records, safePage, pageSize]);

  const startItem = records.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, records.length);

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-1">Return Operations Audit Log</h5>
        <p className="small text-muted mb-3">
          Centralized audit trail across returns, refunds, proof verification,
          seller disputes, damaged inventory, and automation rule changes.
        </p>

        {records.length === 0 ? (
          <div className="alert alert-light border mb-0 text-center py-4">
            <i className="bi bi-inbox fs-3 d-block text-muted mb-2" />
            <span className="text-muted">No audit records match the selected filters.</span>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Audit</th>
                    <th scope="col">Source</th>
                    <th scope="col">Entity</th>
                    <th scope="col">Actor</th>
                    <th scope="col">Summary & Details</th>
                    <th scope="col">Severity</th>
                    <th scope="col">Compliance</th>
                    <th scope="col">Created</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRecords.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <div className="fw-semibold text-nowrap">{record.auditId}</div>
                        <div className="small text-muted extra-small">{record.id}</div>
                      </td>

                      <td>
                        <div className="fw-medium text-nowrap">{record.source.replace(/_/g, " ")}</div>
                        <div className="small text-muted text-nowrap">
                          {record.action.replace(/_/g, " ")}
                        </div>
                      </td>

                      <td>
                        <div className="fw-medium">{record.entityType}</div>
                        <div className="small text-muted">{record.entityId}</div>
                        {record.returnRequestId && (
                          <div className="small text-muted">
                            Return: {record.returnRequestId}
                          </div>
                        )}
                        {record.orderId && (
                          <div className="small text-muted">
                            Order: {record.orderId}
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="fw-medium text-nowrap">{record.actorName}</div>
                        <div className="small text-muted text-nowrap">{record.actorRole}</div>
                      </td>

                      <td style={{ minWidth: 280, maxWidth: 400 }}>
                        <div className="fw-medium">{record.summary}</div>
                        <div className="small text-muted mt-1 text-break">
                          {record.details}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge ${getSeverityBadgeClass(
                            record.severity
                          )}`}
                        >
                          {record.severity}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${getComplianceBadgeClass(
                            record.complianceStatus
                          )}`}
                        >
                          {record.complianceStatus.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="small text-muted text-nowrap">
                        {returnOperationsAuditService.formatDateTime(
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

export default ReturnOperationsAuditTable;