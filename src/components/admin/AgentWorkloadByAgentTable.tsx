import { useState, useMemo, useEffect } from "react";
import type {
  AgentSlaSeverity,
  AgentWorkloadRow
} from "../../types/agentSla";
import Pagination from "../common/Pagination";
type AgentWorkloadByAgentTableProps = {
  agents: AgentWorkloadRow[];
  initialPageSize?: number;
};

const getRiskBadgeClass = (riskLevel: AgentSlaSeverity): string => {
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

const AgentWorkloadByAgentTable = ({
  agents,
  initialPageSize = 10
}: AgentWorkloadByAgentTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Reset pagination whenever the agents input data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [agents]);

  const totalAgents = agents.length;
  const totalPages = Math.ceil(totalAgents / pageSize) || 1;

  // Slice agents array for current page view
  const paginatedAgents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return agents.slice(startIndex, startIndex + pageSize);
  }, [agents, currentPage, pageSize]);

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 mb-4">
      <div className="card-body p-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
          <div>
            <h5 className="fw-bold mb-1">Agent Workload</h5>
            <p className="text-muted small mb-0">
              Agent-wise pickup and delivery workload, capacity, SLA breaches,
              and risk level.
            </p>
          </div>
        </div>

        {totalAgents === 0 ? (
          <div className="alert alert-light border mb-0">
            No agent workload data available.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Total</th>
                    <th>Pickup</th>
                    <th>Delivery</th>
                    <th>Completed</th>
                    <th>At Risk</th>
                    <th>Breached</th>
                    <th>Capacity</th>
                    <th>Risk</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedAgents.map((agent) => (
                    <tr key={agent.agentId}>
                      <td>
                        <div className="fw-semibold">{agent.agentName}</div>
                        <div className="small text-muted">
                          {agent.agentId}
                          {agent.agentPhone ? ` · ${agent.agentPhone}` : ""}
                        </div>
                      </td>

                      <td>{agent.totalTasks}</td>
                      <td>{agent.pickupTasks}</td>
                      <td>{agent.deliveryTasks}</td>
                      <td>{agent.completedTasks}</td>
                      <td>{agent.atRiskTasks}</td>
                      <td>{agent.breachedTasks}</td>

                      <td>
                        {agent.maxDailyTasks && agent.maxDailyTasks > 0 ? (
                          <>
                            <div className="small fw-semibold">
                              {agent.assignedTasks}/{agent.maxDailyTasks}
                            </div>
                            <div
                              className="progress mt-1"
                              style={{ height: 6 }}
                              role="progressbar"
                              aria-label="Agent capacity utilization"
                              aria-valuenow={agent.utilizationPercent}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className={`progress-bar ${
                                  agent.utilizationPercent >= 100
                                    ? "bg-danger"
                                    : agent.utilizationPercent >= 80
                                      ? "bg-warning"
                                      : "bg-success"
                                }`}
                                style={{
                                  width: `${Math.min(agent.utilizationPercent, 100)}%`
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <span className="text-muted small">Unlimited</span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`badge ${getRiskBadgeClass(
                            agent.riskLevel
                          )}`}
                        >
                          {agent.riskLevel}
                        </span>
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
                totalItems={totalAgents}
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

export default AgentWorkloadByAgentTable;