import type {
  SupportTicketAttachment,
  SupportTicketAttachmentType,
  SupportTicketMessageAuthorRole
} from "../types/customerSupport";

export const SUPPORT_ATTACHMENT_MAX_SIZE_MB = 3;
export const SUPPORT_ATTACHMENT_MAX_COUNT = 3;

const SUPPORTED_ATTACHMENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

export const getAttachmentType = (
  fileType: string
): SupportTicketAttachmentType => {
  if (fileType.startsWith("image/")) {
    return "IMAGE";
  }

  if (fileType === "application/pdf") {
    return "PDF";
  }

  if (
    fileType === "application/msword" ||
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "text/plain"
  ) {
    return "DOCUMENT";
  }

  return "OTHER";
};

export const formatAttachmentSize = (fileSize: number): string => {
  if (fileSize < 1024) {
    return `${fileSize} B`;
  }

  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
};

export const validateSupportAttachmentFile = (file: File): string | null => {
  const maxSizeBytes = SUPPORT_ATTACHMENT_MAX_SIZE_MB * 1024 * 1024;

  if (!SUPPORTED_ATTACHMENT_TYPES.includes(file.type)) {
    return "Unsupported file type. Please upload image, PDF, DOC, DOCX, or TXT files.";
  }

  if (file.size > maxSizeBytes) {
    return `File size should be less than ${SUPPORT_ATTACHMENT_MAX_SIZE_MB} MB.`;
  }

  return null;
};

export const convertFileToSupportAttachment = ({
  file,
  uploadedByUserId,
  uploadedByName,
  uploadedByRole
}: {
  file: File;
  uploadedByUserId: string;
  uploadedByName: string;
  uploadedByRole: SupportTicketMessageAuthorRole;
}): Promise<SupportTicketAttachment> => {
  return new Promise((resolve, reject) => {
    const validationError = validateSupportAttachmentFile(file);

    if (validationError) {
      reject(new Error(validationError));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        id: `support-attachment-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        attachmentType: getAttachmentType(file.type),
        dataUrl: String(reader.result),
        uploadedByUserId,
        uploadedByName,
        uploadedByRole,
        uploadedAt: new Date().toISOString()
      });
    };

    reader.onerror = () => {
      reject(new Error("Unable to read attachment file."));
    };

    reader.readAsDataURL(file);
  });
};