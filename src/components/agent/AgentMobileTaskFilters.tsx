import type {
  AgentMobileFilters,
  AgentMobileTaskPriority,
  AgentMobileTaskStatus,
  AgentMobileTaskType
} from "../../types/agentMobileExperience";

type AgentMobileTaskFiltersProps = {
  filters: AgentMobileFilters;
  onChange: (filters: AgentMobileFilters) => void;
};

const statusOptions: AgentMobileTaskStatus[] = [
  "ASSIGNED",
  "ACCEPTED",
  "IN_PROGRESS",
  "REACHED_LOCATION",
  "PICKED_UP",
  "DELIVERED",
  "FAILED",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED"
];

const typeOptions: AgentMobileTaskType[] = [
  "RETURN_PICKUP",
  "DELIVERY",
  "PROOF_VERIFICATION",
  "SUPPORT_VISIT"
];

const priorityOptions: AgentMobileTaskPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL"
];

const formatLabel = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const AgentMobileTaskFilters = ({
  filters,
  onChange
}: AgentMobileTaskFiltersProps) => {
  const hasActiveFilters =
    Boolean(filters.searchText) ||
    filters.status !== "ALL" ||
    filters.taskType !== "ALL" ||
    filters.priority !== "ALL";

  return (
    <div className="bg-white border rounded-4 p-3 mb-3 shadow-sm">
      <div className="row g-2 align-items-end">
        <div className="col-12">
          <label htmlFor="agentTaskSearchInput" className="form-label fw-semibold">
            Search
          </label>
          <input
            id="agentTaskSearchInput"
            className="form-control"
            value={filters.searchText}
            placeholder="Search task, return, order, customer, city, pincode..."
            onChange={(event) =>
              onChange({
                ...filters,
                searchText: event.target.value
              })
            }
          />
        </div>

        <div className="col-6 col-md-4">
          <label htmlFor="agentTaskStatusSelect" className="form-label fw-semibold">
            Status
          </label>
          <select
            id="agentTaskStatusSelect"
            className="form-select"
            value={filters.status}
            onChange={(event) =>
              onChange({
                ...filters,
                status: event.target.value as AgentMobileFilters["status"]
              })
            }
          >
            <option value="ALL">All Status</option>
            {statusOptions.map((status) => (
              <option value={status} key={status}>
                {formatLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="col-6 col-md-4">
          <label htmlFor="agentTaskTypeSelect" className="form-label fw-semibold">
            Type
          </label>
          <select
            id="agentTaskTypeSelect"
            className="form-select"
            value={filters.taskType}
            onChange={(event) =>
              onChange({
                ...filters,
                taskType: event.target.value as AgentMobileFilters["taskType"]
              })
            }
          >
            <option value="ALL">All Types</option>
            {typeOptions.map((type) => (
              <option value={type} key={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>
        </div>

        <div className="col-6 col-md-3">
          <label htmlFor="agentTaskPrioritySelect" className="form-label fw-semibold">
            Priority
          </label>
          <select
            id="agentTaskPrioritySelect"
            className="form-select"
            value={filters.priority}
            onChange={(event) =>
              onChange({
                ...filters,
                priority: event.target.value as AgentMobileFilters["priority"]
              })
            }
          >
            <option value="ALL">All Priority</option>
            {priorityOptions.map((priority) => (
              <option value={priority} key={priority}>
                {formatLabel(priority)}
              </option>
            ))}
          </select>
        </div>

        <div className="col-6 col-md-1">
          <button
            type="button"
            className="btn btn-outline-secondary w-100 d-flex justify-content-center align-items-center"
            disabled={!hasActiveFilters}
            aria-label="Clear filters"
            title="Clear filters"
            onClick={() =>
              onChange({
                searchText: "",
                status: "ALL",
                taskType: "ALL",
                priority: "ALL"
              })
            }
          >
            <i className="bi bi-x-circle" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentMobileTaskFilters;