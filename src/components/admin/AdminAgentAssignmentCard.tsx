import { useEffect, useMemo, useState } from "react";
import type {
  AgentAssignment,
  AgentProfile,
} from "../../types/agentAssignment";
import {
  getAgentRemainingCapacity,
  getDateKey,
} from "../../utils/agentWorkloadUtils";

type AdminAgentAssignmentCardProps = {
  assignment: AgentAssignment;
  agents: AgentProfile[];
  assignments?: AgentAssignment[];
  isSaving: boolean;
  onAssign: ({
    assignment,
    agent,
    scheduledDate,
    scheduledSlot,
    remarks,
  }: {
    assignment: AgentAssignment;
    agent: AgentProfile;
    scheduledDate?: string;
    scheduledSlot?: string;
    remarks?: string;
  }) => Promise<void>;
};

const getStatusBadgeClass = (status: string): string => {
  if (["ASSIGNED", "ACCEPTED"].includes(status)) {
    return "text-bg-info";
  }

  if (["PICKUP_COMPLETED", "DELIVERED"].includes(status)) {
    return "text-bg-success";
  }

  if (["FAILED", "CANCELLED"].includes(status)) {
    return "text-bg-danger";
  }

  if (status === "UNASSIGNED") {
    return "text-bg-warning text-dark";
  }

  return "text-bg-secondary";
};

const formatLabel = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const canAgentHandleTask = ({
  agent,
  taskType,
}: {
  agent: AgentProfile;
  taskType: AgentAssignment["taskType"];
}): boolean => {
  if (agent.status !== "ACTIVE") {
    return false;
  }

  if (agent.agentType === "BOTH") {
    return true;
  }

  if (taskType === "RETURN_PICKUP") {
    return agent.agentType === "PICKUP_AGENT";
  }

  return agent.agentType === "DELIVERY_AGENT";
};

const AdminAgentAssignmentCard = ({
  assignment,
  agents = [],
  assignments = [],
  isSaving,
  onAssign,
}: AdminAgentAssignmentCardProps) => {
  const eligibleAgents = useMemo(() => {
    const filteredAgents = agents.filter((agent) =>
      canAgentHandleTask({
        agent,
        taskType: assignment.taskType,
      }),
    );

    const uniqueAgentMap = new Map<string, AgentProfile>();

    filteredAgents.forEach((agent) => {
      const key = agent.agentId || agent.id;

      if (!uniqueAgentMap.has(key)) {
        uniqueAgentMap.set(key, agent);
      }
    });

    return Array.from(uniqueAgentMap.values());
  }, [agents, assignment.taskType]);

  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    assignment.agentId ?? "",
  );
  const [scheduledDate, setScheduledDate] = useState<string>(
    assignment.scheduledDate?.slice(0, 10) ??
      new Date().toISOString().slice(0, 10),
  );
  const [scheduledSlot, setScheduledSlot] = useState<string>(
    assignment.scheduledSlot ?? "",
  );
  const [remarks, setRemarks] = useState<string>(assignment.remarks ?? "");

  // Synchronize state when assignment props change
  useEffect(() => {
    setSelectedAgentId(assignment.agentId ?? "");
    setScheduledDate(
      assignment.scheduledDate?.slice(0, 10) ??
        new Date().toISOString().slice(0, 10),
    );
    setScheduledSlot(assignment.scheduledSlot ?? "");
    setRemarks(assignment.remarks ?? "");
  }, [
    assignment.agentId,
    assignment.scheduledDate,
    assignment.scheduledSlot,
    assignment.remarks,
  ]);

  const selectedAgent = eligibleAgents.find(
    (agent) =>
      (agent.agentId && agent.agentId === selectedAgentId) ||
      agent.id === selectedAgentId,
  );

  const capacity = selectedAgent
    ? getAgentRemainingCapacity({
        agent: selectedAgent,
        assignments,
        scheduledDate,
        ignoreAssignmentDbId: assignment.id,
      })
    : null;

  const isCapacityReached = Boolean(capacity?.isCapacityReached);

  const taskIcon =
    assignment.taskType === "RETURN_PICKUP"
      ? "bi bi-arrow-return-left"
      : "bi bi-truck";

  const handleAssignClick = () => {
    if (!selectedAgent || isCapacityReached) {
      return;
    }

    let isoScheduledDate: string | undefined = assignment.scheduledDate;

    if (scheduledDate) {
      const parsed = new Date(scheduledDate);
      if (!Number.isNaN(parsed.getTime())) {
        isoScheduledDate = parsed.toISOString();
      }
    }

    void onAssign({
      assignment,
      agent: selectedAgent,
      scheduledDate: isoScheduledDate,
      scheduledSlot: scheduledSlot.trim() || assignment.scheduledSlot,
      remarks: remarks.trim() || undefined,
    });
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 h-100">
      <div className="card-body p-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
          <div>
            <div className="d-flex flex-wrap gap-2 mb-2">
              <span className="badge text-bg-light border">
                <i className={`${taskIcon} me-1`} />
                {formatLabel(assignment.taskType)}
              </span>

              <span className="badge text-bg-light border">
                {assignment.assignmentId}
              </span>
            </div>

            <h5 className="fw-bold mb-1">
              {assignment.customerName || "Customer"}
            </h5>

            <p className="text-muted small mb-0">
              Task: <strong>{assignment.taskId}</strong>
              {assignment.orderId ? (
                <>
                  {" "}
                  · Order: <strong>{assignment.orderId}</strong>
                </>
              ) : null}
            </p>
          </div>

          <span
            className={`badge align-self-start ${getStatusBadgeClass(
              assignment.status,
            )}`}
          >
            {formatLabel(assignment.status)}
          </span>
        </div>

        <div className="alert alert-light border small">
          <div>
            <strong>Address:</strong> {assignment.address}
          </div>

          {assignment.pincode ? (
            <div>
              <strong>Pincode:</strong> {assignment.pincode}
            </div>
          ) : null}

          {assignment.customerPhone ? (
            <div>
              <strong>Phone:</strong> {assignment.customerPhone}
            </div>
          ) : null}

          {assignment.scheduledSlot ? (
            <div>
              <strong>Current Slot:</strong> {assignment.scheduledSlot}
            </div>
          ) : null}
        </div>

        {assignment.agentId ? (
          <div className="alert alert-info small mb-3">
            <strong>Assigned Agent:</strong> {assignment.agentName}{" "}
            {assignment.agentPhone ? `(${assignment.agentPhone})` : ""}
          </div>
        ) : null}

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Agent</label>
            <select
              className="form-select"
              value={selectedAgentId}
              disabled={isSaving}
              onChange={(event) => setSelectedAgentId(event.target.value)}
            >
              <option value="">Select agent</option>
              {eligibleAgents.map((agent) => (
                <option
                  value={agent.agentId}
                  key={`${agent.id}-${agent.agentId}`}
                >
                  {agent.name} · {formatLabel(agent.agentType)}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold">Date</label>
            <input
              type="date"
              className="form-control"
              value={scheduledDate}
              disabled={isSaving}
              onChange={(event) => setScheduledDate(event.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold">Slot</label>
            <input
              className="form-control"
              value={scheduledSlot}
              disabled={isSaving}
              placeholder="10 AM - 1 PM"
              onChange={(event) => setScheduledSlot(event.target.value)}
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold">Remarks</label>
            <textarea
              className="form-control"
              rows={2}
              value={remarks}
              disabled={isSaving}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Assignment remarks..."
            />
          </div>
        </div>

        {selectedAgent && capacity ? (
          <div
            className={`alert small mt-3 ${
              isCapacityReached
                ? "alert-danger"
                : capacity.isUnlimited
                  ? "alert-light border"
                  : "alert-success"
            }`}
          >
            <strong>Agent Capacity:</strong>{" "}
            {capacity.isUnlimited ? (
              <>
                {selectedAgent.name} has no daily task limit configured for{" "}
                {getDateKey(scheduledDate)}.
              </>
            ) : (
              <>
                {selectedAgent.name} has {capacity.assignedCount}/
                {capacity.maxDailyTasks} tasks assigned for{" "}
                {getDateKey(scheduledDate)}. Remaining capacity:{" "}
                {capacity.remainingCapacity}.
              </>
            )}
            {isCapacityReached ? (
              <div className="mt-1 fw-semibold">
                This agent has reached the max daily task limit. Choose another
                agent or another date.
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="d-flex justify-content-end mt-3">
          <button
            type="button"
            className="btn btn-primary"
            disabled={isSaving || !selectedAgent || isCapacityReached}
            onClick={handleAssignClick}
          >
            {isSaving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Assigning...
              </>
            ) : assignment.agentId ? (
              <>
                <i className="bi bi-arrow-repeat me-2" />
                Reassign Agent
              </>
            ) : (
              <>
                <i className="bi bi-person-plus me-2" />
                Assign Agent
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAgentAssignmentCard;
