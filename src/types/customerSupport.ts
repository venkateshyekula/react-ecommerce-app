export type SupportTicketCategory =
  | "ALL"
  | "ORDER"
  | "RETURN_REFUND"
  | "PAYMENT"
  | "WALLET_REWARDS"
  | "COUPON"
  | "ACCOUNT"
  | "DELIVERY"
  | "OTHER";

export type SupportTicketPriority = | "ALL" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type SupportTicketStatus =
  | "ALL"
  | "OPEN"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "RESOLVED"
  | "CLOSED";

export type SupportTicketMessageAuthorRole =
  | "ALL"
  | "CUSTOMER"
  | "SUPPORT"
  | "SYSTEM";

export type SupportTicketAttachmentType =
  | "IMAGE"
  | "PDF"
  | "DOCUMENT"
  | "OTHER";

export interface SupportTicketAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  attachmentType: SupportTicketAttachmentType;
  dataUrl?: string;
  url?: string;
  uploadedByUserId: string;
  uploadedByName: string;
  uploadedByRole: SupportTicketMessageAuthorRole;
  uploadedAt: string;
}

  export interface SupportTicketMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: SupportTicketMessageAuthorRole;
  message: string;
  createdAt: string;
  attachments?: SupportTicketAttachment[];
}

export interface SupportTicketActivity {
  id: string;
  label: string;
  description: string;
  createdAt: string;
  createdByRole: SupportTicketMessageAuthorRole;
}

export interface CustomerSupportTicket {
  id: string;
  ticketId: string;

  userId: string;
  userName: string;
  userEmail: string;
  attachments?: SupportTicketAttachment[];

  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;

  subject: string;
  message: string;
  orderId?: string;

  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;

  assignedToSupportId?: string;
  assignedToSupportName?: string;

  supportReply?: string;
  internalNote?: string;

  messages?: SupportTicketMessage[];
  activities?: SupportTicketActivity[];

  unreadForCustomer?: boolean;
  unreadForSupport?: boolean;

  slaDueAt?: string;
  slaBreached?: boolean;
  escalated?: boolean;
  escalatedAt?: string;
  escalationReason?: string;
}

export interface CreateCustomerSupportTicketPayload {
  userId: string;
  userName: string;
  userEmail: string;
  attachments?: SupportTicketAttachment[];

  category: SupportTicketCategory;
  priority: SupportTicketPriority;

  subject: string;
  message: string;
  orderId?: string;
}

export interface UpdateSupportTicketPayload {
  status?: SupportTicketStatus;
  supportReply?: string;
  internalNote?: string;
  assignedToSupportId?: string;
  assignedToSupportName?: string;
  resolvedAt?: string;
  closedAt?: string;
  messages?: SupportTicketMessage[];
  attachments?: SupportTicketAttachment[];
  activities?: SupportTicketActivity[];
  unreadForCustomer?: boolean;
  unreadForSupport?: boolean;
  updatedAt?: string;

  slaDueAt?: string;
  slaBreached?: boolean;
  escalated?: boolean;
  escalatedAt?: string;
  escalationReason?: string;
}