import type {
  SellerReturnDispute,
  SellerReturnDisputeEvidence
} from "../../types/sellerReturnDispute";

type AdminSellerEvidencePreviewProps = {
  dispute: SellerReturnDispute;
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

const AdminSellerEvidencePreview = ({
  dispute
}: AdminSellerEvidencePreviewProps) => {
  const evidenceList = dispute.sellerEvidence ?? [];

  if (evidenceList.length === 0 && !dispute.sellerAdditionalRemarks) {
    return (
      <div className="alert alert-light border small mb-0">
        No seller evidence has been submitted yet.
      </div>
    );
  }

  return (
    <div className="border rounded-4 p-3 bg-light">
      <h6 className="fw-bold mb-2">Seller Re-review Evidence</h6>

      {dispute.sellerAdditionalRemarks ? (
        <div className="alert alert-success small mb-3">
          <strong>Seller Response:</strong> {dispute.sellerAdditionalRemarks}
          {dispute.sellerRespondedAt ? (
            <div className="text-muted mt-1">
              Submitted:{" "}
              {new Date(dispute.sellerRespondedAt).toLocaleString("en-IN")}
            </div>
          ) : null}
        </div>
      ) : null}

      {evidenceList.length > 0 ? (
        <div className="d-flex flex-column gap-3">
          {evidenceList.map((evidence) => (
            <div className="border rounded-3 bg-white p-2" key={evidence.id}>
              <div className="d-flex flex-column flex-md-row justify-content-between gap-2 small">
                <div className="min-w-0">
                  <div className="fw-semibold text-truncate">
                    {evidence.fileName}
                  </div>
                  <div className="text-muted">
                    {evidence.fileType ?? "Evidence"} ·{" "}
                    {new Date(evidence.uploadedAt).toLocaleString("en-IN")}
                  </div>
                </div>

                {evidence.fileUrl ? (
                  <a
                    href={evidence.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary align-self-start"
                  >
                    View
                    <i className="bi bi-box-arrow-up-right ms-1" />
                  </a>
                ) : null}
              </div>

              {evidence.fileUrl && isImageEvidence(evidence) ? (
                <div className="mt-2">
                  <img
                    src={evidence.fileUrl}
                    alt={evidence.fileName || "Evidence thumbnail"}
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
      ) : null}
    </div>
  );
};

export default AdminSellerEvidencePreview;