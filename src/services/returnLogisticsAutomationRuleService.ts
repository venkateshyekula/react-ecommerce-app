import { apiClient } from "./apiClient";
import type {
  ReturnLogisticsAutomationAction,
  ReturnLogisticsAutomationAuditAction,
  ReturnLogisticsAutomationAuditLog,
  ReturnLogisticsAutomationCondition,
  ReturnLogisticsAutomationDashboardData,
  ReturnLogisticsAutomationImportResult,
  ReturnLogisticsAutomationRule,
  ReturnLogisticsAutomationRuleDraft,
  ReturnLogisticsAutomationSummary,
  ReturnLogisticsAutomationTrigger
} from "../types/returnLogisticsAutomationRule";

const RULES_ENDPOINT = "/returnLogisticsAutomationRules";
const AUDIT_ENDPOINT = "/returnLogisticsAutomationRuleAuditLogs";

const SYSTEM_USER = "Admin";

type UnknownRecord = Record<string, unknown>;

type TargetTeam = ReturnLogisticsAutomationRuleDraft["targetTeam"];

const VALID_TEAMS: TargetTeam[] = [
  "PICKUP_TEAM",
  "QC_TEAM",
  "WAREHOUSE_TEAM",
  "REFUND_TEAM",
  "SUPPORT_TEAM",
  "ADMIN_TEAM",
  "SYSTEM"
];

const parseTargetTeam = (rawTeam: unknown): TargetTeam => {
  const normalized = toText(rawTeam).toUpperCase().replace(/\s+/g, "_");

  // Map common CSV text inputs to the strictly typed team union
  if (normalized.includes("PICKUP")) return "PICKUP_TEAM";
  if (normalized.includes("QC")) return "QC_TEAM";
  if (normalized.includes("WAREHOUSE")) return "WAREHOUSE_TEAM";
  if (normalized.includes("REFUND")) return "REFUND_TEAM";
  if (normalized.includes("SUPPORT")) return "SUPPORT_TEAM";
  if (normalized.includes("ADMIN") || normalized.includes("OPERATIONS")) return "ADMIN_TEAM";
  if (normalized.includes("SYSTEM")) return "SYSTEM";

  // Check direct match
  if (VALID_TEAMS.includes(normalized as TargetTeam)) {
    return normalized as TargetTeam;
  }

  // Default fallback matching the expected union
  return "ADMIN_TEAM";
};

const safeArray = async <T>(endpoint: string): Promise<T[]> => {
  try {
    const data = await apiClient.get<T[]>(endpoint);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const createId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const normalizeText = (value: string): string => {
  return value.trim().toLowerCase();
};

const toText = (value: unknown): string => {
  return String(value ?? "").trim();
};

const toBoolean = (value: unknown, defaultValue: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  const text = toText(value).toLowerCase();

  if (text === "true") {
    return true;
  }

  if (text === "false") {
    return false;
  }

  return defaultValue;
};

const parseConditionValue = (rawValue: string): string | number | string[] => {
  const value = rawValue.trim();

  if (value.includes("|")) {
    return value
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const numberValue = Number(value);

  if (!Number.isNaN(numberValue) && value !== "") {
    return numberValue;
  }

  return value;
};

const parseConditionsFromText = (
  rawConditions: string
): ReturnLogisticsAutomationCondition[] => {
  if (!rawConditions.trim()) {
    return [];
  }

  return rawConditions
    .split(";")
    .map((text) => text.trim())
    .filter(Boolean)
    .map((conditionText) => {
      const [field = "", operator = "EQUALS", value = ""] =
        conditionText.split(":");

      return {
        id: createId("COND"),
        field: field.trim(),
        operator:
          operator.trim() as ReturnLogisticsAutomationCondition["operator"],
        value: parseConditionValue(value)
      };
    });
};

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let startValueIndex = 0;
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === ',' && !inQuotes) {
      let field = line.substring(startValueIndex, i).trim();
      if (field.startsWith('"') && field.endsWith('"')) {
        field = field.substring(1, field.length - 1).replace(/""/g, '"');
      }
      result.push(field.trim());
      startValueIndex = i + 1;
    }
  }

  let field = line.substring(startValueIndex).trim();
  if (field.startsWith('"') && field.endsWith('"')) {
    field = field.substring(1, field.length - 1).replace(/""/g, '"');
  }
  result.push(field.trim());

  return result;
};

const parseCsvRules = (content: string): ReturnLogisticsAutomationRuleDraft[] => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) =>
    normalizeText(header).replace(/\s+/g, "")
  );

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = new Map<string, string>();

    headers.forEach((header, index) => {
      row.set(header, values[index] ?? "");
    });

    return {
      ruleName: row.get("rulename") ?? "",
      description: row.get("description") ?? "",
      trigger: row.get("trigger") as ReturnLogisticsAutomationTrigger,
      action: row.get("action") as ReturnLogisticsAutomationAction,
      priority:
        (row.get("priority") as ReturnLogisticsAutomationRuleDraft["priority"]) ||
        "MEDIUM",
      status:
        (row.get("status") as ReturnLogisticsAutomationRuleDraft["status"]) ||
        "INACTIVE",
      conditions: parseConditionsFromText(row.get("conditions") ?? ""),
      targetTeam: parseTargetTeam(row.get("targetteam")), // Fixed string casting
      stopFurtherRules: toBoolean(row.get("stopfurtherrules"), false),
      requiresAudit: toBoolean(row.get("requiresaudit"), true)
    };
  });
};

const parseJsonRules = (
  content: string
): ReturnLogisticsAutomationRuleDraft[] => {
  const parsed = JSON.parse(content) as UnknownRecord[];

  if (!Array.isArray(parsed)) {
    throw new Error("JSON import must be an array.");
  }

  return parsed.map((item) => ({
    ruleName: toText(item.ruleName),
    description: toText(item.description),
    trigger: item.trigger as ReturnLogisticsAutomationTrigger,
    action: item.action as ReturnLogisticsAutomationAction,
    priority:
      (item.priority as ReturnLogisticsAutomationRuleDraft["priority"]) ||
      "MEDIUM",
    status:
      (item.status as ReturnLogisticsAutomationRuleDraft["status"]) ||
      "INACTIVE",
    conditions: Array.isArray(item.conditions)
      ? (item.conditions as ReturnLogisticsAutomationCondition[])
      : [],
    targetTeam: parseTargetTeam(item.targetTeam), // Fixed string casting
    stopFurtherRules: toBoolean(item.stopFurtherRules, false),
    requiresAudit: toBoolean(item.requiresAudit, true)
  }));
};

const validateDraft = (
  draft: ReturnLogisticsAutomationRuleDraft,
  index: number
): string[] => {
  const errors: string[] = [];

  if (!draft.ruleName || !draft.ruleName.trim()) {
    errors.push(`Row ${index + 1}: Rule name is required.`);
  }

  if (!draft.trigger) {
    errors.push(`Row ${index + 1}: Trigger is required.`);
  }

  if (!draft.action) {
    errors.push(`Row ${index + 1}: Action is required.`);
  }

  return errors;
};

const toRule = (
  draft: ReturnLogisticsAutomationRuleDraft
): ReturnLogisticsAutomationRule => {
  const now = new Date().toISOString();

  return {
    id: createId("RLAR"),
    ruleId: createId("RLOG"),
    ruleName: draft.ruleName.trim(),
    description: draft.description.trim(),

    trigger: draft.trigger,
    action: draft.action,
    priority: draft.priority,
    status: draft.status,

    conditions: draft.conditions,
    targetTeam: draft.targetTeam,
    stopFurtherRules: draft.stopFurtherRules,
    requiresAudit: draft.requiresAudit,

    executionCount: 0,
    successCount: 0,
    failureCount: 0,

    createdBy: SYSTEM_USER,
    createdAt: now,
    updatedAt: now
  };
};

const buildAuditLog = ({
  rule,
  action,
  details,
  beforeSnapshot,
  afterSnapshot
}: {
  rule: ReturnLogisticsAutomationRule;
  action: ReturnLogisticsAutomationAuditAction;
  details: string;
  beforeSnapshot?: ReturnLogisticsAutomationRule;
  afterSnapshot?: ReturnLogisticsAutomationRule;
}): ReturnLogisticsAutomationAuditLog => {
  return {
    id: createId("RLOGAUD"),
    auditId: createId("RLAA"),
    ruleId: rule.ruleId,
    ruleName: rule.ruleName,
    action,
    changedBy: SYSTEM_USER,
    changedAt: new Date().toISOString(),
    details,
    beforeSnapshot,
    afterSnapshot
  };
};

const createAuditLog = async ({
  rule,
  action,
  details,
  beforeSnapshot,
  afterSnapshot
}: {
  rule: ReturnLogisticsAutomationRule;
  action: ReturnLogisticsAutomationAuditAction;
  details: string;
  beforeSnapshot?: ReturnLogisticsAutomationRule;
  afterSnapshot?: ReturnLogisticsAutomationRule;
}): Promise<void> => {
  const auditLog = buildAuditLog({
    rule,
    action,
    details,
    beforeSnapshot,
    afterSnapshot
  });

  await apiClient.post<
    ReturnLogisticsAutomationAuditLog,
    ReturnLogisticsAutomationAuditLog
  >(AUDIT_ENDPOINT, auditLog);
};

const buildSummary = (
  rules: ReturnLogisticsAutomationRule[]
): ReturnLogisticsAutomationSummary => {
  const totalExecutions = rules.reduce(
    (total, rule) => total + rule.executionCount,
    0
  );

  const successCount = rules.reduce(
    (total, rule) => total + rule.successCount,
    0
  );

  const failureCount = rules.reduce(
    (total, rule) => total + rule.failureCount,
    0
  );

  const successRate =
    totalExecutions > 0
      ? Number(((successCount / totalExecutions) * 100).toFixed(2))
      : 0;

  const countTrigger = (keywords: string[]): number => {
    return rules.filter((rule) =>
      keywords.some(
        (keyword) =>
          rule.trigger.includes(keyword) || rule.action.includes(keyword)
      )
    ).length;
  };

  return {
    totalRules: rules.length,
    activeRules: rules.filter((rule) => rule.status === "ACTIVE").length,
    inactiveRules: rules.filter((rule) => rule.status === "INACTIVE").length,
    criticalRules: rules.filter((rule) => rule.priority === "CRITICAL").length,
    highPriorityRules: rules.filter((rule) => rule.priority === "HIGH").length,

    totalExecutions,
    successCount,
    failureCount,
    successRate,

    pickupRules: countTrigger(["PICKUP"]),
    qcRules: countTrigger(["QC"]),
    refundRules: countTrigger(["REFUND"]),
    escalationRules: countTrigger(["ESCALATE", "SLA"])
  };
};

export const returnLogisticsAutomationRuleService = {
  getDashboardData: async (): Promise<ReturnLogisticsAutomationDashboardData> => {
    const [rules, auditLogs] = await Promise.all([
      safeArray<ReturnLogisticsAutomationRule>(RULES_ENDPOINT),
      safeArray<ReturnLogisticsAutomationAuditLog>(AUDIT_ENDPOINT)
    ]);

    const priorityRank: Record<ReturnLogisticsAutomationRule["priority"], number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1
    };

    const sortedRules = [...rules].sort(
      (first, second) => priorityRank[second.priority] - priorityRank[first.priority]
    );

    const sortedAuditLogs = [...auditLogs].sort(
      (first, second) =>
        new Date(second.changedAt).getTime() -
        new Date(first.changedAt).getTime()
    );

    return {
      rules: sortedRules,
      auditLogs: sortedAuditLogs,
      summary: buildSummary(sortedRules)
    };
  },

  createRule: async (
    draft: ReturnLogisticsAutomationRuleDraft
  ): Promise<ReturnLogisticsAutomationRule> => {
    const rule = toRule(draft);

    const createdRule = await apiClient.post<
      ReturnLogisticsAutomationRule,
      ReturnLogisticsAutomationRule
    >(RULES_ENDPOINT, rule);

    await createAuditLog({
      rule: createdRule,
      action: "CREATED",
      details: `Rule "${createdRule.ruleName}" was created.`,
      afterSnapshot: createdRule
    });

    return createdRule;
  },

  updateRule: async (
    rule: ReturnLogisticsAutomationRule,
    patch: Partial<ReturnLogisticsAutomationRule>
  ): Promise<ReturnLogisticsAutomationRule> => {
    const updatedRule = await apiClient.patch<
      ReturnLogisticsAutomationRule,
      Partial<ReturnLogisticsAutomationRule>
    >(`${RULES_ENDPOINT}/${rule.id}`, {
      ...patch,
      updatedAt: new Date().toISOString()
    });

    await createAuditLog({
      rule: updatedRule,
      action:
        patch.status && patch.status !== rule.status
          ? "STATUS_CHANGED"
          : "UPDATED",
      details:
        patch.status && patch.status !== rule.status
          ? `Rule status changed from ${rule.status} to ${patch.status}.`
          : `Rule "${rule.ruleName}" was updated.`,
      beforeSnapshot: rule,
      afterSnapshot: updatedRule
    });

    return updatedRule;
  },

  deleteRule: async (
    rule: ReturnLogisticsAutomationRule
  ): Promise<void> => {
    // Create audit log before deleting resource to preserve reference
    await createAuditLog({
      rule,
      action: "DELETED",
      details: `Rule "${rule.ruleName}" was deleted.`,
      beforeSnapshot: rule
    });

    await apiClient.delete<void>(`${RULES_ENDPOINT}/${rule.id}`);
  },

  cloneRule: async (
    rule: ReturnLogisticsAutomationRule
  ): Promise<ReturnLogisticsAutomationRule> => {
    const now = new Date().toISOString();

    const clonedRule: ReturnLogisticsAutomationRule = {
      ...rule,
      id: createId("RLAR"),
      ruleId: createId("RLOG"),
      ruleName: `${rule.ruleName} Copy`,
      status: "INACTIVE",
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      createdBy: SYSTEM_USER,
      createdAt: now,
      updatedAt: now,
      lastExecutedAt: undefined
    };

    const createdClone = await apiClient.post<
      ReturnLogisticsAutomationRule,
      ReturnLogisticsAutomationRule
    >(RULES_ENDPOINT, clonedRule);

    await createAuditLog({
      rule: createdClone,
      action: "CLONED",
      details: `Rule "${rule.ruleName}" was cloned as "${createdClone.ruleName}".`,
      beforeSnapshot: rule,
      afterSnapshot: createdClone
    });

    return createdClone;
  },

  bulkImportRules: async (
    content: string,
    fileType: "CSV" | "JSON"
  ): Promise<ReturnLogisticsAutomationImportResult> => {
    const existingRules =
      await returnLogisticsAutomationRuleService.getDashboardData();

    const existingNames = new Set(
      existingRules.rules.map((rule) => normalizeText(rule.ruleName))
    );

    const drafts =
      fileType === "JSON" ? parseJsonRules(content) : parseCsvRules(content);

    const errors: string[] = [];
    let importedCount = 0;
    let skippedCount = 0;

    for (let index = 0; index < drafts.length; index += 1) {
      const draft = drafts[index];
      const validationErrors = validateDraft(draft, index);

      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
        skippedCount += 1;
        continue;
      }

      if (existingNames.has(normalizeText(draft.ruleName))) {
        errors.push(`Row ${index + 1}: Duplicate rule name "${draft.ruleName}".`);
        skippedCount += 1;
        continue;
      }

      const rule = toRule(draft);

      const createdRule = await apiClient.post<
        ReturnLogisticsAutomationRule,
        ReturnLogisticsAutomationRule
      >(RULES_ENDPOINT, rule);

      await createAuditLog({
        rule: createdRule,
        action: "BULK_IMPORTED",
        details: `Rule "${createdRule.ruleName}" was imported through bulk import.`,
        afterSnapshot: createdRule
      });

      existingNames.add(normalizeText(createdRule.ruleName));
      importedCount += 1;
    }

    return {
      importedCount,
      skippedCount,
      errors
    };
  }
};