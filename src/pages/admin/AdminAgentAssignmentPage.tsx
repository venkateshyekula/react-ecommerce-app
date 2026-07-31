import { useCallback, useEffect, useMemo, useState } from "react";
import AdminAgentAssignmentCard from "../../components/admin/AdminAgentAssignmentCard";
import AgentWorkloadSummary from "../../components/admin/AgentWorkloadSummary";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";
import { agentAssignmentService } from "../../services/agentAssignmentService";
import type {
  AgentAssignment,
  AgentProfile,
  AgentTaskType
} from "../../types/agentAssignment";

type AssignmentFilter = "ALL" | "UNASSIGNED" | "ASSIGNED";
type TaskTypeFilter = "ALL" | AgentTaskType;

const AdminAgentAssignmentPage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [assignments, setAssignments] = useState<AgentAssignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [savingAssignmentId, setSavingAssignmentId] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [assignmentFilter, setAssignmentFilter] =
    useState<AssignmentFilter>("ALL");
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskTypeFilter>("ALL");

  const loadData = useCallback(
    async (isManualSync = false): Promise<void> => {
      try {
        if (isManualSync) {
          setIsSyncing(true);
        } else {
          setIsLoading(true);
        }

        const [agentData, assignmentData] = await Promise.all([
          agentAssignmentService.getActiveAgents(),
          agentAssignmentService.syncAssignmentCandidates()
        ]);

        setAgents(agentData);
        setAssignments(assignmentData);

        if (isManualSync) {
          showToast(
            "Sync complete",
            "Tasks and available agents have been synchronized.",
            "success"
          );
        }
      } catch {
        showToast(
          "Agent assignment load failed",
          "Unable to load delivery and pickup assignment dashboard.",
          "danger"
        );
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredAssignments = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const searchable = [
        assignment.assignmentId,
        assignment.taskType,
        assignment.taskId,
        assignment.orderId ?? "",
        assignment.returnRequestId ?? "",
        assignment.customerName,
        assignment.customerPhone ?? "",
        assignment.address,
        assignment.pincode ?? "",
        assignment.agentName ?? "",
        assignment.status
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchable.includes(normalizedSearch);

      const matchesAssignment =
        assignmentFilter === "ALL" ||
        (assignmentFilter === "UNASSIGNED" &&
          assignment.status === "UNASSIGNED") ||
        (assignmentFilter === "ASSIGNED" &&
          assignment.status !== "UNASSIGNED");

      const matchesTaskType =
        taskTypeFilter === "ALL" || assignment.taskType === taskTypeFilter;

      return matchesSearch && matchesAssignment && matchesTaskType;
    });
  }, [assignments, searchText, assignmentFilter, taskTypeFilter]);

  const handleAssignAgent = async ({
    assignment,
    agent,
    scheduledDate,
    scheduledSlot,
    remarks
  }: {
    assignment: AgentAssignment;
    agent: AgentProfile;
    scheduledDate?: string;
    scheduledSlot?: string;
    remarks?: string;
  }): Promise<void> => {
    if (!currentUser) {
      showToast(
        "Login required",
        "Please login as admin to assign agents.",
        "warning"
      );
      return;
    }

    const isReassignment = Boolean(assignment.agentId);

    try {
      setSavingAssignmentId(assignment.id);

      const resolvedAgentId = agent.agentId || agent.id;

      const updatedAssignment = await agentAssignmentService.assignAgent({
        assignment,
        payload: {
          agentId: resolvedAgentId,
          agentName: agent.name,
          agentPhone: agent.phone,
          agentType: agent.agentType,
          assignedByUserId: currentUser.id,
          assignedByName: currentUser.name,
          scheduledDate,
          scheduledSlot,
          remarks
        }
      });

      setAssignments((previousAssignments) =>
        previousAssignments.map((currentAssignment) =>
          currentAssignment.id === updatedAssignment.id
            ? updatedAssignment
            : currentAssignment
        )
      );

      showToast(
        isReassignment ? "Agent reassigned" : "Agent assigned",
        `${agent.name} has been ${
          isReassignment ? "reassigned to" : "assigned to"
        } task ${assignment.taskId}.`,
        "success"
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to assign agent to the selected task.";

      showToast("Agent assignment failed", message, "danger");
    } finally {
      setSavingAssignmentId("");
    }
  };

  if (isLoading) {
    return (
      <main className="admin-agent-assignment-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading agent assignments..." />
        </div>
      </main>
    );
  }

  return (
    <main className="admin-agent-assignment-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
            <div>
              <span className="badge rounded-pill text-bg-primary mb-2">
                Phase 12O.1.1
              </span>

              <h1 className="fw-bold mb-1">
                Delivery + Pickup Agent Assignment
              </h1>

              <p className="text-muted mb-0">
                Assign return pickups and forward deliveries with max daily task
                validation.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary align-self-lg-start support-agent-header-btn"
              disabled={isSyncing}
              onClick={() => void loadData(true)}
            >
              {isSyncing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Syncing...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-2" />
                  Sync Tasks
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <AgentWorkloadSummary agents={agents} assignments={assignments} />

        <div className="bg-white border rounded-4 p-3 shadow-sm mb-4">
          <div className="row g-3 align-items-end">
            <div className="col-lg-5">
              <label className="form-label fw-semibold">Search</label>
              <input
                className="form-control"
                value={searchText}
                placeholder="Search task, order, return, customer, pincode, agent..."
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-semibold">Assignment</label>
              <select
                className="form-select"
                value={assignmentFilter}
                onChange={(event) =>
                  setAssignmentFilter(event.target.value as AssignmentFilter)
                }
              >
                <option value="ALL">All</option>
                <option value="UNASSIGNED">Unassigned</option>
                <option value="ASSIGNED">Assigned</option>
              </select>
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-semibold">Task Type</label>
              <select
                className="form-select"
                value={taskTypeFilter}
                onChange={(event) =>
                  setTaskTypeFilter(event.target.value as TaskTypeFilter)
                }
              >
                <option value="ALL">All</option>
                <option value="RETURN_PICKUP">Return Pickup</option>
                <option value="ORDER_DELIVERY">Order Delivery</option>
              </select>
            </div>

            <div className="col-lg-1 d-flex justify-content-lg-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100 w-lg-auto"
                title="Clear Filters"
                disabled={
                  !searchText &&
                  assignmentFilter === "ALL" &&
                  taskTypeFilter === "ALL"
                }
                onClick={() => {
                  setSearchText("");
                  setAssignmentFilter("ALL");
                  setTaskTypeFilter("ALL");
                }}
              >
                <i className="bi bi-x-circle me-1 d-lg-none" />
                <span className="d-lg-none">Clear</span>
                <i className="bi bi-x-circle d-none d-lg-inline" />
              </button>
            </div>
          </div>
        </div>

        {filteredAssignments.length === 0 ? (
          <EmptyState
            title="No assignment tasks found"
            message="No delivery or pickup assignment tasks match the selected filters."
            iconClassName="bi bi-truck text-primary"
          />
        ) : (
          <div className="row g-3">
            {filteredAssignments.map((assignment) => (
              <div className="col-12 col-xl-6" key={assignment.id}>
                <AdminAgentAssignmentCard
                  assignment={assignment}
                  agents={agents}
                  assignments={assignments}
                  isSaving={savingAssignmentId === assignment.id}
                  onAssign={handleAssignAgent}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default AdminAgentAssignmentPage;