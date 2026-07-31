import type { ReturnQcChecklistResult } from "../../types/returnQc";

interface ReturnQcChecklistProps {
  checklistResults: ReturnQcChecklistResult[];
  disabled?: boolean;
  onChecklistChange: (updatedChecklist: ReturnQcChecklistResult[]) => void;
}

const ReturnQcChecklist = ({
  checklistResults,
  disabled = false,
  onChecklistChange,
}: ReturnQcChecklistProps) => {
  const handleToggle = (checkId: string): void => {
    if (disabled) return;

    const updatedChecklist = checklistResults.map((check) =>
      check.checkId === checkId
        ? {
            ...check,
            passed: !check.passed,
          }
        : check,
    );

    onChecklistChange(updatedChecklist);
  };

  if (checklistResults.length === 0) {
    return (
      <div className="alert alert-light border small mb-0">
        No QC checklist configured for this item.
      </div>
    );
  }

  return (
    <div className="return-qc-checklist">
      {checklistResults.map((check) => {
        const inputId = `qc-check-${check.checkId}`;

        return (
          <div
            key={check.checkId}
            className={`return-qc-check-item ${
              check.passed ? "return-qc-check-item--passed" : ""
            } ${disabled ? "return-qc-check-item--disabled opacity-75" : ""}`}
          >
            <input
              id={inputId}
              className="form-check-input mt-0 me-2"
              type="checkbox"
              checked={check.passed}
              disabled={disabled}
              aria-required={check.required}
              onChange={() => handleToggle(check.checkId)}
            />

            <label
              htmlFor={inputId}
              className={`form-check-label user-select-none ${
                disabled ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <span>{check.label}</span>
              {check.required ? (
                <span className="text-danger ms-1" aria-hidden="true">
                  *
                </span>
              ) : (
                <span className="text-muted ms-1 small">(Optional)</span>
              )}
            </label>
          </div>
        );
      })}
    </div>
  );
};

export default ReturnQcChecklist;