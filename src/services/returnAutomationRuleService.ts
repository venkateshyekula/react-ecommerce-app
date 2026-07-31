import { apiClient } from "./apiClient";
import type {
  ReturnAutomationAuditAction,
  ReturnAutomationRule,
  ReturnAutomationRuleAuditLog,
  ReturnAutomationRuleCondition,
  ReturnAutomationRuleDraft,
  ReturnAutomationRuleImportResult
} from "../types/returnAutomationRules";

const RULES_ENDPOINT = "/returnAutomationRules";
const AUDIT_ENDPOINT = "/returnAutomationRuleAuditLogs";

const SYSTEM_USER = "Admin";

const createId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const normalizeText = (value: string): string => {
  return value.trim().toLowerCase();
};

const safeGetArray = async <T>(endpoint: string): Promise<T[]> => {
  try {
    // Single generic parameter for GET
    const response = await apiClient.get<T[]>(endpoint);
    return Array.isArray(response) ? response : [];
  } catch {
    return [];
  }
};

const buildAuditLog = ({
  rule,
  action,
  details,
  beforeSnapshot,
  afterSnapshot
}: {
  rule: ReturnAutomationRule;
  action: ReturnAutomationAuditAction;
  details: string;
  beforeSnapshot?: ReturnAutomationRule;
  afterSnapshot?: ReturnAutomationRule;
}): ReturnAutomationRuleAuditLog => {
  return {
    id: createId("AUDIT"),
    auditId: createId("RAUD"),
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
  rule: ReturnAutomationRule;
  action: ReturnAutomationAuditAction;
  details: string;
  beforeSnapshot?: ReturnAutomationRule;
  afterSnapshot?: ReturnAutomationRule;
}): Promise<void> => {
  try {
    const auditLog = buildAuditLog({
      rule,
      action,
      details,
      beforeSnapshot,
      afterSnapshot
    });

    // Two generic parameters for POST (Response, Body)
    await apiClient.post<ReturnAutomationRuleAuditLog, ReturnAutomationRuleAuditLog>(
      AUDIT_ENDPOINT,
      auditLog
    );
  } catch (error) {
    // Non-blocking: log audit failures so primary rule operations are preserved
    console.warn("Failed to create audit log entry:", error);
  }
};

const parseConditionValue = (rawValue: string): string | number | string[] => {
  const trimmedValue = rawValue.trim();

  if (trimmedValue.includes("|")) {
    return trimmedValue.split("|").map((item) => item.trim()).filter(Boolean);
  }

  const numberValue = Number(trimmedValue);

  if (!Number.isNaN(numberValue) && trimmedValue !== "") {
    return numberValue;
  }

  return trimmedValue;
};

const parseConditionsFromCsvValue = (
  rawConditions: string
): ReturnAutomationRuleCondition[] => {
  if (!rawConditions.trim()) {
    return [];
  }

  return rawConditions
    .split(";")
    .map((conditionText) => conditionText.trim())
    .filter(Boolean)
    .map((conditionText) => {
      const [field = "", operator = "EQUALS", value = ""] =
        conditionText.split(":");

      return {
        field: field.trim(),
        operator: operator.trim() as ReturnAutomationRuleCondition["operator"],
        value: parseConditionValue(value)
      };
    });
};

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  result.push(current.trim());

  return result;
};

const parseCsvRules = (content: string): ReturnAutomationRuleDraft[] => {
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
      trigger: row.get("trigger") as ReturnAutomationRuleDraft["trigger"],
      action: row.get("action") as ReturnAutomationRuleDraft["action"],
      priority:
        (row.get("priority") as ReturnAutomationRuleDraft["priority"]) ??
        "MEDIUM",
      status:
        (row.get("status") as ReturnAutomationRuleDraft["status"]) ??
        "INACTIVE",
      conditions: parseConditionsFromCsvValue(row.get("conditions") ?? ""),
      stopFurtherRules: (row.get("stopfurtherrules") ?? "false") === "true",
      requiresAudit: (row.get("requiresaudit") ?? "true") !== "false"
    };
  });
};

const parseJsonRules = (content: string): ReturnAutomationRuleDraft[] => {
  const parsed = JSON.parse(content);

  if (!Array.isArray(parsed)) {
    throw new Error("JSON import must be an array of rules.");
  }

  return parsed.map((item) => ({
    ruleName: String(item.ruleName ?? ""),
    description: String(item.description ?? ""),
    trigger: item.trigger,
    action: item.action,
    priority: item.priority ?? "MEDIUM",
    status: item.status ?? "INACTIVE",
    conditions: Array.isArray(item.conditions) ? item.conditions : [],
    stopFurtherRules: Boolean(item.stopFurtherRules),
    requiresAudit: item.requiresAudit !== false
  }));
};

const validateDraft = (
  draft: ReturnAutomationRuleDraft,
  index: number
): string[] => {
  const errors: string[] = [];

  if (!draft.ruleName.trim()) {
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

const toRule = (draft: ReturnAutomationRuleDraft): ReturnAutomationRule => {
  const now = new Date().toISOString();

  return {
    id: createId("RULE"),
    ruleId: createId("RAR"),
    ruleName: draft.ruleName.trim(),
    description: draft.description.trim(),
    trigger: draft.trigger,
    action: draft.action,
    priority: draft.priority,
    status: draft.status,
    conditions: draft.conditions,
    stopFurtherRules: draft.stopFurtherRules,
    requiresAudit: draft.requiresAudit,
    createdBy: SYSTEM_USER,
    createdAt: now,
    updatedAt: now
  };
};

export const returnAutomationRuleService = {
  getRules: async (): Promise<ReturnAutomationRule[]> => {
    const rules = await safeGetArray<ReturnAutomationRule>(RULES_ENDPOINT);

    return rules.sort((first, second) => {
      const priorityOrder = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1
      };

      return priorityOrder[second.priority] - priorityOrder[first.priority];
    });
  },

  getAuditLogs: async (): Promise<ReturnAutomationRuleAuditLog[]> => {
    const logs = await safeGetArray<ReturnAutomationRuleAuditLog>(
      AUDIT_ENDPOINT
    );

    return logs.sort(
      (first, second) =>
        new Date(second.changedAt).getTime() -
        new Date(first.changedAt).getTime()
    );
  },

  createRule: async (
    draft: ReturnAutomationRuleDraft
  ): Promise<ReturnAutomationRule> => {
    const rule = toRule(draft);

    const createdRule = await apiClient.post<ReturnAutomationRule, ReturnAutomationRule>(
      RULES_ENDPOINT,
      rule
    );

    await createAuditLog({
      rule: createdRule,
      action: "CREATED",
      details: `Rule "${createdRule.ruleName}" was created.`,
      afterSnapshot: createdRule
    });

    return createdRule;
  },

  updateRule: async (
    rule: ReturnAutomationRule,
    patch: Partial<ReturnAutomationRule>
  ): Promise<ReturnAutomationRule> => {
    const updatedRule = await apiClient.patch<
      ReturnAutomationRule,
      Partial<ReturnAutomationRule>
    >(`${RULES_ENDPOINT}/${rule.id}`, {
      ...patch,
      updatedAt: new Date().toISOString()
    });

    await createAuditLog({
      rule: updatedRule,
      action: patch.status && patch.status !== rule.status ? "STATUS_CHANGED" : "UPDATED",
      details:
        patch.status && patch.status !== rule.status
          ? `Rule status changed from ${rule.status} to ${patch.status}.`
          : `Rule "${rule.ruleName}" was updated.`,
      beforeSnapshot: rule,
      afterSnapshot: updatedRule
    });

    return updatedRule;
  },

  deleteRule: async (rule: ReturnAutomationRule): Promise<void> => {
    // Single generic parameter for DELETE
    await apiClient.delete<void>(`${RULES_ENDPOINT}/${rule.id}`);

    await createAuditLog({
      rule,
      action: "DELETED",
      details: `Rule "${rule.ruleName}" was deleted.`,
      beforeSnapshot: rule
    });
  },

  cloneRule: async (rule: ReturnAutomationRule): Promise<ReturnAutomationRule> => {
    const clonedRule: ReturnAutomationRule = {
      ...rule,
      id: createId("RULE"),
      ruleId: createId("RAR"),
      ruleName: `${rule.ruleName} Copy`,
      status: "INACTIVE",
      createdBy: SYSTEM_USER,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const createdClone = await apiClient.post<ReturnAutomationRule, ReturnAutomationRule>(
      RULES_ENDPOINT,
      clonedRule
    );

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
  ): Promise<ReturnAutomationRuleImportResult> => {
    let drafts: ReturnAutomationRuleDraft[] = [];

    try {
      drafts =
        fileType === "JSON" ? parseJsonRules(content) : parseCsvRules(content);
    } catch (error) {
      return {
        importedCount: 0,
        skippedCount: 0,
        errors: [
          error instanceof Error
            ? error.message
            : "Failed to parse import content."
        ]
      };
    }

    const existingRules =
      await returnAutomationRuleService.getRules();

    const existingNames = new Set(
      existingRules.map((rule) => normalizeText(rule.ruleName))
    );

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

      const createdRule = await apiClient.post<ReturnAutomationRule, ReturnAutomationRule>(
        RULES_ENDPOINT,
        rule
      );

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