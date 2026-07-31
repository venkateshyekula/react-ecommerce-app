export type ReturnQcStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "IN_PROGRESS"
  | "PASSED"
  | "FAILED"
  | "PARTIALLY_PASSED";

export type ReturnItemConditionGrade =
  | "SELLABLE"
  | "OPEN_BOX"
  | "MINOR_DAMAGE"
  | "MAJOR_DAMAGE"
  | "MISSING_ACCESSORY"
  | "WRONG_ITEM"
  | "USED_OR_TAMPERED"
  | "NOT_RECEIVED";

export type ReturnQcEvidenceMatchStatus =
  | "NOT_CHECKED"
  | "MATCHED"
  | "MISMATCHED";

export interface ReturnQcChecklistResult {
  checkId: string;
  label: string;
  passed: boolean;
  required: boolean;
}

export interface ReturnQcEvidenceDetails {
  expectedBarcode?: string | null;
  scannedBarcode?: string | null;
  barcodeMatchStatus?: ReturnQcEvidenceMatchStatus;

  expectedSerialNumber?: string | null;
  scannedSerialNumber?: string | null;
  serialMatchStatus?: ReturnQcEvidenceMatchStatus;

  packageWeightKg?: number | null;
  expectedPackageWeightKg?: number | null;
  packageWeightVarianceNote?: string | null;

  qcPhotoDataUrl?: string | null;
  qcPhotoFileName?: string | null;

  evidenceNotes?: string | null;
}

export interface ReturnQcInspection extends ReturnQcEvidenceDetails {
  id: string;
  inspectionId: string;
  returnRequestId: string;
  requestId: string;
  orderId: string;
  orderDbId?: string | null;
  userId: string;
  productId: string;
  productName: string;
  category?: string | null;
  sellerId?: string | null;
  sellerName?: string | null;
  conditionGrade: ReturnItemConditionGrade;
  qcStatus: ReturnQcStatus;
  checklistResults: ReturnQcChecklistResult[];
  qcRemarks?: string | null;
  inspectedByUserId?: string | null;
  inspectedByName?: string | null;
  inspectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReturnQcInspectionPayload
  extends ReturnQcEvidenceDetails {
  returnRequestId: string;
  requestId: string;
  orderId: string;
  orderDbId?: string | null;
  userId: string;
  productId: string;
  productName: string;
  category?: string | null;
  sellerId?: string | null;
  sellerName?: string | null;
  conditionGrade: ReturnItemConditionGrade;
  qcStatus: ReturnQcStatus;
  checklistResults: ReturnQcChecklistResult[];
  qcRemarks?: string | null;
  inspectedByUserId?: string | null;
  inspectedByName?: string | null;
}

export interface UpdateReturnQcInspectionPayload
  extends Partial<ReturnQcEvidenceDetails> {
  conditionGrade?: ReturnItemConditionGrade;
  qcStatus?: ReturnQcStatus;
  checklistResults?: ReturnQcChecklistResult[];
  qcRemarks?: string | null;
  inspectedByUserId?: string | null;
  inspectedByName?: string | null;
  inspectedAt?: string | null;
  updatedAt?: string;
}

export interface ReturnQcEvidenceFormState {
  expectedBarcode: string;
  scannedBarcode: string;
  expectedSerialNumber: string;
  scannedSerialNumber: string;
  expectedPackageWeightKg: string;
  packageWeightKg: string;
  packageWeightVarianceNote: string;
  qcPhotoDataUrl: string | null;
  qcPhotoFileName: string | null;
  evidenceNotes: string;
}