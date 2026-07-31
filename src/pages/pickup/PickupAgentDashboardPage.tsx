import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import PickupAttemptFailedModal from "../../components/pickup/PickupAttemptFailedModal";
import PickupProofModal from "../../components/pickup/PickupProofModal";
import PickupTaskCard from "../../components/pickup/PickupTaskCard";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";
import { pickupAgentService } from "../../services/pickupAgentService";
import type { AgentAssignment } from "../../types/agentAssignment";
import type { CreatePickupProofPayload } from "../../types/pickupAgent";

type PickupTaskFilter =
  | "ALL"
  | "ASSIGNED"
  | "OUT_FOR_PICKUP"
  | "PICKUP_ATTEMPTED"
  | "PICKUP_COMPLETED";

const PickupAgentDashboardPage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const agentId =
    (currentUser as { pickupPartnerId?: string; partnerId?: string } | null)
      ?.pickupPartnerId ??
    (currentUser as { partnerId?: string } | null)?.partnerId ??
    currentUser?.id ??
    "";

  const [tasks, setTasks] = useState<AgentAssignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string>("");
  const [filter, setFilter] = useState<PickupTaskFilter>("ALL");
  const [selectedTask, setSelectedTask] = useState<AgentAssignment | null>(
    null,
  );
  const [attemptedTask, setAttemptedTask] = useState<AgentAssignment | null>(
    null,
  );

  const loadTasks = useCallback(async (): Promise<void> => {
    if (!agentId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const data = await pickupAgentService.getPickupTasksByAgentId(agentId);
      setTasks(data || []);
    } catch {
      showToast(
        "Pickup tasks load failed",
        "Unable to load assigned pickup tasks.",
        "danger",
      );
    } finally {
      setIsLoading(false);
    }
  }, [agentId, showToast]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    if (filter === "ALL") {
      return tasks;
    }

    return tasks.filter((task) => task.status === filter);
  }, [tasks, filter]);

  const summary = useMemo(() => {
    return {
      total: tasks.length,
      assigned: tasks.filter((task) => task.status === "ASSIGNED").length,
      outForPickup: tasks.filter((task) => task.status === "OUT_FOR_PICKUP")
        .length,
      attempted: tasks.filter((task) => task.status === "PICKUP_ATTEMPTED")
        .length,
      completed: tasks.filter((task) => task.status === "PICKUP_COMPLETED")
        .length,
    };
  }, [tasks]);

  const updateTaskInState = (updatedTask: AgentAssignment): void => {
    setTasks((previousTasks) =>
      previousTasks.map((task) => {
        const isMatch =
          (task.id && task.id === updatedTask.id) ||
          (task.assignmentId &&
            updatedTask.assignmentId &&
            task.assignmentId === updatedTask.assignmentId);

        return isMatch ? updatedTask : task;
      }),
    );
  };

  const handleStartPickup = async (
    assignment: AgentAssignment,
  ): Promise<void> => {
    const targetId = assignment.id || assignment.assignmentId || "";
    try {
      setUpdatingTaskId(targetId);

      const updatedTask = await pickupAgentService.startPickup(assignment);

      updateTaskInState(updatedTask);

      showToast(
        "Pickup started",
        `Pickup started for ${assignment.taskId}.`,
        "success",
      );
    } catch {
      showToast(
        "Pickup start failed",
        "Unable to start pickup task.",
        "danger",
      );
    } finally {
      setUpdatingTaskId("");
    }
  };

  const handleMarkAttempted = async (
    assignment: AgentAssignment,
  ): Promise<void> => {
    setAttemptedTask(assignment);
  };

  const handleSubmitAttemptReason = async (reason: string): Promise<void> => {
    if (!attemptedTask) {
      return;
    }

    const targetId = attemptedTask.id || attemptedTask.assignmentId || "";

    try {
      setUpdatingTaskId(targetId);

      const updatedTask = await pickupAgentService.markPickupAttempted({
        assignment: attemptedTask,
        remarks: reason,
      });

      updateTaskInState(updatedTask);

      showToast(
        "Pickup attempt recorded",
        `Pickup attempt reason saved for ${attemptedTask.taskId}.`,
        "warning",
      );

      setAttemptedTask(null);
    } catch {
      showToast(
        "Attempt update failed",
        "Unable to mark pickup attempted.",
        "danger",
      );
    } finally {
      setUpdatingTaskId("");
    }
  };

  const handleCompletePickup = (assignment: AgentAssignment): void => {
    setSelectedTask(assignment);
  };

  const handleCloseProofModal = (): void => {
    if (updatingTaskId) {
      return;
    }

    setSelectedTask(null);
  };

  const handleCloseAttemptModal = (): void => {
    if (updatingTaskId) {
      return;
    }

    setAttemptedTask(null);
  };

  const handleSubmitProof = async (
    proofPayload: CreatePickupProofPayload,
  ): Promise<void> => {
    if (!selectedTask) {
      return;
    }

    const targetId = selectedTask.id || selectedTask.assignmentId || "";

    try {
      setUpdatingTaskId(targetId);

      const result = await pickupAgentService.completePickup({
        assignment: selectedTask,
        proofPayload,
      });

      updateTaskInState(result.assignment);

      showToast(
        "Pickup completed",
        `Pickup completed for ${selectedTask.taskId}.`,
        "success",
      );

      setSelectedTask(null);
    } catch {
      showToast(
        "Pickup completion failed",
        "Unable to complete pickup with proof.",
        "danger",
      );
    } finally {
      setUpdatingTaskId("");
    }
  };

  if (isLoading) {
    return (
      <main className="pickup-agent-dashboard-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading pickup tasks..." />
        </div>
      </main>
    );
  }

  return (
    <main className="pickup-agent-dashboard-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">Pickup Agent Dashboard</h1>
              <p className="text-muted mb-0">
                View assigned return pickups, update pickup status, and capture
                pickup proof.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm mb-1 support-agent-header-btn"
              onClick={() => void loadTasks()}
              disabled={isLoading}
            >
              <i className="bi bi-arrow-clockwise me-2" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        {/* Metric Summary Cards (Interactive Quick Filters) */}
        <div className="row g-3 mb-4">
          {[
            { label: "Total", count: summary.total, key: "ALL" },
            { label: "Assigned", count: summary.assigned, key: "ASSIGNED" },
            {
              label: "Out for Pickup",
              count: summary.outForPickup,
              key: "OUT_FOR_PICKUP",
            },
            {
              label: "Attempted",
              count: summary.attempted,
              key: "PICKUP_ATTEMPTED",
            },
            {
              label: "Completed",
              count: summary.completed,
              key: "PICKUP_COMPLETED",
            },
          ].map((item) => (
            <div className="col-6 col-md" key={item.key}>
              <div
                role="button"
                tabIndex={0}
                className={`bg-white border rounded-4 p-3 shadow-sm h-100 transition-all ${
                  filter === item.key
                    ? "border-primary border-2 bg-primary-subtle"
                    : ""
                }`}
                onClick={() => setFilter(item.key as PickupTaskFilter)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setFilter(item.key as PickupTaskFilter);
                  }
                }}
              >
                <span className="text-muted small d-block">{item.label}</span>
                <strong className="d-block fs-5">{item.count}</strong>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Dropdown */}
        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Status Filter</label>
              <select
                className="form-select"
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as PickupTaskFilter)
                }
              >
                <option value="ALL">All ({summary.total})</option>
                <option value="ASSIGNED">Assigned ({summary.assigned})</option>
                <option value="OUT_FOR_PICKUP">
                  Out for Pickup ({summary.outForPickup})
                </option>
                <option value="PICKUP_ATTEMPTED">
                  Pickup Attempted ({summary.attempted})
                </option>
                <option value="PICKUP_COMPLETED">
                  Pickup Completed ({summary.completed})
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Task Cards Grid */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            title="No pickup tasks found"
            message={`No pickup tasks match the "${filter}" filter.`}
            iconClassName="bi bi-arrow-return-left text-primary"
          />
        ) : (
          <div className="row g-3">
            {filteredTasks.map((task) => {
              const taskId = task.id || task.assignmentId;
              return (
                <div className="col-12 col-xl-6" key={taskId}>
                  <PickupTaskCard
                    assignment={task}
                    isUpdating={updatingTaskId === taskId}
                    onStartPickup={handleStartPickup}
                    onMarkAttempted={handleMarkAttempted}
                    onCompletePickup={handleCompletePickup}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedTask ? (
        <PickupProofModal
          assignment={selectedTask}
          isSaving={
            updatingTaskId === (selectedTask.id || selectedTask.assignmentId)
          }
          onClose={handleCloseProofModal}
          onSubmit={handleSubmitProof}
        />
      ) : null}

      {attemptedTask ? (
        <PickupAttemptFailedModal
          assignment={attemptedTask}
          isSaving={
            updatingTaskId === (attemptedTask.id || attemptedTask.assignmentId)
          }
          onClose={handleCloseAttemptModal}
          onSubmit={handleSubmitAttemptReason}
        />
      ) : null}
    </main>
  );
};

export default PickupAgentDashboardPage;
