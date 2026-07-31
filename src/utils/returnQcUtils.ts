import type { ReturnRequest } from "../types/returnRequest";
import type {
  ReturnItemConditionGrade,
  ReturnQcChecklistResult,
  ReturnQcEvidenceFormState,
  ReturnQcEvidenceMatchStatus,
  ReturnQcInspection,
  ReturnQcStatus,
} from "../types/returnQc";

export const returnConditionGradeOptions: Array<{
  value: ReturnItemConditionGrade;
  label: string;
  refundEligible: boolean;
}> = [
  {
    value: "SELLABLE",
    label: "Sellable",
    refundEligible: true,
  },
  {
    value: "OPEN_BOX",
    label: "Open Box",
    refundEligible: true,
  },
  {
    value: "MINOR_DAMAGE",
    label: "Minor Damage",
    refundEligible: true,
  },
  {
    value: "MAJOR_DAMAGE",
    label: "Major Damage",
    refundEligible: false,
  },
  {
    value: "MISSING_ACCESSORY",
    label: "Missing Accessory",
    refundEligible: false,
  },
  {
    value: "WRONG_ITEM",
    label: "Wrong Item",
    refundEligible: false,
  },
  {
    value: "USED_OR_TAMPERED",
    label: "Used / Tampered",
    refundEligible: false,
  },
  {
    value: "NOT_RECEIVED",
    label: "Not Received",
    refundEligible: false,
  },
];

export const generateReturnQcDbId = (): string => {
  return `return-qc-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

export const generateReturnQcInspectionId = (): string => {
  const now = new Date();

  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  return `QC-RET-${datePart}-${Date.now()}`;
};

export const formatReturnQcLabel = (value?: string | null): string => {
  if (!value) {
    return "-";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export const getReturnQcStatusBadgeClass = (status: ReturnQcStatus): string => {
  switch (status) {
    case "PASSED":
      return "text-bg-success";

    case "FAILED":
      return "text-bg-danger";

    case "PARTIALLY_PASSED":
      return "text-bg-warning";

    case "IN_PROGRESS":
      return "text-bg-info";

    case "PENDING":
      return "text-bg-primary";

    case "NOT_STARTED":
    default:
      return "text-bg-light border";
  }
};

export const getConditionGradeBadgeClass = (
  conditionGrade: ReturnItemConditionGrade,
): string => {
  switch (conditionGrade) {
    case "SELLABLE":
    case "OPEN_BOX":
      return "text-bg-success";

    case "MINOR_DAMAGE":
      return "text-bg-warning";

    case "MAJOR_DAMAGE":
    case "MISSING_ACCESSORY":
    case "WRONG_ITEM":
    case "USED_OR_TAMPERED":
    case "NOT_RECEIVED":
      return "text-bg-danger";

    default:
      return "text-bg-light border";
  }
};

export const isConditionRefundEligible = (
  conditionGrade: ReturnItemConditionGrade,
): boolean => {
  return (
    returnConditionGradeOptions.find(
      (option) => option.value === conditionGrade,
    )?.refundEligible ?? false
  );
};

export const getDefaultChecklistByCategory = (
  category?: string | null,
): ReturnQcChecklistResult[] => {
  const normalizedCategory = category?.trim().toLowerCase() ?? "";

  if (normalizedCategory.includes("electronics")) {
    return [
      {
        checkId: "serial-imei-match",
        label: "Serial / IMEI number matches",
        passed: false,
        required: true,
      },
      {
        checkId: "no-physical-damage",
        label: "No physical damage",
        passed: false,
        required: true,
      },
      {
        checkId: "accessories-present",
        label: "All accessories are present",
        passed: false,
        required: true,
      },
      {
        checkId: "device-powers-on",
        label: "Device powers on",
        passed: false,
        required: true,
      },
      {
        checkId: "factory-reset",
        label: "Factory reset verified",
        passed: false,
        required: false,
      },
      {
        checkId: "seal-not-tampered",
        label: "Warranty seal not tampered",
        passed: false,
        required: false,
      },
    ];
  }

  if (
    normalizedCategory.includes("clothing") ||
    normalizedCategory.includes("fashion")
  ) {
    return [
      {
        checkId: "tag-attached",
        label: "Product tag is attached",
        passed: false,
        required: true,
      },
      {
        checkId: "no-stains",
        label: "No stains or marks",
        passed: false,
        required: true,
      },
      {
        checkId: "no-usage-signs",
        label: "No visible usage signs",
        passed: false,
        required: true,
      },
      {
        checkId: "correct-size",
        label: "Correct size returned",
        passed: false,
        required: true,
      },
      {
        checkId: "original-packaging",
        label: "Original packaging available",
        passed: false,
        required: false,
      },
    ];
  }

  if (normalizedCategory.includes("footwear")) {
    return [
      {
        checkId: "sole-condition",
        label: "Sole condition checked",
        passed: false,
        required: true,
      },
      {
        checkId: "pair-matched",
        label: "Pair is matched",
        passed: false,
        required: true,
      },
      {
        checkId: "no-usage-marks",
        label: "No usage marks",
        passed: false,
        required: true,
      },
      {
        checkId: "box-available",
        label: "Original box available",
        passed: false,
        required: false,
      },
      {
        checkId: "size-verified",
        label: "Size verified",
        passed: false,
        required: true,
      },
    ];
  }

  return [
    {
      checkId: "item-received",
      label: "Item received",
      passed: false,
      required: true,
    },
    {
      checkId: "condition-verified",
      label: "Condition verified",
      passed: false,
      required: true,
    },
    {
      checkId: "matches-return-request",
      label: "Item matches return request",
      passed: false,
      required: true,
    },
    {
      checkId: "packaging-available",
      label: "Packaging available",
      passed: false,
      required: false,
    },
  ];
};

export const areRequiredChecksPassed = (
  checklistResults: ReturnQcChecklistResult[],
): boolean => {
  return checklistResults
    .filter((check) => check.required)
    .every((check) => check.passed);
};

export const isReturnEligibleForWarehouseQc = (
  request: ReturnRequest,
): boolean => {
  return (
    request.pickupStatus === "PICKED_UP" ||
    request.status === "PICKED_UP" ||
    request.status === "QUALITY_CHECK_PENDING" ||
    request.qualityCheckStatus === "PENDING" ||
    request.qualityCheckStatus === "IN_PROGRESS" ||
    request.qualityCheckStatus === "NOT_STARTED"
  );
};

export const getEvidenceMatchStatus = ({
  expectedValue,
  scannedValue,
}: {
  expectedValue?: string | null;
  scannedValue?: string | null;
}): ReturnQcEvidenceMatchStatus => {
  const normalizedExpected = expectedValue?.trim().toLowerCase() ?? "";
  const normalizedScanned = scannedValue?.trim().toLowerCase() ?? "";

  // If neither or only one value is provided without an expected baseline, mark NOT_CHECKED
  if (!normalizedExpected || !normalizedScanned) {
    return "NOT_CHECKED";
  }

  return normalizedExpected === normalizedScanned ? "MATCHED" : "MISMATCHED";
};

export const getEvidenceMatchBadgeClass = (
  status?: ReturnQcEvidenceMatchStatus,
): string => {
  switch (status) {
    case "MATCHED":
      return "text-bg-success";

    case "MISMATCHED":
      return "text-bg-danger";

    case "NOT_CHECKED":
    default:
      return "text-bg-light border";
  }
};

export const formatEvidenceMatchStatus = (
  status?: ReturnQcEvidenceMatchStatus,
): string => {
  switch (status) {
    case "MATCHED":
      return "Matched";

    case "MISMATCHED":
      return "Mismatched";

    case "NOT_CHECKED":
    default:
      return "Not Checked";
  }
};

export const buildInitialQcEvidenceState = (
  inspection?: ReturnQcInspection | null,
): ReturnQcEvidenceFormState => {
  return {
    expectedBarcode: inspection?.expectedBarcode ?? "",
    scannedBarcode: inspection?.scannedBarcode ?? "",
    expectedSerialNumber: inspection?.expectedSerialNumber ?? "",
    scannedSerialNumber: inspection?.scannedSerialNumber ?? "",
    expectedPackageWeightKg:
      inspection?.expectedPackageWeightKg !== null &&
      inspection?.expectedPackageWeightKg !== undefined
        ? String(inspection.expectedPackageWeightKg)
        : "",
    packageWeightKg:
      inspection?.packageWeightKg !== null &&
      inspection?.packageWeightKg !== undefined
        ? String(inspection.packageWeightKg)
        : "",
    packageWeightVarianceNote: inspection?.packageWeightVarianceNote ?? "",
    qcPhotoDataUrl: inspection?.qcPhotoDataUrl ?? null,
    qcPhotoFileName: inspection?.qcPhotoFileName ?? null,
    evidenceNotes: inspection?.evidenceNotes ?? "",
  };
};

export const parseOptionalNumber = (value: string): number | null => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
};

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result));
    };

    reader.onerror = () => {
      reject(new Error("Unable to read selected file."));
    };

    reader.readAsDataURL(file);
  });
};