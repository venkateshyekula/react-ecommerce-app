import { useEffect, useMemo, useState } from "react";
import type { ReturnRequest } from "../../types/returnRequest";
import type {
  ReturnItemConditionGrade,
  ReturnQcChecklistResult,
  ReturnQcEvidenceFormState,
  ReturnQcInspection,
} from "../../types/returnQc";
import {
  areRequiredChecksPassed,
  buildInitialQcEvidenceState,
  formatReturnQcLabel,
  getDefaultChecklistByCategory,
  getEvidenceMatchStatus,
  isConditionRefundEligible,
  returnConditionGradeOptions,
} from "../../utils/returnQcUtils";
import ReturnQcChecklist from "./ReturnQcChecklist";
import ReturnQcEvidenceCapturePanel from "./ReturnQcEvidenceCapturePanel";

type ReturnRequestItem = ReturnRequest["items"][number];

export interface QcDecisionPayload {
  conditionGrade: ReturnItemConditionGrade;
  checklistResults: ReturnQcChecklistResult[];
  qcRemarks?: string;
  evidence: ReturnQcEvidenceFormState;
}

interface ReturnQcDecisionPanelProps {
  request: ReturnRequest;
  item: ReturnRequestItem;
  inspection?: ReturnQcInspection | null;
  isUpdating?: boolean;
  canPerformQc?: boolean;
  onSaveDraft: (payload: QcDecisionPayload) => Promise<void>;
  onQcPassed: (payload: QcDecisionPayload) => Promise<void>;
  onQcFailed: (
    payload: QcDecisionPayload & {
      qcRemarks: string;
    },
  ) => Promise<void>;
}

const ReturnQcDecisionPanel = ({
  item,
  inspection = null,
  isUpdating = false,
  canPerformQc = false,
  onSaveDraft,
  onQcPassed,
  onQcFailed,
}: ReturnQcDecisionPanelProps) => {
  const [conditionGrade, setConditionGrade] =
    useState<ReturnItemConditionGrade>(
      inspection?.conditionGrade ?? "SELLABLE",
    );

  const [checklistResults, setChecklistResults] = useState<
    ReturnQcChecklistResult[]
  >(
    inspection?.checklistResults ??
      getDefaultChecklistByCategory(item.category),
  );

  const [qcRemarks, setQcRemarks] = useState<string>(
    inspection?.qcRemarks ?? "",
  );

  const [evidenceState, setEvidenceState] =
    useState<ReturnQcEvidenceFormState>(
      buildInitialQcEvidenceState(inspection),
    );

  // Sync component state whenever selected item or inspection updates
  useEffect(() => {
    setConditionGrade(inspection?.conditionGrade ?? "SELLABLE");
    setChecklistResults(
      inspection?.checklistResults ??
        getDefaultChecklistByCategory(item.category),
    );
    setQcRemarks(inspection?.qcRemarks ?? "");
    setEvidenceState(buildInitialQcEvidenceState(inspection));
  }, [inspection, item.category, item.productId]);

  const requiredChecksPassed = useMemo(() => {
    return areRequiredChecksPassed(checklistResults);
  }, [checklistResults]);

  const conditionRefundEligible = useMemo(() => {
    return isConditionRefundEligible(conditionGrade);
  }, [conditionGrade]);

  const barcodeMatchStatus = useMemo(() => {
    return getEvidenceMatchStatus({
      expectedValue: evidenceState.expectedBarcode,
      scannedValue: evidenceState.scannedBarcode,
    });
  }, [evidenceState.expectedBarcode, evidenceState.scannedBarcode]);

  const serialMatchStatus = useMemo(() => {
    return getEvidenceMatchStatus({
      expectedValue: evidenceState.expectedSerialNumber,
      scannedValue: evidenceState.scannedSerialNumber,
    });
  }, [evidenceState.expectedSerialNumber, evidenceState.scannedSerialNumber]);

  const hasEvidenceMismatch =
    barcodeMatchStatus === "MISMATCHED" ||
    serialMatchStatus === "MISMATCHED";

  const canPassQc =
    requiredChecksPassed && conditionRefundEligible && !hasEvidenceMismatch;

  const isRemarksEmpty = qcRemarks.trim().length === 0;

  const buildPayload = (): QcDecisionPayload => {
    return {
      conditionGrade,
      checklistResults,
      qcRemarks: qcRemarks.trim() || undefined,
      evidence: evidenceState,
    };
  };

  return (
    <div className="return-qc-decision-panel bg-white border rounded-4 p-4 shadow-sm">
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
        <div>
          <h5 className="fw-bold mb-1">QC Decision Panel</h5>
          <p className="text-muted small mb-0">
            Grade returned item condition, verify barcode or serial number,
            capture evidence, and submit QC decision.
          </p>
        </div>

        <span className="badge text-bg-light border align-self-start">
          {item.category ?? "General"}
        </span>
      </div>

      {!canPerformQc ? (
        <div className="alert alert-info small mb-3">
          You can view warehouse QC details, but only Warehouse Agents or Admins
          can submit QC decisions.
        </div>
      ) : null}

      <div className="alert alert-light border small mb-3">
        <strong>Selected Item:</strong> {item.name}
        <br />
        <strong>Quantity:</strong> {item.quantity}
        {item.selectedSize ? (
          <>
            <br />
            <strong>Size:</strong> {item.selectedSize}
          </>
        ) : null}
      </div>

      <div className="mb-3">
        <label
          className="form-label small fw-semibold"
          htmlFor="qc-condition-grade"
        >
          Item Condition Grade
        </label>

        <select
          id="qc-condition-grade"
          className="form-select"
          value={conditionGrade}
          disabled={isUpdating || !canPerformQc}
          onChange={(event) =>
            setConditionGrade(event.target.value as ReturnItemConditionGrade)
          }
        >
          {returnConditionGradeOptions.map(
            (option: {
              value: ReturnItemConditionGrade;
              label: string;
              refundEligible: boolean;
            }) => (
              <option value={option.value} key={option.value}>
                {option.label}
                {option.refundEligible
                  ? " - Refund Eligible"
                  : " - Review Needed"}
              </option>
            ),
          )}
        </select>
      </div>

      <div className="mb-3">
        <div className="d-flex justify-content-between gap-2 mb-2">
          <label className="form-label small fw-semibold mb-0">
            QC Checklist
          </label>

          <span className="text-muted small">* Required checks</span>
        </div>

        <ReturnQcChecklist
          checklistResults={checklistResults}
          disabled={isUpdating || !canPerformQc}
          onChecklistChange={setChecklistResults}
        />
      </div>

      <div className="mb-3">
        <ReturnQcEvidenceCapturePanel
          evidenceState={evidenceState}
          disabled={isUpdating || !canPerformQc}
          onEvidenceChange={setEvidenceState}
        />
      </div>

      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <label
            className="form-label small fw-semibold mb-0"
            htmlFor="qc-remarks"
          >
            QC Remarks
          </label>

          <span className="text-muted small text-danger fw-semibold">
            {canPerformQc && isRemarksEmpty ? "Required for QC Failure" : ""}
          </span>
        </div>

        <textarea
          id="qc-remarks"
          className="form-control"
          rows={4}
          value={qcRemarks}
          disabled={isUpdating || !canPerformQc}
          placeholder="Add warehouse inspection notes, missing parts, damage evidence, serial mismatch details, or refund eligibility remarks..."
          onChange={(event) => setQcRemarks(event.target.value)}
        />
      </div>

      {canPerformQc && !canPassQc ? (
        <div className="alert alert-warning small mb-3">
          <strong>QC Pass blocked:</strong>{" "}
          {!requiredChecksPassed
            ? "All required checklist items must be passed."
            : null}
          {!conditionRefundEligible
            ? ` ${formatReturnQcLabel(
                conditionGrade,
              )} is not refund eligible. Use QC Failed or save draft.`
            : null}
          {hasEvidenceMismatch
            ? " Barcode or serial verification has mismatch. Resolve mismatch or use QC Failed."
            : null}
        </div>
      ) : null}

      <div className="d-flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={isUpdating || !canPerformQc}
          onClick={() => void onSaveDraft(buildPayload())}
        >
          {isUpdating ? "Saving..." : "Save QC Draft"}
        </button>

        <button
          type="button"
          className="btn btn-sm btn-success"
          disabled={isUpdating || !canPassQc || !canPerformQc}
          onClick={() =>
            void onQcPassed({
              ...buildPayload(),
              qcRemarks:
                qcRemarks.trim() ||
                "QC passed. Item is eligible for refund.",
            })
          }
        >
          {isUpdating ? "Processing..." : "QC Passed + Create Refund"}
        </button>

        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          disabled={isUpdating || isRemarksEmpty || !canPerformQc}
          title={
            isRemarksEmpty
              ? "Please provide QC remarks to fail inspection"
              : ""
          }
          onClick={() =>
            void onQcFailed({
              ...buildPayload(),
              qcRemarks: qcRemarks.trim(),
            })
          }
        >
          {isUpdating ? "Processing..." : "QC Failed"}
        </button>
      </div>
    </div>
  );
};

export default ReturnQcDecisionPanel;