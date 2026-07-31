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

export type SupportTicketPriority =
  | "ALL"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

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

export type SupportTicketIssueType =
  | "GENERAL"
  | "RAISE_RETURN_ISSUE"
  | "REFUND_DELAY"
  | "QC_REJECTED"
  | "PICKUP_DELAY"
  | "PICKUP_FAILED"
  | "RETURN_STATUS_QUERY"
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

  /**
   * Phase 12M.5.2
   * Used to map support tickets with return/refund workflow.
   */
  returnRequestId?: string;
  relatedReturnRequestId?: string;
  issueType?: SupportTicketIssueType;

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

  /**
   * Phase 12M.5.2
   * These fields are populated from:
   * /contact-support?category=RETURN_REFUND&orderId=...&returnRequestId=...
   */
  returnRequestId?: string;
  relatedReturnRequestId?: string;
  issueType?: SupportTicketIssueType;

  /**
   * Optional because createTicket service should usually generate these.
   */
  createdAt?: string;
  updatedAt?: string;
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

export interface UpdateSupportTicketPayload {
  category?: SupportTicketCategory;
  priority?: SupportTicketPriority;
  status?: SupportTicketStatus;

  subject?: string;
  message?: string;
  orderId?: string;

  /**
   * Phase 12M.5.2
   * Allows support/admin workflow to update or correct return-ticket mapping.
   */
  returnRequestId?: string;
  relatedReturnRequestId?: string;
  issueType?: SupportTicketIssueType;

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