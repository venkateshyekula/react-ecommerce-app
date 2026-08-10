import { useEffect, useMemo, useState } from "react";
import Pagination from "../common/Pagination";
import { agentEscalationReassignmentService } from "../../services/agentEscalationReassignmentService";
import type {
  AgentEscalationAction,
  AgentEscalationRiskLevel,
  AgentEscalationStatus,
  AgentEscalationWorkflowRow,
  AgentProfileLite
} from "../../types/agentEscalationReassignment";

type AgentEscalationTableProps = {
  rows: AgentEscalationWorkflowRow[];
  agents: AgentProfileLite[];
  onAction: (
    row: AgentEscalationWorkflowRow,
    action: AgentEscalationAction,
    newAgentId?: string
  ) => void;
};

const pageSizeOptions = [5, 10, 20, 50];

const getRiskBadgeClass = (risk: AgentEscalationRiskLevel): string => {
  switch (risk) {
    case "CRITICAL":
      return "text-bg-danger";
    case "HIGH":
      return "text-bg-warning text-dark";
    case "MEDIUM":
      return "text-bg-info text-dark";
    case "LOW":
      return "text-bg-success";
    default:
      return "text-bg-secondary";
  }
};

const getStatusBadgeClass = (status: AgentEscalationStatus): string => {
  switch (status) {
    case "OPEN":
      return "text-bg-warning text-dark";
    case "ESCALATED":
      return "text-bg-danger";
    case "REASSIGNED":
      return "text-bg-primary";
    case "RESOLVED":
      return "text-bg-success";
    case "CANCELLED":
      return "text-bg-secondary";
    default:
      return "text-bg-info text-dark";
  }
};

const AgentEscalationTable = ({
  rows,
  agents,
  onAction
}: AgentEscalationTableProps) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedAgentByRow, setSelectedAgentByRow] = useState<
    Record<string, string>
  >({});

  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length, pageSize]);

  // Memoize available agents to avoid re-filtering on every state update
  const availableAgents = useMemo(() => {
    return agents.filter((agent) => agent.availabilityStatus === "AVAILABLE");
  }, [agents]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
  }, [rows, currentPage, pageSize]);

  const startItem = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, rows.length);

  const handleActionClick = (
    row: AgentEscalationWorkflowRow,
    action: AgentEscalationAction,
    newAgentId?: string
  ) => {
    onAction(row, action, newAgentId);
    
    // Clear selected agent state for this row after reassigning
    if (action === "REASSIGN_AGENT") {
      setSelectedAgentByRow((prev) => {
        const updated = { ...prev };
        delete updated[row.id];
        return updated;
      });
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-1">
          Advanced Agent Escalation + Reassignment Queue
        </h5>
        <p className="small text-muted mb-3">
          Escalate delayed tasks, reassign unavailable agents, and resolve
          high-risk agent operation issues.
        </p>

        {rows.length === 0 ? (
          <div className="alert alert-light border mb-0">
            No agent escalation rows match the selected filters.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th scope="col">Issue</th>
                    <th scope="col">Current Agent</th>
                    <th scope="col">Suggested Agent</th>
                    <th scope="col">Attempts / SLA</th>
                    <th scope="col">Reasons</th>
                    <th scope="col">Status</th>
                    <th scope="col">Risk</th>
                    <th scope="col" className="text-end">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRows.map((row) => {
                    const targetAgentId =
                      selectedAgentByRow[row.id] || row.suggestedAgentId;

                    return (
                      <tr key={row.id}>
                        <td>
                          <div className="fw-semibold">{row.issueTitle}</div>
                          <div className="small text-muted">{row.issueDetails}</div>
                          <div className="small text-muted">
                            Return: {row.returnRequestId ?? "N/A"}
                          </div>
                          <div className="small text-muted">
                            Order: {row.orderId ?? "N/A"}
                          </div>
                        </td>

                        <td>
                          <div className="fw-medium">
                            {row.currentAgentName ?? "Unassigned"}
                          </div>
                          <div className="small text-muted">
                            {row.currentAgentId ?? "N/A"}
                          </div>
                        </td>

                        <td>
                          <div>{row.suggestedAgentName ?? "No suggestion"}</div>
                          <div className="small text-muted">
                            {row.suggestedAgentId ?? "N/A"}
                          </div>

                          <select
                            className="form-select form-select-sm mt-2"
                            value={selectedAgentByRow[row.id] ?? ""}
                            aria-label={`Select new agent for ${row.issueTitle}`}
                            onChange={(event) =>
                              setSelectedAgentByRow((previous) => ({
                                ...previous,
                                [row.id]: event.target.value
                              }))
                            }
                          >
                            <option value="">Select agent</option>
                            {availableAgents.map((agent) => (
                              <option value={agent.agentId} key={agent.agentId}>
                                {agent.agentName} · {agent.activeTaskCount} active
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <div>Attempts: {row.attemptCount}</div>
                          <div className="small text-muted">
                            Failed: {row.failedAttemptCount}
                          </div>
                          <div className="small text-muted">
                            Elapsed: {row.elapsedHours} hrs
                          </div>
                          {row.breachedHours > 0 ? (
                            <div className="small text-danger fw-semibold">
                              Breached: {row.breachedHours} hrs
                            </div>
                          ) : null}
                        </td>

                        <td style={{ minWidth: 260 }}>
                          <ul className="small mb-0 ps-3">
                            {row.reassignmentReasons.slice(0, 3).map((reason, idx) => (
                              <li key={`${row.id}-reason-${idx}`}>{reason}</li>
                            ))}
                          </ul>
                          <div className="small text-muted mt-1">
                            Updated:{" "}
                            {agentEscalationReassignmentService.formatDateTime(
                              row.updatedAt
                            )}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`badge ${getStatusBadgeClass(row.status)}`}
                          >
                            {row.status.replace(/_/g, " ")}
                          </span>
                          {row.escalationId ? (
                            <div className="small text-muted mt-1">
                              {row.escalationId}
                            </div>
                          ) : null}
                        </td>

                        <td>
                          <span
                            className={`badge ${getRiskBadgeClass(row.riskLevel)}`}
                          >
                            {row.riskLevel}
                          </span>
                        </td>

                        <td className="text-end" style={{ minWidth: 240 }}>
                          <div className="d-flex flex-wrap justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                handleActionClick(row, "ESCALATE_TO_MANAGER")
                              }
                            >
                              Escalate
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                handleActionClick(
                                  row,
                                  "REASSIGN_AGENT",
                                  targetAgentId
                                )
                              }
                              disabled={!targetAgentId}
                            >
                              Reassign
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-info"
                              onClick={() =>
                                handleActionClick(row, "MARK_IN_PROGRESS")
                              }
                            >
                              Progress
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              onClick={() =>
                                handleActionClick(row, "MARK_RESOLVED")
                              }
                            >
                              Resolve
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

export default AgentEscalationTable;