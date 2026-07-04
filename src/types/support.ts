export type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type SupportTicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  orderId?: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  response?: string;
}

export type CreateSupportTicketPayload = Omit<
  SupportTicket,
  "id" | "ticketNumber" | "createdAt" | "updatedAt"
>;

export interface UpdateSupportTicketPayload {
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  assignedTo?: string;
  response?: string;
  updatedAt?: string;
}