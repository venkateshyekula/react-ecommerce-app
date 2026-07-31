import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import DeliveryAttemptFailedModal from "../../components/delivery/DeliveryAttemptFailedModal";
import DeliveryProofModal from "../../components/delivery/DeliveryProofModal";
import DeliveryTaskCard from "../../components/delivery/DeliveryTaskCard";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";
import { deliveryAgentService } from "../../services/deliveryAgentService";
import type { AgentAssignment } from "../../types/agentAssignment";
import type { CreateDeliveryProofPayload } from "../../types/deliveryAgent";

type DeliveryTaskFilter =
  | "ALL"
  | "ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERY_ATTEMPTED"
  | "DELIVERED";

const DeliveryAgentDashboardPage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const agentId =
    (currentUser as { deliveryPartnerId?: string; partnerId?: string } | null)
      ?.deliveryPartnerId ??
    (currentUser as { partnerId?: string } | null)?.partnerId ??
    currentUser?.id ??
    "";

  const [tasks, setTasks] = useState<AgentAssignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string>("");
  const [filter, setFilter] = useState<DeliveryTaskFilter>("ALL");
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

      const data =
        await deliveryAgentService.getDeliveryTasksByAgentId(agentId);

      setTasks(data);
    } catch {
      showToast(
        "Delivery tasks load failed",
        "Unable to load assigned delivery tasks.",
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
      outForDelivery: tasks.filter((task) => task.status === "OUT_FOR_DELIVERY")
        .length,
      attempted: tasks.filter((task) =>
        ["DELIVERY_ATTEMPTED", "FAILED"].includes(task.status),
      ).length,
      delivered: tasks.filter((task) => task.status === "DELIVERED").length,
    };
  }, [tasks]);

  const updateTaskInState = (updatedTask: AgentAssignment): void => {
    const targetId = updatedTask.id || updatedTask.assignmentId;
    setTasks((previousTasks) =>
      previousTasks.map((task) => {
        const currentId = task.id || task.assignmentId;
        return currentId === targetId ? updatedTask : task;
      }),
    );
  };

  const handleStartDelivery = async (
    assignment: AgentAssignment,
  ): Promise<void> => {
    const targetId = assignment.id || assignment.assignmentId;
    try {
      setUpdatingTaskId(targetId);

      const updatedTask = await deliveryAgentService.startDelivery(assignment);

      updateTaskInState(updatedTask);

      showToast(
        "Delivery started",
        `Delivery started for ${assignment.taskId}.`,
        "success",
      );
    } catch {
      showToast(
        "Delivery start failed",
        "Unable to start delivery task.",
        "danger",
      );
    } finally {
      setUpdatingTaskId("");
    }
  };

  const handleMarkAttempted = (assignment: AgentAssignment): void => {
    setAttemptedTask(assignment);
  };

  const handleSubmitAttemptReason = async (reason: string): Promise<void> => {
    if (!attemptedTask) {
      return;
    }

    const targetId = attemptedTask.id || attemptedTask.assignmentId;

    try {
      setUpdatingTaskId(targetId);

      const updatedTask = await deliveryAgentService.markDeliveryAttempted({
        assignment: attemptedTask,
        remarks: reason,
      });

      updateTaskInState(updatedTask);

      showToast(
        "Delivery attempt recorded",
        `Delivery attempt reason saved for ${attemptedTask.taskId}.`,
        "warning",
      );

      setAttemptedTask(null);
    } catch {
      showToast(
        "Attempt update failed",
        "Unable to mark delivery attempted.",
        "danger",
      );
    } finally {
      setUpdatingTaskId("");
    }
  };

  const handleCompleteDelivery = (assignment: AgentAssignment): void => {
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
    proofPayload: CreateDeliveryProofPayload,
  ): Promise<void> => {
    if (!selectedTask) {
      return;
    }

    const targetId = selectedTask.id || selectedTask.assignmentId;

    try {
      setUpdatingTaskId(targetId);

      const result = await deliveryAgentService.completeDelivery({
        assignment: selectedTask,
        proofPayload,
      });

      updateTaskInState(result.assignment);

      showToast(
        "Delivery completed",
        `Delivery completed for ${selectedTask.taskId}.`,
        "success",
      );

      setSelectedTask(null);
    } catch {
      showToast(
        "Delivery completion failed",
        "Unable to complete delivery with proof.",
        "danger",
      );
    } finally {
      setUpdatingTaskId("");
    }
  };

  if (isLoading) {
    return (
      <main className="delivery-agent-dashboard-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading delivery tasks..." />
        </div>
      </main>
    );
  }

  return (
    <main className="delivery-agent-dashboard-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">Delivery Agent Dashboard</h1>
              <p className="text-muted mb-0">
                View assigned deliveries, update delivery status, and capture
                delivery proof.
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
        <div className="row g-3 mb-4">
          <div className="col-6 col-md">
            <div className="bg-white border rounded-4 p-3 shadow-sm">
              <span className="text-muted small">Total</span>
              <strong className="d-block fs-5">{summary.total}</strong>
            </div>
          </div>

          <div className="col-6 col-md">
            <div className="bg-white border rounded-4 p-3 shadow-sm">
              <span className="text-muted small">Assigned</span>
              <strong className="d-block fs-5">{summary.assigned}</strong>
            </div>
          </div>

          <div className="col-6 col-md">
            <div className="bg-white border rounded-4 p-3 shadow-sm">
              <span className="text-muted small">Out for Delivery</span>
              <strong className="d-block fs-5">{summary.outForDelivery}</strong>
            </div>
          </div>

          <div className="col-6 col-md">
            <div className="bg-white border rounded-4 p-3 shadow-sm">
              <span className="text-muted small">Attempted</span>
              <strong className="d-block fs-5">{summary.attempted}</strong>
            </div>
          </div>

          <div className="col-6 col-md">
            <div className="bg-white border rounded-4 p-3 shadow-sm">
              <span className="text-muted small">Delivered</span>
              <strong className="d-block fs-5">{summary.delivered}</strong>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Status Filter</label>
              <select
                className="form-select"
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as DeliveryTaskFilter)
                }
              >
                <option value="ALL">All</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERY_ATTEMPTED">Delivery Attempted</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <EmptyState
            title="No delivery tasks found"
            message="No delivery tasks match the selected filter."
            iconClassName="bi bi-truck text-primary"
          />
        ) : (
          <div className="row g-3">
            {filteredTasks.map((task) => {
              const taskId = task.id || task.assignmentId;
              return (
                <div className="col-12 col-xl-6" key={taskId}>
                  <DeliveryTaskCard
                    assignment={task}
                    isUpdating={updatingTaskId === taskId}
                    onStartDelivery={handleStartDelivery}
                    onMarkAttempted={handleMarkAttempted}
                    onCompleteDelivery={handleCompleteDelivery}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedTask ? (
        <DeliveryProofModal
          assignment={selectedTask}
          isSaving={
            updatingTaskId === (selectedTask.id || selectedTask.assignmentId)
          }
          onClose={handleCloseProofModal}
          onSubmit={handleSubmitProof}
        />
      ) : null}

      {attemptedTask ? (
        <DeliveryAttemptFailedModal
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

export default DeliveryAgentDashboardPage;
