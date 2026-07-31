import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import Pagination from "../../components/common/Pagination";
import { useToast } from "../../context/useToast";
import { returnAutomationRuleService } from "../../services/returnAutomationRuleService";
import type {
  ReturnAutomationRule,
  ReturnAutomationRuleAction,
  ReturnAutomationRuleAuditLog,
  ReturnAutomationRuleCondition,
  ReturnAutomationRuleDraft,
  ReturnAutomationRulePriority,
  ReturnAutomationRuleStatus,
  ReturnAutomationRuleTrigger
} from "../../types/returnAutomationRules";

type StatusFilter = "ALL" | ReturnAutomationRuleStatus;
type PriorityFilter = "ALL" | ReturnAutomationRulePriority;

const pageSizeOptions = [5, 10, 20, 50];

const triggerOptions: ReturnAutomationRuleTrigger[] = [
  "LOW_RISK_RETURN",
  "HIGH_RISK_CUSTOMER",
  "HIGH_RISK_PRODUCT",
  "HIGH_RISK_SELLER",
  "QC_PASSED",
  "QC_FAILED",
  "REFUND_AMOUNT_LIMIT",
  "RETURN_REASON_MATCH",
  "SLA_BREACH",
  "SELLER_DISPUTE_APPROVED",
  "FRAUD_PATTERN_DETECTED"
];

const actionOptions: ReturnAutomationRuleAction[] = [
  "AUTO_APPROVE_RETURN",
  "AUTO_REJECT_RETURN",
  "HOLD_REFUND",
  "RELEASE_REFUND",
  "FLAG_FRAUD_REVIEW",
  "REQUIRE_MANUAL_REVIEW",
  "AUTO_RESTOCK",
  "MOVE_TO_DAMAGED_INVENTORY",
  "HOLD_SELLER_PAYOUT",
  "ESCALATE_SLA"
];

const priorityOptions: ReturnAutomationRulePriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL"
];

const emptyDraft: ReturnAutomationRuleDraft = {
  ruleName: "",
  description: "",
  trigger: "LOW_RISK_RETURN",
  action: "REQUIRE_MANUAL_REVIEW",
  priority: "MEDIUM",
  status: "INACTIVE",
  conditions: [],
  stopFurtherRules: false,
  requiresAudit: true
};

const formatLabel = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getStatusBadgeClass = (status: ReturnAutomationRuleStatus): string => {
  return status === "ACTIVE" ? "text-bg-success" : "text-bg-secondary";
};

const getPriorityBadgeClass = (
  priority: ReturnAutomationRulePriority
): string => {
  if (priority === "CRITICAL") {
    return "text-bg-danger";
  }

  if (priority === "HIGH") {
    return "text-bg-warning text-dark";
  }

  if (priority === "MEDIUM") {
    return "text-bg-info";
  }

  return "text-bg-success";
};

const conditionToText = (condition: ReturnAutomationRuleCondition): string => {
  const value = Array.isArray(condition.value)
    ? condition.value.join("|")
    : String(condition.value);

  return `${condition.field}:${condition.operator}:${value}`;
};

const AdminReturnAutomationRulesPage = () => {
  const { showToast } = useToast();

  const [rules, setRules] = useState<ReturnAutomationRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<ReturnAutomationRuleAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] =
    useState<PriorityFilter>("ALL");

  const [draft, setDraft] = useState<ReturnAutomationRuleDraft>(emptyDraft);
  const [conditionText, setConditionText] = useState<string>("");

  const [importType, setImportType] = useState<"CSV" | "JSON">("CSV");
  const [importContent, setImportContent] = useState<string>("");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const [ruleData, auditData] = await Promise.all([
        returnAutomationRuleService.getRules(),
        returnAutomationRuleService.getAuditLogs()
      ]);

      setRules(ruleData);
      setAuditLogs(auditData);
    } catch {
      showToast(
        "Automation rules failed",
        "Unable to load return automation rules.",
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredRules = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return rules.filter((rule) => {
      const searchableText = [
        rule.ruleId,
        rule.ruleName,
        rule.description,
        rule.trigger,
        rule.action,
        rule.priority,
        rule.status
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
  }, [rules, searchText, statusFilter, priorityFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter, priorityFilter, pageSize]);

  const totalPages = Math.max(Math.ceil(filteredRules.length / pageSize), 1);

  const paginatedRules = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRules.slice(startIndex, startIndex + pageSize);
  }, [filteredRules, currentPage, pageSize]);

  const startItem =
    filteredRules.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, filteredRules.length);

  const parseConditionInput = (): ReturnAutomationRuleCondition[] => {
    if (!conditionText.trim()) {
      return [];
    }

    return conditionText
      .split(";")
      .map((condition) => condition.trim())
      .filter(Boolean)
      .map((condition) => {
        const [field = "", operator = "EQUALS", rawValue = ""] =
          condition.split(":");

        const trimmedValue = rawValue.trim();

        let parsedValue: ReturnAutomationRuleCondition["value"];

        if (trimmedValue.includes("|")) {
          parsedValue = trimmedValue
            .split("|")
            .map((item) => item.trim())
            .filter(Boolean);
        } else if (trimmedValue !== "" && !Number.isNaN(Number(trimmedValue))) {
          parsedValue = Number(trimmedValue);
        } else {
          parsedValue = trimmedValue;
        }

        return {
          field: field.trim(),
          operator:
            operator.trim() as ReturnAutomationRuleCondition["operator"],
          value: parsedValue
        };
      });
  };

  const handleCreateRule = async (): Promise<void> => {
    if (!draft.ruleName.trim()) {
      showToast("Validation failed", "Rule name is required.", "warning");
      return;
    }

    try {
      setIsSaving(true);

      const createdRule = await returnAutomationRuleService.createRule({
        ...draft,
        conditions: parseConditionInput()
      });

      setRules((previousRules) => [createdRule, ...previousRules]);
      setDraft(emptyDraft);
      setConditionText("");

      await loadData();

      showToast(
        "Rule created",
        `Rule "${createdRule.ruleName}" was created.`,
        "success"
      );
    } catch {
      showToast(
        "Rule creation failed",
        "Unable to create automation rule.",
        "danger"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (
    rule: ReturnAutomationRule
  ): Promise<void> => {
    try {
      const nextStatus: ReturnAutomationRuleStatus =
        rule.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

      const updatedRule = await returnAutomationRuleService.updateRule(rule, {
        status: nextStatus
      });

      setRules((previousRules) =>
        previousRules.map((item) =>
          item.id === updatedRule.id ? updatedRule : item
        )
      );

      await loadData();

      showToast(
        "Rule status updated",
        `Rule "${updatedRule.ruleName}" is now ${nextStatus}.`,
        "success"
      );
    } catch {
      showToast(
        "Status update failed",
        "Unable to update rule status.",
        "danger"
      );
    }
  };

  const handleCloneRule = async (rule: ReturnAutomationRule): Promise<void> => {
    try {
      const clonedRule = await returnAutomationRuleService.cloneRule(rule);

      setRules((previousRules) => [clonedRule, ...previousRules]);

      await loadData();

      showToast(
        "Rule cloned",
        `Rule "${rule.ruleName}" was cloned successfully.`,
        "success"
      );
    } catch {
      showToast("Clone failed", "Unable to clone rule.", "danger");
    }
  };

  const handleDeleteRule = async (rule: ReturnAutomationRule): Promise<void> => {
    try {
      await returnAutomationRuleService.deleteRule(rule);

      setRules((previousRules) =>
        previousRules.filter((item) => item.id !== rule.id)
      );

      await loadData();

      showToast(
        "Rule deleted",
        `Rule "${rule.ruleName}" was deleted.`,
        "success"
      );
    } catch {
      showToast("Delete failed", "Unable to delete rule.", "danger");
    }
  };

  const handleBulkImport = async (): Promise<void> => {
    if (!importContent.trim()) {
      showToast(
        "Import failed",
        "Please paste CSV or JSON content before importing.",
        "warning"
      );
      return;
    }

    try {
      setIsSaving(true);

      const result = await returnAutomationRuleService.bulkImportRules(
        importContent,
        importType
      );

      await loadData();

      showToast(
        "Bulk import completed",
        `${result.importedCount} imported, ${result.skippedCount} skipped.`,
        result.importedCount > 0 ? "success" : "warning"
      );

      if (result.errors.length > 0) {
        console.warn("Return automation import errors:", result.errors);
      }

      setImportContent("");
    } catch {
      showToast(
        "Import failed",
        "Unable to bulk import automation rules.",
        "danger"
      );
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

  if (isLoading) {
    return (
      <main className="admin-return-automation-rules-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading return automation rules..." />
        </div>
      </main>
    );
  }

  return (
    <main className="admin-return-automation-rules-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <span className="badge rounded-pill text-bg-primary mb-2">
            Phase 12Q
          </span>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <h1 className="fw-bold mb-1">
              Admin Return Automation Rules Engine
            </h1>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm mb-1"
              onClick={() => void loadData()}
            >
              <i className="bi bi-arrow-clockwise me-2" />
              Refresh
            </button>
          </div>

          <p className="text-muted mb-0">
            Configure return automation rules, clone existing rules, bulk import
            rule sets, and track every rule change through audit logs.
          </p>
        </div>
      </section>

      <section className="container-fluid py-4">
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
                            event.target.value as ReturnAutomationRuleTrigger
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
                            event.target.value as ReturnAutomationRuleAction
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
                            event.target.value as ReturnAutomationRulePriority
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
                            event.target.value as ReturnAutomationRuleStatus
                        }))
                      }
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
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
                      placeholder="Example: refundAmount:GREATER_THAN:10000;riskLevel:EQUALS:HIGH"
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
                      className="btn btn-primary"
                      disabled={isSaving}
                      onClick={() => void handleCreateRule()}
                    >
                      <i className="bi bi-plus-circle me-2" />
                      Create Rule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BULK IMPORT SECTION */}
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
                          ? "ruleName,description,trigger,action,priority,status,conditions,stopFurtherRules,requiresAudit"
                          : '[{"ruleName":"Hold high fraud refunds","description":"Hold refund if fraud pattern is detected","trigger":"FRAUD_PATTERN_DETECTED","action":"HOLD_REFUND","priority":"HIGH","status":"ACTIVE","conditions":[{"field":"riskLevel","operator":"EQUALS","value":"HIGH"}],"stopFurtherRules":true,"requiresAudit":true}]'
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
                      <i className="bi bi-upload me-2" />
                      Import Rules
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
                    refundAmount:GREATER_THAN:10000;riskLevel:EQUALS:HIGH
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER SECTION */}
        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-5">
              <label className="form-label fw-semibold">Search</label>
              <input
                className="form-control"
                value={searchText}
                placeholder="Search rule, trigger, action, priority..."
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

        {/* RULES TABLE */}
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Automation Rules</h5>
            <p className="small text-muted mb-3">
              Manage return automation rules. Use clone for faster rule
              creation and audit logs for compliance tracking.
            </p>

            {filteredRules.length === 0 ? (
              <EmptyState
                title="No automation rules found"
                message="No rules match the selected filters."
                iconClassName="bi bi-sliders text-primary"
              />
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Rule</th>
                        <th>Trigger</th>
                        <th>Action</th>
                        <th>Conditions</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Updated</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedRules.map((rule) => (
                        <tr key={rule.id}>
                          <td>
                            <div className="fw-semibold">{rule.ruleName}</div>
                            <div className="small text-muted">{rule.ruleId}</div>
                            <div className="small text-muted">
                              {rule.description || "No description"}
                            </div>
                          </td>

                          <td>{formatLabel(rule.trigger)}</td>

                          <td>{formatLabel(rule.action)}</td>

                          <td style={{ minWidth: 220 }}>
                            {rule.conditions.length === 0 ? (
                              <span className="small text-muted">
                                No conditions
                              </span>
                            ) : (
                              <ul className="small mb-0 ps-3">
                                {rule.conditions.slice(0, 3).map((condition, index) => (
                                  <li key={`${conditionToText(condition)}-${index}`}>
                                    {conditionToText(condition)}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>

                          <td>
                            <span
                              className={`badge ${getPriorityBadgeClass(
                                rule.priority
                              )}`}
                            >
                              {rule.priority}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`badge ${getStatusBadgeClass(
                                rule.status
                              )}`}
                            >
                              {rule.status}
                            </span>
                          </td>

                          <td className="small text-muted">
                            {new Date(rule.updatedAt).toLocaleString("en-IN")}
                          </td>

                          <td className="text-end">
                            <div className="d-flex flex-wrap justify-content-end gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => void handleToggleStatus(rule)}
                              >
                                {rule.status === "ACTIVE"
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => void handleCloneRule(rule)}
                              >
                                Clone
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => void handleDeleteRule(rule)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredRules.length}
                    pageSize={pageSize}
                    itemsPerPage={pageSize}
                    itemsPerPageOptions={pageSizeOptions}
                    startItem={startItem}
                    endItem={endItem}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(nextPageSize: number) => {
                      setPageSize(nextPageSize);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* AUDIT TRAIL */}
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Rule Change Audit Trail</h5>
            <p className="small text-muted mb-3">
              Every create, update, status change, clone, delete, and bulk
              import action is recorded here.
            </p>

            {auditLogs.length === 0 ? (
              <div className="alert alert-light border mb-0">
                No audit trail records available.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
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
                    {auditLogs.slice(0, 25).map((log) => (
                      <tr key={log.id}>
                        <td>
                          <div className="fw-semibold">{log.auditId}</div>
                          <div className="small text-muted">{log.id}</div>
                        </td>

                        <td>
                          <div>{log.ruleName}</div>
                          <div className="small text-muted">{log.ruleId}</div>
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
                    ))}
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

export default AdminReturnAutomationRulesPage;