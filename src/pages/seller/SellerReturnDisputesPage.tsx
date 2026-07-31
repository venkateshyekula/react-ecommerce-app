import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent
} from "react";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";
import { sellerReturnDisputeService } from "../../services/sellerReturnDisputeService";
import type {
  SellerReturnDispute,
  SellerReturnDisputeEvidence
} from "../../types/sellerReturnDispute";
import { formatReturnLabel } from "../../utils/sellerReturnWorkflowUtils";

const MIN_EVIDENCE_REMARKS_LENGTH = 10;
const MAX_EVIDENCE_FILES = 3;
const MAX_EVIDENCE_FILE_SIZE_BYTES = 3 * 1024 * 1024;

const ALLOWED_EVIDENCE_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
  "text/plain"
];

const getDisputeBadgeClass = (status?: string | null): string => {
  const normalizedStatus = status?.trim().toUpperCase() ?? "";

  if (["APPROVED", "RESOLVED", "ACCEPTED"].includes(normalizedStatus)) {
    return "text-bg-success";
  }

  if (["REJECTED", "DECLINED", "CANCELLED"].includes(normalizedStatus)) {
    return "text-bg-danger";
  }

  if (normalizedStatus === "NEEDS_MORE_EVIDENCE") {
    return "text-bg-info";
  }

  if (
    ["IN_REVIEW", "UNDER_REVIEW", "PENDING_REVIEW", "PENDING", "OPEN"].includes(
      normalizedStatus
    )
  ) {
    return "text-bg-warning text-dark";
  }

  return "text-bg-secondary";
};

const generateEvidenceId = (): string => {
  return `seller-evidence-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageEvidence = (evidence: SellerReturnDisputeEvidence): boolean => {
  const fileType = evidence.fileType?.toLowerCase() ?? "";
  const fileUrl = evidence.fileUrl?.toLowerCase() ?? "";

  return (
    fileType.startsWith("image/") ||
    fileType === "image" ||
    fileUrl.startsWith("data:image/") ||
    fileUrl.endsWith(".png") ||
    fileUrl.endsWith(".jpg") ||
    fileUrl.endsWith(".jpeg") ||
    fileUrl.endsWith(".webp")
  );
};

const convertFileToEvidence = (
  file: File
): Promise<SellerReturnDisputeEvidence> => {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_EVIDENCE_FILE_TYPES.includes(file.type)) {
      reject(
        new Error(
          "Unsupported file type. Please upload image, PDF, or text evidence."
        )
      );
      return;
    }

    if (file.size > MAX_EVIDENCE_FILE_SIZE_BYTES) {
      reject(new Error("Evidence file should not exceed 3 MB."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        id: generateEvidenceId(),
        fileName: file.name,
        fileUrl: String(reader.result),
        fileType: file.type || "FILE",
        uploadedAt: new Date().toISOString()
      });
    };

    reader.onerror = () => {
      reject(new Error("Unable to read selected evidence file."));
    };

    reader.readAsDataURL(file);
  });
};

const SellerReturnDisputesPage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const sellerId =
    (currentUser as { sellerId?: string } | null)?.sellerId ??
    currentUser?.id ??
    "";

  const [disputes, setDisputes] = useState<SellerReturnDispute[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingEvidence, setIsSavingEvidence] = useState<boolean>(false);
  const [deletingEvidenceId, setDeletingEvidenceId] = useState<string>("");

  const [selectedDispute, setSelectedDispute] =
    useState<SellerReturnDispute | null>(null);
  const [sellerRemarks, setSellerRemarks] = useState<string>("");
  const [evidenceUrl, setEvidenceUrl] = useState<string>("");
  const [evidenceFileName, setEvidenceFileName] = useState<string>("");
  const [pendingEvidence, setPendingEvidence] = useState<
    SellerReturnDisputeEvidence[]
  >([]);

  const loadDisputes = useCallback(async (): Promise<void> => {
    if (!sellerId) {
      setDisputes([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const data = await sellerReturnDisputeService.getDisputesBySellerId(
        sellerId
      );

      setDisputes(data ?? []);
    } catch {
      showToast(
        "Disputes load failed",
        "Unable to load seller return disputes.",
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  }, [sellerId, showToast]);

  useEffect(() => {
    void loadDisputes();
  }, [loadDisputes]);

  const selectedDisputeExistingEvidence = useMemo(() => {
    return selectedDispute?.sellerEvidence ?? [];
  }, [selectedDispute]);

  const handleOpenEvidenceModal = (dispute: SellerReturnDispute): void => {
    setSelectedDispute(dispute);
    setSellerRemarks("");
    setEvidenceUrl("");
    setEvidenceFileName("");
    setPendingEvidence([]);
  };

  const handleCloseEvidenceModal = (): void => {
    if (isSavingEvidence) {
      return;
    }

    setSelectedDispute(null);
    setSellerRemarks("");
    setEvidenceUrl("");
    setEvidenceFileName("");
    setPendingEvidence([]);
  };

  const handleEvidenceFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    if (pendingEvidence.length + selectedFiles.length > MAX_EVIDENCE_FILES) {
      showToast(
        "Evidence limit reached",
        `You can upload up to ${MAX_EVIDENCE_FILES} evidence files at a time.`,
        "warning"
      );
      event.target.value = "";
      return;
    }

    try {
      const convertedEvidence = await Promise.all(
        selectedFiles.map((file) => convertFileToEvidence(file))
      );

      setPendingEvidence((previousEvidence) => [
        ...previousEvidence,
        ...convertedEvidence
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to attach selected evidence file.";

      showToast("Evidence upload failed", message, "danger");
    } finally {
      event.target.value = "";
    }
  };

  const handleRemovePendingEvidence = (evidenceId: string): void => {
    setPendingEvidence((previousEvidence) =>
      previousEvidence.filter((evidence) => evidence.id !== evidenceId)
    );
  };

  const handleDeleteExistingEvidence = async ({
    dispute,
    evidenceId
  }: {
    dispute: SellerReturnDispute;
    evidenceId: string;
  }): Promise<void> => {
    try {
      setDeletingEvidenceId(evidenceId);

      const updatedEvidence = (dispute.sellerEvidence ?? []).filter(
        (evidence) => evidence.id !== evidenceId
      );

      const updatedDispute = await sellerReturnDisputeService.updateDispute(
        dispute.id,
        {
          sellerEvidence: updatedEvidence
        }
      );

      setDisputes((previousDisputes) =>
        previousDisputes.map((currentDispute) =>
          currentDispute.id === updatedDispute.id
            ? updatedDispute
            : currentDispute
        )
      );

      setSelectedDispute((currentSelectedDispute) =>
        currentSelectedDispute?.id === updatedDispute.id
          ? updatedDispute
          : currentSelectedDispute
      );

      showToast(
        "Evidence deleted",
        "Seller evidence has been removed from the dispute.",
        "success"
      );
    } catch {
      showToast(
        "Evidence delete failed",
        "Unable to delete seller evidence.",
        "danger"
      );
    } finally {
      setDeletingEvidenceId("");
    }
  };

  const handleSubmitAdditionalEvidence = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (!selectedDispute) {
      return;
    }

    const normalizedRemarks = sellerRemarks.trim();
    const normalizedEvidenceUrl = evidenceUrl.trim();
    const normalizedFileName = evidenceFileName.trim();

    if (
      normalizedRemarks.length < MIN_EVIDENCE_REMARKS_LENGTH &&
      normalizedEvidenceUrl.length === 0 &&
      pendingEvidence.length === 0
    ) {
      showToast(
        "Evidence details required",
        "Please add remarks of at least 10 characters, provide an evidence URL, or upload an evidence file.",
        "warning"
      );
      return;
    }

    const urlEvidence: SellerReturnDisputeEvidence[] = normalizedEvidenceUrl
      ? [
          {
            id: generateEvidenceId(),
            fileName:
              normalizedFileName ||
              `seller-evidence-${selectedDispute.disputeId}`,
            fileUrl: normalizedEvidenceUrl,
            fileType: "URL",
            uploadedAt: new Date().toISOString()
          }
        ]
      : [];

    const nextEvidence = [...urlEvidence, ...pendingEvidence];

    try {
      setIsSavingEvidence(true);

      const updatedDispute =
        await sellerReturnDisputeService.submitAdditionalEvidence({
          dispute: selectedDispute,
          sellerAdditionalRemarks: normalizedRemarks,
          sellerEvidence: nextEvidence
        });

      setDisputes((previousDisputes) =>
        previousDisputes.map((dispute) =>
          dispute.id === updatedDispute.id ? updatedDispute : dispute
        )
      );

      showToast(
        "Evidence submitted",
        `Additional evidence submitted for ${updatedDispute.disputeId}.`,
        "success"
      );

      handleCloseEvidenceModal();
    } catch {
      showToast(
        "Evidence submission failed",
        "Unable to submit additional seller evidence.",
        "danger"
      );
    } finally {
      setIsSavingEvidence(false);
    }
  };

  const renderEvidenceList = ({
    dispute,
    evidenceList,
    allowDelete
  }: {
    dispute: SellerReturnDispute;
    evidenceList: SellerReturnDisputeEvidence[];
    allowDelete: boolean;
  }) => {
    if (evidenceList.length === 0) {
      return null;
    }

    return (
      <div className="border rounded-4 p-3 mb-3">
        <h6 className="fw-bold mb-2">Seller Evidence</h6>

        <div className="d-flex flex-column gap-3">
          {evidenceList.map((evidence) => (
            <div className="border rounded-3 p-2 bg-light" key={evidence.id}>
              <div className="d-flex justify-content-between align-items-start gap-2 small">
                <div className="min-w-0">
                  <div className="fw-semibold text-truncate">
                    {evidence.fileName}
                  </div>
                  <div className="text-muted">
                    {evidence.fileType ?? "Evidence"} ·{" "}
                    {new Date(evidence.uploadedAt).toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  {evidence.fileUrl ? (
                    <a
                      href={evidence.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                    >
                      View
                      <i className="bi bi-box-arrow-up-right ms-1" />
                    </a>
                  ) : null}

                  {allowDelete ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      disabled={deletingEvidenceId === evidence.id}
                      onClick={() =>
                        void handleDeleteExistingEvidence({
                          dispute,
                          evidenceId: evidence.id
                        })
                      }
                    >
                      {deletingEvidenceId === evidence.id ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" />
                          Deleting
                        </>
                      ) : (
                        <>
                          <i className="bi bi-trash me-1" />
                          Delete
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>

              {evidence.fileUrl && isImageEvidence(evidence) ? (
                <div className="mt-2">
                  <img
                    src={evidence.fileUrl}
                    alt={evidence.fileName}
                    className="img-thumbnail"
                    style={{
                      maxWidth: 220,
                      maxHeight: 160,
                      objectFit: "cover"
                    }}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <main className="seller-return-disputes-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading seller disputes..." />
        </div>
      </main>
    );
  }

  return (
    <main className="seller-return-disputes-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">Seller Return Disputes</h1>
              <p className="text-muted mb-0">
                Track dispute review status, admin decisions, and evidence
                requests.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary align-self-md-start"
              onClick={() => void loadDisputes()}
              disabled={isLoading}
            >
              <i className="bi bi-arrow-clockwise me-2" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        {disputes.length === 0 ? (
          <EmptyState
            title="No return disputes"
            message="You have not raised any seller return disputes yet."
            iconClassName="bi bi-shield-exclamation text-primary"
          />
        ) : (
          <div className="row g-3">
            {disputes.map((dispute) => (
              <div className="col-xl-6" key={dispute.id}>
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between gap-3 mb-3">
                      <div>
                        <span className="badge text-bg-light border mb-2">
                          {dispute.disputeId}
                        </span>

                        <h5 className="fw-bold mb-1">
                          {dispute.productName}
                        </h5>

                        <p className="text-muted small mb-0">
                          Return {dispute.returnRequestId} · Order{" "}
                          {dispute.orderId}
                        </p>
                      </div>

                      <span
                        className={`badge align-self-start ${getDisputeBadgeClass(
                          dispute.status
                        )}`}
                      >
                        {formatReturnLabel(dispute.status)}
                      </span>
                    </div>

                    <p className="small mb-2">
                      <strong>Reason:</strong>{" "}
                      {formatReturnLabel(dispute.disputeReason)}
                    </p>

                    <p className="text-muted small mb-3">
                      {dispute.disputeDescription}
                    </p>

                    {dispute.adminRemarks ? (
                      <div className="alert alert-info small mb-3">
                        <strong>Admin Remarks:</strong>{" "}
                        {dispute.adminRemarks}
                      </div>
                    ) : (
                      <div className="alert alert-light border small mb-3">
                        Awaiting admin review.
                      </div>
                    )}

                    {dispute.sellerAdditionalRemarks ? (
                      <div className="alert alert-success small mb-3">
                        <strong>Latest Seller Response:</strong>{" "}
                        {dispute.sellerAdditionalRemarks}
                      </div>
                    ) : null}

                    {renderEvidenceList({
                      dispute,
                      evidenceList: dispute.sellerEvidence ?? [],
                      allowDelete: dispute.status === "NEEDS_MORE_EVIDENCE"
                    })}

                    <div className="d-flex flex-wrap justify-content-end gap-2">
                      {dispute.status === "NEEDS_MORE_EVIDENCE" ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => handleOpenEvidenceModal(dispute)}
                        >
                          <i className="bi bi-upload me-2" />
                          Provide More Evidence
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedDispute ? (
        <>
          <div
            className="modal d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <form onSubmit={handleSubmitAdditionalEvidence}>
                  <div className="modal-header">
                    <div>
                      <h5 className="modal-title fw-bold">
                        Provide More Evidence
                      </h5>
                      <p className="text-muted small mb-0">
                        {selectedDispute.disputeId} ·{" "}
                        {selectedDispute.productName}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn-close"
                      onClick={handleCloseEvidenceModal}
                      disabled={isSavingEvidence}
                      aria-label="Close"
                    />
                  </div>

                  <div className="modal-body">
                    {selectedDispute.adminRemarks ? (
                      <div className="alert alert-info small">
                        <strong>Admin requested:</strong>{" "}
                        {selectedDispute.adminRemarks}
                      </div>
                    ) : null}

                    {selectedDisputeExistingEvidence.length > 0 ? (
                      <div className="mb-3">
                        {renderEvidenceList({
                          dispute: selectedDispute,
                          evidenceList: selectedDisputeExistingEvidence,
                          allowDelete: true
                        })}
                      </div>
                    ) : null}

                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Additional Remarks
                      </label>
                      <textarea
                        className="form-control"
                        rows={5}
                        value={sellerRemarks}
                        disabled={isSavingEvidence}
                        onChange={(event) =>
                          setSellerRemarks(event.target.value)
                        }
                        placeholder="Add serial proof, dispatch evidence, packaging details, or explanation requested by admin..."
                      />
                      <div className="form-text">
                        Minimum {MIN_EVIDENCE_REMARKS_LENGTH} characters
                        recommended.
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Evidence File Name
                        </label>
                        <input
                          className="form-control"
                          value={evidenceFileName}
                          disabled={isSavingEvidence}
                          onChange={(event) =>
                            setEvidenceFileName(event.target.value)
                          }
                          placeholder="Example: Dispatch proof photo"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Evidence URL
                        </label>
                        <input
                          className="form-control"
                          value={evidenceUrl}
                          disabled={isSavingEvidence}
                          onChange={(event) => setEvidenceUrl(event.target.value)}
                          placeholder="Paste image/document URL"
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold">
                          Upload Evidence Files
                        </label>
                        <input
                          type="file"
                          className="form-control"
                          multiple
                          disabled={isSavingEvidence}
                          accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf,text/plain"
                          onChange={(event) =>
                            void handleEvidenceFileChange(event)
                          }
                        />
                        <div className="form-text">
                          Upload up to {MAX_EVIDENCE_FILES} files. Supported:
                          PNG, JPG, WEBP, PDF, TXT. Max{" "}
                          {formatFileSize(MAX_EVIDENCE_FILE_SIZE_BYTES)} each.
                        </div>
                      </div>
                    </div>

                    {pendingEvidence.length > 0 ? (
                      <div className="border rounded-4 p-3 mt-3">
                        <h6 className="fw-bold mb-2">Pending Evidence</h6>

                        <div className="d-flex flex-column gap-3">
                          {pendingEvidence.map((evidence) => (
                            <div
                              className="border rounded-3 p-2 bg-light"
                              key={evidence.id}
                            >
                              <div className="d-flex justify-content-between align-items-start gap-2 small">
                                <div className="min-w-0">
                                  <div className="fw-semibold text-truncate">
                                    {evidence.fileName}
                                  </div>
                                  <div className="text-muted">
                                    {evidence.fileType ?? "Evidence"}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  disabled={isSavingEvidence}
                                  onClick={() =>
                                    handleRemovePendingEvidence(evidence.id)
                                  }
                                >
                                  <i className="bi bi-x-circle me-1" />
                                  Remove
                                </button>
                              </div>

                              {evidence.fileUrl && isImageEvidence(evidence) ? (
                                <div className="mt-2">
                                  <img
                                    src={evidence.fileUrl}
                                    alt={evidence.fileName}
                                    className="img-thumbnail"
                                    style={{
                                      maxWidth: 220,
                                      maxHeight: 160,
                                      objectFit: "cover"
                                    }}
                                  />
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleCloseEvidenceModal}
                      disabled={isSavingEvidence}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={
                        isSavingEvidence ||
                        (sellerRemarks.trim().length <
                          MIN_EVIDENCE_REMARKS_LENGTH &&
                          evidenceUrl.trim().length === 0 &&
                          pendingEvidence.length === 0)
                      }
                    >
                      {isSavingEvidence ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Evidence"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div
            className="modal-backdrop show"
            onClick={handleCloseEvidenceModal}
          />
        </>
      ) : null}
    </main>
  );
};

export default SellerReturnDisputesPage;