import { useMemo, useState, type ChangeEvent } from "react";
import type { ReturnQcEvidenceFormState } from "../../types/returnQc";
import {
  fileToDataUrl,
  formatEvidenceMatchStatus,
  getEvidenceMatchBadgeClass,
  getEvidenceMatchStatus,
} from "../../utils/returnQcUtils";

interface ReturnQcEvidenceCapturePanelProps {
  evidenceState: ReturnQcEvidenceFormState;
  disabled?: boolean;
  onEvidenceChange: (updatedEvidence: ReturnQcEvidenceFormState) => void;
}

const ReturnQcEvidenceCapturePanel = ({
  evidenceState,
  disabled = false,
  onEvidenceChange,
}: ReturnQcEvidenceCapturePanelProps) => {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [fileInputKey, setFileInputKey] = useState<number>(0);

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

  const updateEvidenceField = (
    fieldName: keyof ReturnQcEvidenceFormState,
    value: string | null,
  ): void => {
    onEvidenceChange({
      ...evidenceState,
      [fieldName]: value,
    });
  };

  const resetPhoto = (): void => {
    onEvidenceChange({
      ...evidenceState,
      qcPhotoDataUrl: null,
      qcPhotoFileName: null,
    });

    setFileInputKey((previousKey) => previousKey + 1);
  };

  const handleQcPhotoChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];

    if (!file) {
      resetPhoto();
      return;
    }

    if (!file.type.startsWith("image/")) {
      resetPhoto();
      setErrorMessage("Please upload only image files for QC evidence.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      resetPhoto();
      setErrorMessage("QC evidence image should be less than 3 MB.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);

      onEvidenceChange({
        ...evidenceState,
        qcPhotoDataUrl: dataUrl,
        qcPhotoFileName: file.name,
      });

      setErrorMessage("");
    } catch {
      resetPhoto();
      setErrorMessage("Unable to read selected QC evidence image.");
    }
  };

  return (
    <div className="return-qc-evidence-panel border rounded-4 p-3 bg-light-subtle">
      <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
        <div>
          <h6 className="fw-bold mb-1">QC Evidence Capture</h6>
          <p className="text-muted small mb-0">
            Capture barcode, serial number, package weight, and inspection
            photo proof.
          </p>
        </div>

        <span className="badge text-bg-light border align-self-start">
          Scan / Verify
        </span>
      </div>

      {errorMessage ? (
        <div className="alert alert-danger small">{errorMessage}</div>
      ) : null}

      <div className="return-qc-evidence-stack d-flex flex-column gap-3">
        <div>
          <label className="form-label small fw-semibold" htmlFor="expectedBarcode">
            Expected Barcode / SKU
          </label>

          <input
            id="expectedBarcode"
            className="form-control"
            value={evidenceState.expectedBarcode}
            disabled={disabled}
            placeholder="Expected SKU or barcode from order/product record"
            onChange={(event) =>
              updateEvidenceField("expectedBarcode", event.target.value)
            }
          />
        </div>

        <div>
          <label className="form-label small fw-semibold" htmlFor="scannedBarcode">
            Scanned Barcode / SKU
          </label>

          <input
            id="scannedBarcode"
            className="form-control"
            value={evidenceState.scannedBarcode}
            disabled={disabled}
            placeholder="Scan or enter product/package barcode"
            onChange={(event) =>
              updateEvidenceField("scannedBarcode", event.target.value)
            }
          />
        </div>

        <div className="return-qc-evidence-status-row d-flex justify-content-between align-items-center small">
          <span className="fw-semibold">Barcode Match Status</span>
          <span
            className={`badge ${getEvidenceMatchBadgeClass(
              barcodeMatchStatus,
            )}`}
          >
            {formatEvidenceMatchStatus(barcodeMatchStatus)}
          </span>
        </div>

        <div>
          <label className="form-label small fw-semibold" htmlFor="expectedSerialNumber">
            Expected Serial / IMEI
          </label>

          <input
            id="expectedSerialNumber"
            className="form-control"
            value={evidenceState.expectedSerialNumber}
            disabled={disabled}
            placeholder="Expected serial number / IMEI if available"
            onChange={(event) =>
              updateEvidenceField("expectedSerialNumber", event.target.value)
            }
          />
        </div>

        <div>
          <label className="form-label small fw-semibold" htmlFor="scannedSerialNumber">
            Scanned Serial / IMEI
          </label>

          <input
            id="scannedSerialNumber"
            className="form-control"
            value={evidenceState.scannedSerialNumber}
            disabled={disabled}
            placeholder="Scan or enter returned product serial number"
            onChange={(event) =>
              updateEvidenceField("scannedSerialNumber", event.target.value)
            }
          />
        </div>

        <div className="return-qc-evidence-status-row d-flex justify-content-between align-items-center small">
          <span className="fw-semibold">Serial / IMEI Match Status</span>
          <span
            className={`badge ${getEvidenceMatchBadgeClass(serialMatchStatus)}`}
          >
            {formatEvidenceMatchStatus(serialMatchStatus)}
          </span>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label small fw-semibold" htmlFor="expectedPackageWeightKg">
              Expected Weight KG
            </label>

            <input
              id="expectedPackageWeightKg"
              className="form-control"
              type="number"
              min="0"
              step="0.01"
              value={evidenceState.expectedPackageWeightKg}
              disabled={disabled}
              placeholder="Example: 1.25"
              onChange={(event) =>
                updateEvidenceField(
                  "expectedPackageWeightKg",
                  event.target.value,
                )
              }
            />
          </div>

          <div className="col-md-6">
            <label className="form-label small fw-semibold" htmlFor="packageWeightKg">
              Received Weight KG
            </label>

            <input
              id="packageWeightKg"
              className="form-control"
              type="number"
              min="0"
              step="0.01"
              value={evidenceState.packageWeightKg}
              disabled={disabled}
              placeholder="Example: 1.10"
              onChange={(event) =>
                updateEvidenceField("packageWeightKg", event.target.value)
              }
            />
          </div>
        </div>

        <div>
          <label className="form-label small fw-semibold" htmlFor="packageWeightVarianceNote">
            Weight Variance Note
          </label>

          <input
            id="packageWeightVarianceNote"
            className="form-control"
            value={evidenceState.packageWeightVarianceNote}
            disabled={disabled}
            placeholder="Example: Weight lower than expected, possible missing accessory"
            onChange={(event) =>
              updateEvidenceField(
                "packageWeightVarianceNote",
                event.target.value,
              )
            }
          />
        </div>

        <div>
          <label className="form-label small fw-semibold" htmlFor="qcPhotoInput">
            QC Evidence Photo
          </label>

          <input
            id="qcPhotoInput"
            key={fileInputKey}
            className="form-control"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            disabled={disabled}
            onChange={(event) => void handleQcPhotoChange(event)}
          />
        </div>

        {evidenceState.qcPhotoDataUrl ? (
          <div className="return-qc-photo-preview border rounded-3 p-2 bg-white d-flex align-items-center gap-3">
            <img
              src={evidenceState.qcPhotoDataUrl}
              alt="QC Evidence"
              className="rounded"
              style={{ width: "60px", height: "60px", objectFit: "cover" }}
            />

            <div className="min-w-0 flex-grow-1">
              <strong className="d-block small text-truncate">QC Evidence Photo</strong>
              <span className="small text-muted text-truncate d-block">
                {evidenceState.qcPhotoFileName}
              </span>
            </div>

            {!disabled ? (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={resetPhoto}
              >
                Remove
              </button>
            ) : null}
          </div>
        ) : null}

        <div>
          <label className="form-label small fw-semibold" htmlFor="evidenceNotes">
            Evidence Notes
          </label>

          <textarea
            id="evidenceNotes"
            className="form-control"
            rows={3}
            value={evidenceState.evidenceNotes}
            disabled={disabled}
            placeholder="Add barcode scan remarks, serial mismatch reason, missing accessory proof, damage observation..."
            onChange={(event) =>
              updateEvidenceField("evidenceNotes", event.target.value)
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ReturnQcEvidenceCapturePanel;