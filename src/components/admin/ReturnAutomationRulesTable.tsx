import React from "react";
import {
  ReturnAutomationRule,
  returnAutomationActionLabels,
  returnAutomationPriorityLabels,
  returnAutomationTriggerLabels
} from "../../types/returnAutomationRules";

interface ReturnAutomationRulesTableProps {
  records: ReturnAutomationRule[];
  loading: boolean;
  onEditRule: (rule: ReturnAutomationRule) => void;
  onToggleStatus: (rule: ReturnAutomationRule) => void;
  onDeleteRule: (rule: ReturnAutomationRule) => void;
}

const formatDateTime = (value?: string): string => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getPriorityBadgeClass = (priority: ReturnAutomationRule["priority"]): string => {
  switch (priority) {
    case "CRITICAL":
      return "badge text-bg-danger";
    case "HIGH":
      return "badge text-bg-warning";
    case "MEDIUM":
      return "badge text-bg-info text-dark";
    case "LOW":
    default:
      return "badge text-bg-success";
  }
};

const ReturnAutomationRulesTable: React.FC<ReturnAutomationRulesTableProps> = ({
  records,
  loading,
  onEditRule,
  onToggleStatus,
  onDeleteRule
}) => {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-bottom py-3">
        <h5 className="fw-bold mb-1">Automation Rules</h5>
        <p className="text-muted mb-0 small">
          Showing {records.length.toLocaleString()} configured return automation rules
        </p>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light text-secondary text-uppercase small">
            <tr>
              <th scope="col" style={{ minWidth: "200px" }}>Rule</th>
              <th scope="col">Trigger</th>
              <th scope="col">Priority</th>
              <th scope="col">Status</th>
              <th scope="col">Conditions</th>
              <th scope="col">Actions</th>
              <th scope="col">Executions</th>
              <th scope="col">Last Run</th>
              <th scope="col" className="text-end" style={{ minWidth: "180px" }}>Manage</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center text-muted py-5">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                  Loading return automation rules...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-muted py-5">
                  <p className="mb-0 fw-semibold">No automation rules found.</p>
                  <small className="text-muted">Create a rule to get started with return automation.</small>
                </td>
              </tr>
            ) : (
              records.map((rule) => {
                const triggerLabel =
                  returnAutomationTriggerLabels[rule.triggerType] ?? rule.triggerType;
                const priorityLabel =
                  returnAutomationPriorityLabels[rule.priority] ?? rule.priority;

                return (
                  <tr key={rule.id}>
                    {/* Rule & Description */}
                    <td>
                      <div className="fw-semibold text-dark">{rule.ruleName}</div>
                      {rule.description && (
                        <small className="text-muted text-truncate d-block" style={{ maxWidth: "250px" }}>
                          {rule.description}
                        </small>
                      )}
                    </td>

                    {/* Trigger */}
                    <td>
                      <span className="small fw-medium text-secondary">{triggerLabel}</span>
                    </td>

                    {/* Priority */}
                    <td>
                      <span className={getPriorityBadgeClass(rule.priority)}>
                        {priorityLabel}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        className={
                          rule.status === "ACTIVE"
                            ? "badge text-bg-success"
                            : "badge text-bg-secondary"
                        }
                      >
                        {rule.status}
                      </span>
                    </td>

                    {/* Conditions */}
                    <td>
                      <span className="badge rounded-pill text-bg-light border text-dark fw-normal">
                        {rule.conditions.length} condition
                        {rule.conditions.length === 1 ? "" : "s"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="d-flex flex-column gap-1">
                        {rule.actions.slice(0, 2).map((action, idx) => {
                          const actionLabel =
                            returnAutomationActionLabels[action.actionType] ??
                            action.actionType;

                          return (
                            <span
                              key={action.id ?? `${rule.id}-action-${idx}`}
                              className="badge rounded-pill text-bg-light border text-start text-dark fw-normal text-truncate"
                              style={{ maxWidth: "160px" }}
                            >
                              {actionLabel}
                            </span>
                          );
                        })}

                        {rule.actions.length > 2 && (
                          <small className="text-muted">
                            +{rule.actions.length - 2} more
                          </small>
                        )}
                      </div>
                    </td>

                    {/* Executions */}
                    <td>
                      <div className="fw-semibold text-dark">
                        {rule.executionCount.toLocaleString()}
                      </div>
                      <small className="text-muted d-block">
                        <span className="text-success">{rule.successCount}</span> /{" "}
                        <span className="text-danger">{rule.failureCount}</span>
                      </small>
                    </td>

                    {/* Last Run */}
                    <td className="small text-secondary">
                      {formatDateTime(rule.lastExecutedAt)}
                    </td>

                    {/* Manage Buttons */}
                    <td>
                      <div className="d-flex gap-2 justify-content-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => onEditRule(rule)}
                          title="Edit Rule"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className={
                            rule.status === "ACTIVE"
                              ? "btn btn-sm btn-outline-warning"
                              : "btn btn-sm btn-outline-success"
                          }
                          onClick={() => onToggleStatus(rule)}
                          title={rule.status === "ACTIVE" ? "Disable Rule" : "Enable Rule"}
                        >
                          {rule.status === "ACTIVE" ? "Disable" : "Enable"}
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onDeleteRule(rule)}
                          title="Delete Rule"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReturnAutomationRulesTable;