import { useMemo } from "react";
import type {
  AgentAssignment,
  AgentProfile
} from "../../types/agentAssignment";

type AgentWorkloadSummaryProps = {
  agents?: AgentProfile[];
  assignments?: AgentAssignment[];
};

const AgentWorkloadSummary = ({
  agents = [],
  assignments = []
}: AgentWorkloadSummaryProps) => {
  // Compute all metrics in a single pass for performance & cleanliness
  const metrics = useMemo(() => {
    let assigned = 0;
    let unassigned = 0;
    let pickup = 0;
    let delivery = 0;

    for (const assignment of assignments) {
      if (assignment.status === "UNASSIGNED") {
        unassigned++;
      } else {
        assigned++;
      }

      if (assignment.taskType === "RETURN_PICKUP") {
        pickup++;
      } else if (assignment.taskType === "ORDER_DELIVERY") {
        delivery++;
      }
    }

    const activeAgents = agents.filter((agent) => agent.status === "ACTIVE").length;

    return {
      activeAgents,
      totalTasks: assignments.length,
      assigned,
      unassigned,
      pickup,
      delivery
    };
  }, [agents, assignments]);

  const summaryItems = [
    {
      label: "Active Agents",
      value: metrics.activeAgents,
      iconClassName: "bi bi-person-check",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Total Tasks",
      value: metrics.totalTasks,
      iconClassName: "bi bi-list-task",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Assigned",
      value: metrics.assigned,
      iconClassName: "bi bi-check-circle",
      badgeClassName: "text-bg-info"
    },
    {
      label: "Unassigned",
      value: metrics.unassigned,
      iconClassName: "bi bi-exclamation-circle",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "Return Pickups",
      value: metrics.pickup,
      iconClassName: "bi bi-arrow-return-left",
      badgeClassName: "text-bg-secondary"
    },
    {
      label: "Deliveries",
      value: metrics.delivery,
      iconClassName: "bi bi-truck",
      badgeClassName: "text-bg-primary"
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {summaryItems.map((item) => (
        <div className="col-6 col-lg-2" key={item.label}>
          <div className="bg-white border rounded-4 p-3 shadow-sm h-100">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <span className="text-muted small d-block mb-1">{item.label}</span>
                <strong className="fs-5">{item.value}</strong>
              </div>

              <span className={`badge rounded-circle p-2 d-inline-flex align-items-center justify-content-center ${item.badgeClassName}`}>
                <i className={`${item.iconClassName} fs-6`} />
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgentWorkloadSummary;