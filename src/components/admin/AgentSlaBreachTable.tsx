import { useState, useMemo, useEffect } from "react";
import type {
  AgentSlaStatus,
  AgentSlaTaskRow
} from "../../types/agentSla";
import { agentSlaDashboardService } from "../../services/agentSlaDashboardService";
import Pagination from "../common/Pagination"; // Adjust path if needed

type AgentSlaBreachTableProps = {
  tasks: AgentSlaTaskRow[];
  initialPageSize?: number;
};

const formatLabel = (value?: string): string => {
  if (!value) {
    return "Not Available";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getSlaBadgeClass = (status: AgentSlaStatus): string => {
  if (status === "BREACHED") {
    return "text-bg-danger";
  }

  if (status === "AT_RISK") {
    return "text-bg-warning text-dark";
  }

  if (status === "COMPLETED") {
    return "text-bg-success";
  }

  return "text-bg-info";
};

const AgentSlaBreachTable = ({
  tasks,
  initialPageSize = 10
}: AgentSlaBreachTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Reset pagination when tasks change
  useEffect(() => {
    setCurrentPage(1);
  }, [tasks]);

  const totalTasks = tasks.length;
  const totalPages = Math.ceil(totalTasks / pageSize) || 1;

  // Slice tasks for current page view
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return tasks.slice(startIndex, startIndex + pageSize);
  }, [tasks, currentPage, pageSize]);

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
          <div>
            <h5 className="fw-bold mb-1">SLA Breach and Risk Queue</h5>
            <p className="text-muted small mb-0">
              Monitor tasks that are breached, at risk, or nearing SLA deadline.
            </p>
          </div>
        </div>

        {totalTasks === 0 ? (
          <div className="alert alert-light border mb-0">
            No SLA risk tasks found for the selected filters.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Agent</th>
                    <th>Status</th>
                    <th>SLA</th>
                    <th>Due</th>
                    <th>Attempts</th>
                    <th>Location</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedTasks.map((task) => (
                    <tr key={task.assignmentDbId}>
                      <td>
                        <div className="fw-semibold">{task.taskId}</div>
                        <div className="small text-muted">
                          {formatLabel(task.taskType)}
                          {task.orderId ? ` · ${task.orderId}` : ""}
                        </div>
                      </td>

                      <td>
                        <div>{task.agentName ?? "Unassigned"}</div>
                        <div className="small text-muted">
                          {task.agentId ?? "No agent assigned"}
                        </div>
                      </td>

                      <td>
                        <span className="badge text-bg-light border text-dark">
                          {formatLabel(task.status)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${getSlaBadgeClass(task.slaStatus)}`}
                        >
                          {formatLabel(task.slaStatus)}
                        </span>

                        {task.slaStatus === "BREACHED" ? (
                          <div className="small text-danger mt-1">
                            Overdue: {task.hoursOverdue}h
                          </div>
                        ) : null}

                        {task.slaStatus === "AT_RISK" ||
                        task.slaStatus === "ON_TRACK" ? (
                          <div className="small text-muted mt-1">
                            Remaining: {task.hoursRemaining}h
                          </div>
                        ) : null}
                      </td>

                      <td>
                        {agentSlaDashboardService.formatDateTime(task.dueAt)}
                      </td>

                      <td>{task.attemptCount}</td>

                      <td>
                        <div>{task.city ?? "N/A"}</div>
                        <div className="small text-muted">
                          {task.pincode ?? "No pincode"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Reusable Pagination Component */}
            <div className="mt-3 pt-3 border-top">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalTasks}
                itemsPerPage={pageSize}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={handlePageSizeChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AgentSlaBreachTable;