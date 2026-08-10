import { useEffect, useMemo, useState } from "react";
import Pagination from "../common/Pagination";
import type {
  ReturnLogisticsAutomationRule,
  ReturnLogisticsAutomationRulePriority,
  ReturnLogisticsAutomationRuleStatus
} from "../../types/returnLogisticsAutomationRule";

type ReturnLogisticsAutomationRulesTableProps = {
  rules: ReturnLogisticsAutomationRule[];
  onToggleStatus: (rule: ReturnLogisticsAutomationRule) => void;
  onCloneRule: (rule: ReturnLogisticsAutomationRule) => void;
  onDeleteRule: (rule: ReturnLogisticsAutomationRule) => void;
};

const pageSizeOptions = [5, 10, 20, 50];

const getStatusBadgeClass = (
  status: ReturnLogisticsAutomationRuleStatus
): string => {
  return status === "ACTIVE" ? "text-bg-success" : "text-bg-secondary";
};

const getPriorityBadgeClass = (
  priority: ReturnLogisticsAutomationRulePriority
): string => {
  switch (priority) {
    case "CRITICAL":
      return "text-bg-danger";
    case "HIGH":
      return "text-bg-warning text-dark";
    case "MEDIUM":
      return "text-bg-info";
    default:
      return "text-bg-secondary";
  }
};

const formatLabel = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatOperator = (operator: string): string => {
  const map: Record<string, string> = {
    EQUALS: "=",
    NOT_EQUALS: "≠",
    CONTAINS: "contains",
    GREATER_THAN: ">",
    LESS_THAN: "<",
    IN: "in"
  };
  return map[operator] || operator.toLowerCase();
};

const ReturnLogisticsAutomationRulesTable = ({
  rules,
  onToggleStatus,
  onCloneRule,
  onDeleteRule
}: ReturnLogisticsAutomationRulesTableProps) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modal State
  const [ruleToDelete, setRuleToDelete] =
    useState<ReturnLogisticsAutomationRule | null>(null);

  const totalPages = Math.max(Math.ceil(rules.length / pageSize), 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [rules.length, pageSize]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return rules.slice(startIndex, startIndex + pageSize);
  }, [rules, currentPage, pageSize]);

  const startItem = rules.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, rules.length);

  const handleConfirmDelete = () => {
    if (ruleToDelete) {
      onDeleteRule(ruleToDelete);
      setRuleToDelete(null);
    }
  };

  return (
    <>
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-1">
            Return + Logistics Automation Rules
          </h5>
          <p className="small text-muted mb-3">
            Manage automation rules for pickup reassignment, QC escalation, refund
            delays, SLA breaches, support escalation, and logistics queue routing.
          </p>

          {rules.length === 0 ? (
            <div className="alert alert-light border mb-0" role="status">
              No automation rules match the selected filters.
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Rule</th>
                      <th>Trigger</th>
                      <th>Action</th>
                      <th>Conditions</th>
                      <th>Target Team</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Executions</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedRows.map((rule) => {
                      const extraConditions = rule.conditions.length - 3;

                      return (
                        <tr key={rule.id}>
                          <td>
                            <div className="fw-semibold text-dark">{rule.ruleName}</div>
                            <div className="small text-muted font-monospace">{rule.ruleId}</div>
                            <div
                              className="small text-muted text-truncate"
                              style={{ maxWidth: 200 }}
                            >
                              {rule.description || "No description"}
                            </div>
                          </td>

                          <td>
                            <span className="badge text-bg-light border text-dark">
                              {formatLabel(rule.trigger)}
                            </span>
                          </td>

                          <td>
                            <span className="badge text-bg-light border text-dark">
                              {formatLabel(rule.action)}
                            </span>
                          </td>

                          <td style={{ minWidth: 220 }}>
                            {rule.conditions.length === 0 ? (
                              <span className="small text-muted">No conditions</span>
                            ) : (
                              <div>
                                <ul className="small mb-0 ps-3">
                                  {rule.conditions.slice(0, 3).map((condition) => (
                                    <li key={condition.id}>
                                      <span className="fw-medium">{condition.field}</span>{" "}
                                      <span className="text-muted">
                                        {formatOperator(condition.operator)}
                                      </span>{" "}
                                      <span className="text-primary-emphasis">
                                        {Array.isArray(condition.value)
                                          ? condition.value.join(", ")
                                          : String(condition.value)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                                {extraConditions > 0 && (
                                  <span className="small text-muted ps-3 d-block mt-1">
                                    +{extraConditions} more condition
                                    {extraConditions > 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          <td>
                            <span className="small fw-medium text-secondary">
                              {formatLabel(rule.targetTeam)}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`badge ${getPriorityBadgeClass(
                                rule.priority
                              )}`}
                            >
                              {rule.priority}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`badge ${getStatusBadgeClass(
                                rule.status
                              )}`}
                            >
                              {rule.status}
                            </span>
                          </td>

                          <td>
                            <div className="fw-semibold">
                              {rule.executionCount.toLocaleString()}
                            </div>
                            <div className="small text-muted">
                              <span className="text-success">S: {rule.successCount}</span>{" "}
                              ·{" "}
                              <span className="text-danger">F: {rule.failureCount}</span>
                            </div>
                          </td>

                          <td className="text-end">
                            <div className="d-flex flex-wrap justify-content-end gap-1">
                              <button
                                type="button"
                                className={`btn btn-sm ${
                                  rule.status === "ACTIVE"
                                    ? "btn-outline-warning"
                                    : "btn-outline-success"
                                }`}
                                onClick={() => onToggleStatus(rule)}
                                aria-label={`${
                                  rule.status === "ACTIVE"
                                    ? "Deactivate"
                                    : "Activate"
                                } ${rule.ruleName}`}
                              >
                                {rule.status === "ACTIVE"
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => onCloneRule(rule)}
                                aria-label={`Clone ${rule.ruleName}`}
                              >
                                Clone
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => setRuleToDelete(rule)}
                                aria-label={`Delete ${rule.ruleName}`}
                              >
                                Delete
                              </button>
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
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={rules.length}
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

      {/* Delete Confirmation Modal */}
      {ruleToDelete && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            aria-labelledby="deleteModalTitle"
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold text-danger" id="deleteModalTitle">
                    Delete Automation Rule
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setRuleToDelete(null)}
                  />
                </div>

                <div className="modal-body py-3">
                  <p className="mb-2">
                    Are you sure you want to delete the rule{" "}
                    <strong className="text-dark">{ruleToDelete.ruleName}</strong>?
                  </p>
                  <div className="p-3 bg-light border rounded-3 small">
                    <div>
                      <strong>Rule ID:</strong>{" "}
                      <span className="font-monospace">{ruleToDelete.ruleId}</span>
                    </div>
                    <div>
                      <strong>Target Team:</strong> {formatLabel(ruleToDelete.targetTeam)}
                    </div>
                    <div>
                      <strong>Executions:</strong>{" "}
                      {ruleToDelete.executionCount.toLocaleString()} total
                    </div>
                  </div>
                  <p className="small text-muted mt-2 mb-0">
                    This action cannot be undone and will stop all automated routing for this rule.
                  </p>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light rounded-3"
                    onClick={() => setRuleToDelete(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger rounded-3"
                    onClick={handleConfirmDelete}
                  >
                    Delete Rule
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Backdrop overlay */}
          <div className="modal-backdrop fade show" onClick={() => setRuleToDelete(null)} />
        </>
      )}
    </>
  );
};

export default ReturnLogisticsAutomationRulesTable;