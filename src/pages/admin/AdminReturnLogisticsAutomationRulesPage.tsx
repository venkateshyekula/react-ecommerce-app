import { useCallback, useEffect, useMemo, useState } from "react";
import ReturnLogisticsAutomationCharts from "../../components/admin/ReturnLogisticsAutomationCharts";
import ReturnLogisticsAutomationRulesTable from "../../components/admin/ReturnLogisticsAutomationRulesTable";
import ReturnLogisticsAutomationSummaryCards from "../../components/admin/ReturnLogisticsAutomationSummaryCards";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/useToast";
import { returnLogisticsAutomationRuleService } from "../../services/returnLogisticsAutomationRuleService";
import type {
  ReturnLogisticsAutomationAction,
  ReturnLogisticsAutomationAuditLog,
  ReturnLogisticsAutomationCondition,
  ReturnLogisticsAutomationDashboardData,
  ReturnLogisticsAutomationRule,
  ReturnLogisticsAutomationRuleDraft,
  ReturnLogisticsAutomationRulePriority,
  ReturnLogisticsAutomationRuleStatus,
  ReturnLogisticsAutomationTrigger
} from "../../types/returnLogisticsAutomationRule";

type StatusFilter = "ALL" | ReturnLogisticsAutomationRuleStatus;
type PriorityFilter = "ALL" | ReturnLogisticsAutomationRulePriority;
type TargetTeam = ReturnLogisticsAutomationRuleDraft["targetTeam"];

const triggerOptions: ReturnLogisticsAutomationTrigger[] = [
  "RETURN_CREATED",
  "PICKUP_DELAYED",
  "PICKUP_FAILED",
  "QC_DELAYED",
  "QC_FAILED",
  "REFUND_DELAYED",
  "SLA_BREACHED",
  "AGENT_UNAVAILABLE",
  "WAREHOUSE_OVERLOAD",
  "HIGH_RISK_RETURN",
  "SELLER_DISPUTE_RAISED",
  "PACKAGE_STUCK_IN_TRANSIT"
];

const actionOptions: ReturnLogisticsAutomationAction[] = [
  "AUTO_ASSIGN_PICKUP_AGENT",
  "REASSIGN_PICKUP_AGENT",
  "ESCALATE_TO_PICKUP_MANAGER",
  "ESCALATE_TO_QC_MANAGER",
  "ESCALATE_TO_REFUND_TEAM",
  "ESCALATE_TO_SUPPORT",
  "HOLD_REFUND",
  "RELEASE_REFUND",
  "CREATE_SUPPORT_TICKET",
  "SEND_CUSTOMER_NOTIFICATION",
  "SEND_SELLER_NOTIFICATION",
  "MOVE_TO_PRIORITY_QUEUE",
  "BLOCK_AUTO_APPROVAL",
  "AUTO_CLOSE_LOW_RISK_CASE"
];

const priorityOptions: ReturnLogisticsAutomationRulePriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL"
];

const targetTeamOptions: TargetTeam[] = [
  "PICKUP_TEAM",
  "QC_TEAM",
  "WAREHOUSE_TEAM",
  "REFUND_TEAM",
  "SUPPORT_TEAM",
  "ADMIN_TEAM",
  "SYSTEM"
];

const emptyDraft: ReturnLogisticsAutomationRuleDraft = {
  ruleName: "",
  description: "",
  trigger: "RETURN_CREATED",
  action: "MOVE_TO_PRIORITY_QUEUE",
  priority: "MEDIUM",
  status: "INACTIVE",
  conditions: [],
  targetTeam: "ADMIN_TEAM",
  stopFurtherRules: false,
  requiresAudit: true
};

const formatLabel = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const parseConditionText = (
  conditionText: string
): ReturnLogisticsAutomationCondition[] => {
  if (!conditionText.trim()) {
    return [];
  }

  return conditionText
    .split(";")
    .map((condition) => condition.trim())
    .filter(Boolean)
    .map((condition) => {
      const [field = "", operator = "EQUALS", value = ""] =
        condition.split(":");

      const parsedValue = value.includes("|")
        ? value
            .split("|")
            .map((item) => item.trim())
            .filter(Boolean)
        : Number.isNaN(Number(value))
          ? value.trim()
          : Number(value);

      return {
        id: `COND-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        field: field.trim(),
        operator:
          operator.trim() as ReturnLogisticsAutomationCondition["operator"],
        value: parsedValue
      };
    });
};

const AdminReturnLogisticsAutomationRulesPage = () => {
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<ReturnLogisticsAutomationDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] =
    useState<PriorityFilter>("ALL");

  const [draft, setDraft] =
    useState<ReturnLogisticsAutomationRuleDraft>(emptyDraft);
  const [conditionText, setConditionText] = useState<string>("");

  const [importType, setImportType] = useState<"CSV" | "JSON">("CSV");
  const [importContent, setImportContent] = useState<string>("");

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const data =
        await returnLogisticsAutomationRuleService.getDashboardData();

      setDashboardData(data);
    } catch {
      showToast(
        "Automation rules failed",
        "Unable to load return logistics automation rules.",
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const filteredRules = useMemo(() => {
    const rules = dashboardData?.rules ?? [];
    const normalizedSearch = searchText.trim().toLowerCase();

    return rules.filter((rule) => {
      const searchableText = [
        rule.ruleId,
        rule.ruleName,
        rule.description,
        rule.trigger,
        rule.action,
        rule.priority,
        rule.status,
        rule.targetTeam
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" || rule.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || rule.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [dashboardData, searchText, statusFilter, priorityFilter]);

  const handleCreateRule = async (): Promise<void> => {
    if (!draft.ruleName.trim()) {
      showToast("Validation failed", "Rule name is required.", "warning");
      return;
    }

    try {
      setIsSaving(true);

      await returnLogisticsAutomationRuleService.createRule({
        ...draft,
        conditions: parseConditionText(conditionText)
      });

      setDraft(emptyDraft);
      setConditionText("");
      await loadDashboard();

      showToast("Rule created", "Automation rule was created.", "success");
    } catch {
      showToast("Create failed", "Unable to create automation rule.", "danger");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (
    rule: ReturnLogisticsAutomationRule
  ): Promise<void> => {
    try {
      await returnLogisticsAutomationRuleService.updateRule(rule, {
        status: rule.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
      });

      await loadDashboard();
      showToast("Rule updated", "Rule status updated.", "success");
    } catch {
      showToast("Update failed", "Unable to update rule status.", "danger");
    }
  };

  const handleCloneRule = async (
    rule: ReturnLogisticsAutomationRule
  ): Promise<void> => {
    try {
      await returnLogisticsAutomationRuleService.cloneRule(rule);
      await loadDashboard();
      showToast("Rule cloned", "Rule cloned as inactive.", "success");
    } catch {
      showToast("Clone failed", "Unable to clone rule.", "danger");
    }
  };

  const handleDeleteRule = async (
    rule: ReturnLogisticsAutomationRule
  ): Promise<void> => {
    try {
      await returnLogisticsAutomationRuleService.deleteRule(rule);
      await loadDashboard();
      showToast("Rule deleted", "Automation rule deleted.", "success");
    } catch {
      showToast("Delete failed", "Unable to delete rule.", "danger");
    }
  };

  const handleBulkImport = async (): Promise<void> => {
    if (!importContent.trim()) {
      showToast("Import failed", "Paste CSV or JSON content.", "warning");
      return;
    }

    try {
      setIsSaving(true);

      const result =
        await returnLogisticsAutomationRuleService.bulkImportRules(
          importContent,
          importType
        );

      await loadDashboard();

      showToast(
        "Import completed",
        `${result.importedCount} imported, ${result.skippedCount} skipped.`,
        result.importedCount > 0 ? "success" : "warning"
      );

      if (result.errors.length > 0) {
        console.warn("Return logistics automation import errors:", result.errors);
      }

      setImportContent("");
    } catch {
      showToast("Import failed", "Unable to import rules.", "danger");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportFile = async (file: File | undefined): Promise<void> => {
    if (!file) {
      return;
    }

    const content = await file.text();
    setImportContent(content);

    if (file.name.toLowerCase().endsWith(".json")) {
      setImportType("JSON");
    }

    if (file.name.toLowerCase().endsWith(".csv")) {
      setImportType("CSV");
    }
  };

  if (isLoading || !dashboardData) {
    return (
      <main className="admin-return-logistics-automation-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading return logistics automation rules..." />
        </div>
      </main>
    );
  }

  return (
    <main className="admin-return-logistics-automation-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <span className="badge rounded-pill text-bg-primary mb-2">
            Phase 12U
          </span>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <h1 className="fw-bold mb-1">
              Return + Logistics Automation Rules Engine
            </h1>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm mb-1"
              disabled={isSaving}
              onClick={() => void loadDashboard()}
            >
              <i className="bi bi-arrow-clockwise me-2" />
              Refresh
            </button>
          </div>

          <p className="text-muted mb-0">
            Configure logistics automation for return pickup, QC, refund,
            escalation, agent reassignment, and priority queue workflows.
          </p>
        </div>
      </section>

      <section className="container-fluid py-4">
        <ReturnLogisticsAutomationSummaryCards
          summary={dashboardData.summary}
        />

        <ReturnLogisticsAutomationCharts summary={dashboardData.summary} />

        <div className="row g-4 mb-4">
          <div className="col-12 col-xl-5">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3">Create Rule</h5>

                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">Rule Name</label>
                    <input
                      className="form-control"
                      value={draft.ruleName}
                      placeholder="e.g., Escalated QC Reassignment"
                      onChange={(event) =>
                        setDraft((previous) => ({
                          ...previous,
                          ruleName: event.target.value
                        }))
                      }
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Description
                    </label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={draft.description}
                      placeholder="Brief overview of rule triggering logic..."
                      onChange={(event) =>
                        setDraft((previous) => ({
                          ...previous,
                          description: event.target.value
                        }))
                      }
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Trigger</label>
                    <select
                      className="form-select"
                      value={draft.trigger}
                      onChange={(event) =>
                        setDraft((previous) => ({
                          ...previous,
                          trigger:
                            event.target
                              .value as ReturnLogisticsAutomationTrigger
                        }))
                      }
                    >
                      {triggerOptions.map((trigger) => (
                        <option value={trigger} key={trigger}>
                          {formatLabel(trigger)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Action</label>
                    <select
                      className="form-select"
                      value={draft.action}
                      onChange={(event) =>
                        setDraft((previous) => ({
                          ...previous,
                          action:
                            event.target
                              .value as ReturnLogisticsAutomationAction
                        }))
                      }
                    >
                      {actionOptions.map((action) => (
                        <option value={action} key={action}>
                          {formatLabel(action)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Priority</label>
                    <select
                      className="form-select"
                      value={draft.priority}
                      onChange={(event) =>
                        setDraft((previous) => ({
                          ...previous,
                          priority:
                            event.target
                              .value as ReturnLogisticsAutomationRulePriority
                        }))
                      }
                    >
                      {priorityOptions.map((priority) => (
                        <option value={priority} key={priority}>
                          {formatLabel(priority)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Status</label>
                    <select
                      className="form-select"
                      value={draft.status}
                      onChange={(event) =>
                        setDraft((previous) => ({
                          ...previous,
                          status:
                            event.target
                              .value as ReturnLogisticsAutomationRuleStatus
                        }))
                      }
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Target Team
                    </label>
                    <select
                      className="form-select"
                      value={draft.targetTeam}
                      onChange={(event) =>
                        setDraft((previous) => ({
                          ...previous,
                          targetTeam: event.target.value as TargetTeam
                        }))
                      }
                    >
                      {targetTeamOptions.map((team) => (
                        <option value={team} key={team}>
                          {formatLabel(team)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Conditions
                    </label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={conditionText}
                      placeholder="Example: breachedHours:GREATER_THAN:8;stage:EQUALS:PICKUP"
                      onChange={(event) => setConditionText(event.target.value)}
                    />
                    <div className="form-text">
                      Format: field:operator:value; anotherField:operator:value
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-check">
                      <input
                        id="stopFurtherRules"
                        className="form-check-input"
                        type="checkbox"
                        checked={draft.stopFurtherRules}
                        onChange={(event) =>
                          setDraft((previous) => ({
                            ...previous,
                            stopFurtherRules: event.target.checked
                          }))
                        }
                      />
                      <label
                        htmlFor="stopFurtherRules"
                        className="form-check-label"
                      >
                        Stop further rules
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-check">
                      <input
                        id="requiresAudit"
                        className="form-check-input"
                        type="checkbox"
                        checked={draft.requiresAudit}
                        onChange={(event) =>
                          setDraft((previous) => ({
                            ...previous,
                            requiresAudit: event.target.checked
                          }))
                        }
                      />
                      <label
                        htmlFor="requiresAudit"
                        className="form-check-label"
                      >
                        Requires audit
                      </label>
                    </div>
                  </div>

                  <div className="col-12">
                    <button
                      type="button"
                      className="btn btn-primary w-100"
                      disabled={isSaving}
                      onClick={() => void handleCreateRule()}
                    >
                      {isSaving ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          />
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-plus-circle me-2" />
                          Create Rule
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-7">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3">Bulk Rule Import</h5>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Import Type</label>
                    <select
                      className="form-select"
                      value={importType}
                      onChange={(event) =>
                        setImportType(event.target.value as "CSV" | "JSON")
                      }
                    >
                      <option value="CSV">CSV</option>
                      <option value="JSON">JSON</option>
                    </select>
                  </div>

                  <div className="col-md-8">
                    <label className="form-label fw-semibold">
                      Upload File
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".csv,.json"
                      onChange={(event) =>
                        void handleImportFile(event.target.files?.[0])
                      }
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Paste Import Content
                    </label>
                    <textarea
                      className="form-control font-monospace"
                      rows={8}
                      value={importContent}
                      onChange={(event) => setImportContent(event.target.value)}
                      placeholder={
                        importType === "CSV"
                          ? "ruleName,description,trigger,action,priority,status,conditions,targetTeam,stopFurtherRules,requiresAudit"
                          : '[{"ruleName":"Escalate delayed pickups","description":"Escalate pickup SLA breaches","trigger":"PICKUP_DELAYED","action":"ESCALATE_TO_PICKUP_MANAGER","priority":"HIGH","status":"ACTIVE","conditions":[],"targetTeam":"PICKUP_TEAM","stopFurtherRules":true,"requiresAudit":true}]'
                      }
                    />
                  </div>

                  <div className="col-12 d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      disabled={isSaving}
                      onClick={() => void handleBulkImport()}
                    >
                      {isSaving ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          />
                          Importing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-upload me-2" />
                          Import Rules
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setImportContent("")}
                    >
                      Clear Import Content
                    </button>
                  </div>
                </div>

                <div className="alert alert-light border mt-3 mb-0">
                  <strong>CSV condition example:</strong>
                  <div className="small font-monospace mt-1">
                    breachedHours:GREATER_THAN:8;stage:EQUALS:PICKUP
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-5">
              <label className="form-label fw-semibold">Search</label>
              <input
                className="form-control"
                value={searchText}
                placeholder="Search rule, trigger, action, team..."
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-semibold">Priority</label>
              <select
                className="form-select"
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(event.target.value as PriorityFilter)
                }
              >
                <option value="ALL">All Priorities</option>
                {priorityOptions.map((priority) => (
                  <option value={priority} key={priority}>
                    {formatLabel(priority)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-lg-1 d-flex justify-content-lg-end">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={
                  !searchText &&
                  statusFilter === "ALL" &&
                  priorityFilter === "ALL"
                }
                onClick={() => {
                  setSearchText("");
                  setStatusFilter("ALL");
                  setPriorityFilter("ALL");
                }}
              >
                <i className="bi bi-x-circle" />
              </button>
            </div>
          </div>
        </div>

        <ReturnLogisticsAutomationRulesTable
          rules={filteredRules}
          onToggleStatus={(rule) => void handleToggleStatus(rule)}
          onCloneRule={(rule) => void handleCloneRule(rule)}
          onDeleteRule={(rule) => void handleDeleteRule(rule)}
        />

        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Rule Change Audit Trail</h5>
            <p className="small text-muted mb-3">
              Tracks create, update, status change, clone, delete, and bulk
              import actions.
            </p>

            {dashboardData.auditLogs.length === 0 ? (
              <div className="alert alert-light border mb-0">
                No audit log records available.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Audit</th>
                      <th>Rule</th>
                      <th>Action</th>
                      <th>Details</th>
                      <th>Changed By</th>
                      <th>Changed At</th>
                    </tr>
                  </thead>

                  <tbody>
                    {dashboardData.auditLogs.slice(0, 30).map(
                      (log: ReturnLogisticsAutomationAuditLog) => (
                        <tr key={log.id}>
                          <td>
                            <div className="fw-semibold text-dark">{log.auditId}</div>
                            <div className="small text-muted font-monospace">{log.id}</div>
                          </td>

                          <td>
                            <div className="fw-medium">{log.ruleName}</div>
                            <div className="small text-muted font-monospace">{log.ruleId}</div>
                          </td>

                          <td>
                            <span className="badge text-bg-light border text-dark">
                              {formatLabel(log.action)}
                            </span>
                          </td>

                          <td>{log.details}</td>

                          <td>{log.changedBy}</td>

                          <td className="small text-muted">
                            {new Date(log.changedAt).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdminReturnLogisticsAutomationRulesPage;