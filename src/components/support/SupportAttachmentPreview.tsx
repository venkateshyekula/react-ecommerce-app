import type { SupportTicketAttachment } from "../../types/customerSupport";
import { formatAttachmentSize } from "../../utils/supportAttachmentUtils";

interface SupportAttachmentPreviewProps {
  attachments: SupportTicketAttachment[];
  onRemove?: (attachmentId: string) => void;
}

const getAttachmentIcon = (attachment: SupportTicketAttachment): string => {
  switch (attachment.attachmentType) {
    case "IMAGE":
      return "bi bi-image";
    case "PDF":
      return "bi bi-file-earmark-pdf";
    case "DOCUMENT":
      return "bi bi-file-earmark-text";
    case "OTHER":
    default:
      return "bi bi-paperclip";
  }
};

const SupportAttachmentPreview = ({
  attachments,
  onRemove
}: SupportAttachmentPreviewProps) => {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="support-attachment-list">
      {attachments.map((attachment) => (
        <div className="support-attachment-card" key={attachment.id}>
          <div className="support-attachment-icon">
            <i className={getAttachmentIcon(attachment)} />
          </div>

          <div className="support-attachment-content">
            <strong>{attachment.fileName}</strong>
            <span>{formatAttachmentSize(attachment.fileSize)}</span>
          </div>

          {/* Fixed Conditional Action Buttons */}
          {attachment.attachmentType === "IMAGE" && attachment.dataUrl ? (
            <a 
              href={attachment.dataUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-secondary me-2"
            >
              Preview
            </a>
          ) : attachment.dataUrl || attachment.url ? (
            <a 
              href={attachment.dataUrl || attachment.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-secondary me-2"
            >
              Open
            </a>
          ) : null}

          {onRemove ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => onRemove(attachment.id)}
              aria-label={`Remove attachment ${attachment.fileName}`}
            >
              <i className="bi bi-x-lg" />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export default SupportAttachmentPreview;