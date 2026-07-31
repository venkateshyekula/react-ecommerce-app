import { agentRoutePlanningService } from "../../services/agentRoutePlanningService";
import type { AgentRouteCluster } from "../../types/agentRoutePlanning";

type AgentRouteClusterCardProps = {
  cluster: AgentRouteCluster;
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

const getPriorityBadgeClass = (priority?: string): string => {
  if (priority === "URGENT" || priority === "HIGH") {
    return "text-bg-danger";
  }

  if (priority === "MEDIUM") {
    return "text-bg-warning text-dark";
  }

  return "text-bg-secondary";
};

const AgentRouteClusterCard = ({ cluster }: AgentRouteClusterCardProps) => {
  const suggestedAgents = cluster?.suggestedAgents ?? [];
  const tasks = cluster?.tasks ?? [];

  return (
    <div className="card border-0 shadow-sm rounded-3 h-100">
      <div className="card-body p-4 d-flex flex-column justify-content-between">
        <div>
          {/* Header Section */}
          <div className="d-flex flex-column flex-xl-row justify-content-between gap-3 mb-3">
            <div>
              <div className="d-flex flex-wrap gap-2 mb-2">
                <span className="badge align-self-start text-bg-light border">
                  Pincode {cluster.pincode}
                </span>

                {cluster.city ? (
                  <span className="badge align-self-start text-bg-light border">
                    {cluster.city}
                  </span>
                ) : null}

                <span className="badge align-self-start text-bg-light border">
                  {formatLabel(cluster.taskType)}
                </span>
              </div>

              <h5 className="fw-bold mb-1">
                {cluster.totalTasks} task{cluster.totalTasks === 1 ? "" : "s"} in
                this cluster
              </h5>

              <p className="text-muted small mb-0">
                Scheduled:{" "}
                {agentRoutePlanningService.formatDate(cluster.scheduledDate)}
              </p>
            </div>

            {cluster.urgentTasks > 0 ? (
              <span className="badge text-bg-danger align-self-start">
                {cluster.urgentTasks} high priority
              </span>
            ) : (
              <span className="badge text-bg-success align-self-start">
                Normal priority
              </span>
            )}
          </div>

          {/* Stats Overview */}
          <div className="row g-2 mb-3">
            <div className="col-6 col-md-3">
              <div className="border rounded-3 p-2 bg-light">
                <span className="small text-muted d-block">Pickups</span>
                <strong className="fs-6">{cluster.pickupTasks}</strong>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="border rounded-3 p-2 bg-light">
                <span className="small text-muted d-block">Deliveries</span>
                <strong className="fs-6">{cluster.deliveryTasks}</strong>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="border rounded-3 p-2 bg-light">
                <span className="small text-muted d-block">Unassigned</span>
                <strong className="fs-6">{cluster.unassignedTasks}</strong>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="border rounded-3 p-2 bg-light">
                <span className="small text-muted d-block">Assigned</span>
                <strong className="fs-6">{cluster.assignedTasks}</strong>
              </div>
            </div>
          </div>

          {/* Suggested Agents Box */}
          <div className="border rounded-3 p-3 mb-3">
            <h6 className="fw-bold mb-2">Suggested Agents</h6>

            {suggestedAgents.length === 0 ? (
              <div className="alert alert-warning small mb-0">
                No available agent suggestions found. Check agent service pincodes,
                agent type, or max daily capacity.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {suggestedAgents.map((suggestion) => (
                  <div
                    className="border rounded-3 p-2 bg-light"
                    key={suggestion.agent.agentId || suggestion.agent.id}
                  >
                    <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
                      <div>
                        <strong>{suggestion.agent.name}</strong>
                        <div className="small text-muted">
                          {suggestion.agent.agentId} ·{" "}
                          {formatLabel(suggestion.agent.agentType)}
                        </div>
                      </div>

                      <div className="text-md-end">
                        <span
                          className={`badge ${
                            suggestion.isPincodeSupported
                              ? "text-bg-success"
                              : "text-bg-warning text-dark"
                          }`}
                        >
                          Score {suggestion.score}
                        </span>
                        <div className="small text-muted mt-1">
                          Capacity: {suggestion.remainingCapacity}
                        </div>
                      </div>
                    </div>

                    <p className="small text-muted mb-0 mt-1">
                      {suggestion.recommendationReason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cluster Tasks List */}
          <div className="border rounded-3 p-3 bg-light">
            <h6 className="fw-bold mb-2">Cluster Tasks</h6>

            <div
              className="d-flex flex-column gap-2"
              style={{ maxHeight: "280px", overflowY: "auto" }}
            >
              {tasks.map((task) => (
                <div
                  className="bg-white border rounded-3 p-2 small shadow-sm"
                  key={task.assignment?.id || task.taskId}
                >
                  <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
                    <div>
                      <strong>{task.taskId}</strong>
                      <div className="text-muted">
                        {formatLabel(task.taskType)} · {task.customerName}
                      </div>
                    </div>

                    <div className="text-md-end">
                      <span
                        className={`badge ${getPriorityBadgeClass(
                          task.priority
                        )}`}
                      >
                        {formatLabel(task.priority)}
                      </span>
                      <div className="small text-muted mt-1">
                        {task.agentName ?? "Unassigned"}
                      </div>
                    </div>
                  </div>

                  <div className="small text-muted mt-1">{task.address}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentRouteClusterCard;