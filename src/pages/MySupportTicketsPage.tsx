import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import SupportAttachmentPreview from "../components/support/SupportAttachmentPreview";
import SupportConversationThread from "../components/support/SupportConversationThread";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { customerSupportService } from "../services/customerSupportService";
import { notificationService } from "../services/notificationService";
import type {
  CustomerSupportTicket,
  SupportTicketAttachment,
  SupportTicketPriority,
  SupportTicketStatus
} from "../types/customerSupport";
import {
  createSupportTicketActivity,
  createSupportTicketMessage,
  getNextStatusAfterCustomerReply,
  getTicketActivities,
  getTicketMessages
} from "../utils/supportTicketUtils";
import { createSupportTeamCustomerReplyNotification } from "../utils/supportNotificationUtils";
import {
  convertFileToSupportAttachment,
  SUPPORT_ATTACHMENT_MAX_COUNT
} from "../utils/supportAttachmentUtils";

type SupportTimelineItemType =
  | "TICKET_CREATED"
  | "STATUS_UPDATE"
  | "CUSTOMER_MESSAGE"
  | "SUPPORT_MESSAGE"
  | "SYSTEM";

interface SupportTimelineItem {
  id: string;
  label: string;
  description: string;
  actorName: string;
  createdAt: string;
  type: SupportTimelineItemType;
}

const getStatusBadgeClass = (status: SupportTicketStatus): string => {
  switch (status) {
    case "OPEN":
      return "text-bg-warning";
    case "IN_PROGRESS":
      return "text-bg-info";
    case "ON_HOLD":
      return "text-bg-purple";
    case "RESOLVED":
      return "text-bg-success";
    case "CLOSED":
      return "text-bg-secondary";
    default:
      return "text-bg-light";
  }
};

const getPriorityBadgeClass = (priority: SupportTicketPriority): string => {
  switch (priority) {
    case "URGENT":
      return "text-bg-danger";
    case "HIGH":
      return "text-bg-warning";
    case "MEDIUM":
      return "text-bg-info";
    case "LOW":
    default:
      return "text-bg-light border";
  }
};

const formatLabel = (value: string): string => {
  if (!value) {
    return "";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getTicketOptionalValue = (
  ticket: CustomerSupportTicket,
  keys: string[]
): string => {
  const source = ticket as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
};

const isMessageLikeActivity = (label: string): boolean => {
  const normalizedLabel = label.toLowerCase();

  return (
    normalizedLabel.includes("support replied") ||
    normalizedLabel.includes("customer replied")
  );
};

const getSupportTimelineItems = (
  ticket: CustomerSupportTicket
): SupportTimelineItem[] => {
  const activityItems: SupportTimelineItem[] = getTicketActivities(ticket)
    .filter((activity) => !isMessageLikeActivity(activity.label))
    .map((activity) => ({
      id: `activity-${activity.id}`,
      label: activity.label,
      description: activity.description,
      actorName:
        activity.createdByRole === "SUPPORT"
          ? ticket.assignedToSupportName ?? "Support Team"
          : activity.createdByRole === "CUSTOMER"
            ? ticket.userName
            : "ShopEase System",
      createdAt: activity.createdAt,
      type: activity.label.toLowerCase().includes("created")
        ? "TICKET_CREATED"
        : activity.label.toLowerCase().includes("status") ||
            activity.label.toLowerCase().includes("updated")
          ? "STATUS_UPDATE"
          : "SYSTEM"
    }));

  const messageItems: SupportTimelineItem[] = getTicketMessages(ticket).map(
    (message) => ({
      id: `message-${message.id}`,
      label:
        message.authorRole === "SUPPORT"
          ? "Support Agent Replied"
          : message.authorRole === "CUSTOMER"
            ? "Customer Replied"
            : "System Message",
      description: message.message,
      actorName: message.authorName,
      createdAt: message.createdAt,
      type:
        message.authorRole === "SUPPORT"
          ? "SUPPORT_MESSAGE"
          : message.authorRole === "CUSTOMER"
            ? "CUSTOMER_MESSAGE"
            : "SYSTEM"
    })
  );

  const timelineItems = [...activityItems, ...messageItems].sort(
    (firstItem, secondItem) =>
      new Date(firstItem.createdAt).getTime() -
      new Date(secondItem.createdAt).getTime()
  );

  const uniqueTimelineItems = new Map<string, SupportTimelineItem>();

  timelineItems.forEach((item) => {
    const uniqueKey = `${item.label}-${item.description}-${item.createdAt}`;

    if (!uniqueTimelineItems.has(uniqueKey)) {
      uniqueTimelineItems.set(uniqueKey, item);
    }
  });

  return Array.from(uniqueTimelineItems.values());
};

const getTimelineIconClass = (type: SupportTimelineItemType): string => {
  switch (type) {
    case "TICKET_CREATED":
      return "bi bi-ticket-detailed";
    case "CUSTOMER_MESSAGE":
      return "bi bi-person-lines-fill";
    case "SUPPORT_MESSAGE":
      return "bi bi-headset";
    case "STATUS_UPDATE":
      return "bi bi-arrow-repeat";
    case "SYSTEM":
    default:
      return "bi bi-info-circle";
  }
};

const getTimelineStepClass = (
  type: SupportTimelineItemType,
  index: number,
  totalItems: number
): string => {
  const stateClass = index === totalItems - 1 ? "active" : "completed";

  switch (type) {
    case "SUPPORT_MESSAGE":
      return `${stateClass} support`;
    case "CUSTOMER_MESSAGE":
      return `${stateClass} customer`;
    case "STATUS_UPDATE":
      return `${stateClass} status`;
    case "TICKET_CREATED":
      return `${stateClass} created`;
    case "SYSTEM":
    default:
      return `${stateClass} system`;
  }
};

const getTimelineStepDescription = (type: SupportTimelineItemType): string => {
  switch (type) {
    case "TICKET_CREATED":
      return "Support ticket has been created and is waiting for review.";
    case "SUPPORT_MESSAGE":
      return "Support team added a reply for the customer.";
    case "CUSTOMER_MESSAGE":
      return "Customer added more information to the ticket.";
    case "STATUS_UPDATE":
      return "Ticket status was updated by the support workflow.";
    case "SYSTEM":
    default:
      return "Ticket activity was recorded.";
  }
};

const MIN_CUSTOMER_REPLY_LENGTH = 2;
const MAX_CUSTOMER_REPLY_LENGTH = 1000;

const validateCustomerReply = ({
  ticket,
  replyText,
  attachmentCount
}: {
  ticket: CustomerSupportTicket;
  replyText: string;
  attachmentCount: number;
}): string | null => {
  const trimmedReply = replyText.trim();

  if (ticket.status === "CLOSED") {
    return "Closed tickets cannot be replied to.";
  }

  if (!trimmedReply && attachmentCount === 0) {
    return "Please enter a message or attach evidence before sending your reply.";
  }

  if (
    trimmedReply.length > 0 &&
    trimmedReply.length < MIN_CUSTOMER_REPLY_LENGTH
  ) {
    return `Reply should be at least ${MIN_CUSTOMER_REPLY_LENGTH} characters.`;
  }

  if (trimmedReply.length > MAX_CUSTOMER_REPLY_LENGTH) {
    return `Reply should not exceed ${MAX_CUSTOMER_REPLY_LENGTH} characters.`;
  }

  return null;
};

const buildContactSupportUrl = ({
  orderId,
  returnRequestId
}: {
  orderId?: string;
  returnRequestId?: string;
}): string => {
  const params = new URLSearchParams();

  if (orderId || returnRequestId) {
    params.set("category", "RETURN_REFUND");
  }

  if (orderId) {
    params.set("orderId", orderId);
  }

  if (returnRequestId) {
    params.set("returnRequestId", returnRequestId);
  }

  if (orderId) {
    params.set("subject", `Return / Refund issue for order ${orderId}`);
  }

  return params.toString()
    ? `/contact-support?${params.toString()}`
    : "/contact-support";
};

const MySupportTicketsPage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orderIdFilter = searchParams.get("orderId")?.trim() ?? "";
  const returnRequestIdFilter =
    searchParams.get("returnRequestId")?.trim() ?? "";
  const supportRequestIdFilter =
    searchParams.get("supportRequestId")?.trim() ??
    searchParams.get("ticketId")?.trim() ??
    "";

  const [tickets, setTickets] = useState<CustomerSupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [replyByTicketId, setReplyByTicketId] = useState<
    Record<string, string>
  >({});
  const [attachmentsByTicketId, setAttachmentsByTicketId] = useState<
    Record<string, SupportTicketAttachment[]>
  >({});
  const [replyingTicketId, setReplyingTicketId] = useState<string>("");

  const ticketRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const loadTickets = useCallback(async (): Promise<void> => {
    if (!currentUser) {
      navigate("/login", {
        replace: true
      });
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await customerSupportService.getTicketsByUserId(
        currentUser.id
      );

      setTickets(
        [...data].sort(
          (first, second) =>
            new Date(second.createdAt).getTime() -
            new Date(first.createdAt).getTime()
        )
      );
    } catch {
      setErrorMessage(
        "Unable to load support tickets. Please make sure JSON Server is running."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const summary = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "OPEN").length,
      inProgress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS")
        .length,
      onHold: tickets.filter((ticket) => ticket.status === "ON_HOLD").length,
      resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
      closed: tickets.filter((ticket) => ticket.status === "CLOSED").length
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const hasOrderFilter = orderIdFilter.length > 0;
    const hasReturnRequestFilter = returnRequestIdFilter.length > 0;
    const hasSupportRequestFilter = supportRequestIdFilter.length > 0;

    if (!hasOrderFilter && !hasReturnRequestFilter && !hasSupportRequestFilter) {
      return tickets;
    }

    return tickets.filter((ticket) => {
      const ticketOrderId = ticket.orderId ?? "";

      const ticketReturnRequestId = getTicketOptionalValue(ticket, [
        "returnRequestId",
        "relatedReturnRequestId",
        "returnId"
      ]);

      const ticketSupportRequestId = getTicketOptionalValue(ticket, [
        "ticketId",
        "supportRequestId",
        "id"
      ]);

      const matchesOrder = !hasOrderFilter || ticketOrderId === orderIdFilter;

      const matchesReturnRequest =
        !hasReturnRequestFilter ||
        ticketReturnRequestId === returnRequestIdFilter ||
        ticket.message.includes(returnRequestIdFilter) ||
        ticket.subject.includes(returnRequestIdFilter);

      const matchesSupportRequest =
        !hasSupportRequestFilter ||
        ticketSupportRequestId === supportRequestIdFilter;

      return matchesOrder && matchesReturnRequest && matchesSupportRequest;
    });
  }, [tickets, orderIdFilter, returnRequestIdFilter, supportRequestIdFilter]);

  const hasContextFilter =
    orderIdFilter.length > 0 ||
    returnRequestIdFilter.length > 0 ||
    supportRequestIdFilter.length > 0;

  const highlightedTicketId = useMemo(() => {
    if (filteredTickets.length === 0) {
      return "";
    }

    if (supportRequestIdFilter) {
      const ticketBySupportId = filteredTickets.find((ticket) => {
        return (
          ticket.ticketId === supportRequestIdFilter ||
          ticket.id === supportRequestIdFilter
        );
      });

      if (ticketBySupportId) {
        return ticketBySupportId.id;
      }
    }

    if (hasContextFilter) {
      return filteredTickets[0].id;
    }

    return "";
  }, [filteredTickets, hasContextFilter, supportRequestIdFilter]);

  useEffect(() => {
    if (!highlightedTicketId) {
      return;
    }

    const scrollTimer = window.setTimeout(() => {
      ticketRefs.current[highlightedTicketId]?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 300);

    return () => window.clearTimeout(scrollTimer);
  }, [highlightedTicketId]);

  const handleReplyAttachmentChange = async (
    ticketId: string,
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    if (!currentUser || !event.target.files) {
      return;
    }

    const existingAttachments = attachmentsByTicketId[ticketId] ?? [];
    const selectedFiles = Array.from(event.target.files);

    if (
      existingAttachments.length + selectedFiles.length >
      SUPPORT_ATTACHMENT_MAX_COUNT
    ) {
      showToast(
        "Attachment limit reached",
        `You can upload up to ${SUPPORT_ATTACHMENT_MAX_COUNT} files.`,
        "warning"
      );
      event.target.value = "";
      return;
    }

    try {
      const convertedAttachments = await Promise.all(
        selectedFiles.map((file) =>
          convertFileToSupportAttachment({
            file,
            uploadedByUserId: currentUser.id,
            uploadedByName: currentUser.name,
            uploadedByRole: "CUSTOMER"
          })
        )
      );

      setAttachmentsByTicketId((previousValues) => ({
        ...previousValues,
        [ticketId]: [...existingAttachments, ...convertedAttachments]
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to attach selected file.";

      showToast("Attachment failed", message, "danger");
    } finally {
      event.target.value = "";
    }
  };

  const handleRemoveReplyAttachment = (
    ticketId: string,
    attachmentId: string
  ): void => {
    setAttachmentsByTicketId((previousValues) => ({
      ...previousValues,
      [ticketId]: (previousValues[ticketId] ?? []).filter(
        (attachment) => attachment.id !== attachmentId
      )
    }));
  };

  const handleCustomerReply = async (
    ticket: CustomerSupportTicket
  ): Promise<void> => {
    if (!currentUser) {
      return;
    }

    const replyText = replyByTicketId[ticket.id]?.trim() ?? "";
    const replyAttachments = attachmentsByTicketId[ticket.id] ?? [];

    const validationMessage = validateCustomerReply({
      ticket,
      replyText,
      attachmentCount: replyAttachments.length
    });

    if (validationMessage) {
      showToast("Reply validation failed", validationMessage, "warning");
      return;
    }

    try {
      setReplyingTicketId(ticket.id);

      const existingMessages = getTicketMessages(ticket);
      const existingActivities = getTicketActivities(ticket);
      const willReopenTicket = ticket.status === "RESOLVED";
      const replyMessage = replyText || "Customer added attachment evidence.";

      const nextMessage = createSupportTicketMessage({
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: "CUSTOMER",
        message: replyMessage,
        attachments: replyAttachments
      });

      const nextActivity = createSupportTicketActivity({
        label: willReopenTicket ? "Ticket Reopened" : "Customer Replied",
        description: willReopenTicket
          ? `${currentUser.name} reopened the ticket by adding a reply.`
          : `${currentUser.name} added a reply.`,
        createdByRole: "CUSTOMER"
      });

      const updatedTicket = await customerSupportService.updateTicket(
        ticket.id,
        {
          status: getNextStatusAfterCustomerReply(ticket.status),
          messages: [...existingMessages, nextMessage],
          activities: [...existingActivities, nextActivity],
          unreadForSupport: true,
          unreadForCustomer: false
        }
      );

      await notificationService.createNotification(
        createSupportTeamCustomerReplyNotification(updatedTicket)
      );

      setTickets((previousTickets) =>
        previousTickets.map((existingTicket) =>
          existingTicket.id === updatedTicket.id
            ? updatedTicket
            : existingTicket
        )
      );

      setReplyByTicketId((previousValues) => ({
        ...previousValues,
        [ticket.id]: ""
      }));

      setAttachmentsByTicketId((previousValues) => ({
        ...previousValues,
        [ticket.id]: []
      }));

      showToast(
        willReopenTicket ? "Ticket reopened" : "Reply sent",
        willReopenTicket
          ? `Your reply reopened ticket ${updatedTicket.ticketId}.`
          : `Your reply was added to ticket ${updatedTicket.ticketId}.`,
        "success"
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to add reply. Please try again.";

      setErrorMessage(message);
      showToast("Reply failed", message, "danger");
    } finally {
      setReplyingTicketId("");
    }
  };

  if (isLoading) {
    return (
      <main className="support-tickets-page bg-light">
        <div className="container-fluid py-5">
          <Loader message="Loading support tickets..." />
        </div>
      </main>
    );
  }

  return (
    <main className="support-tickets-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">My Support Tickets</h1>
              <p className="text-muted mb-0">
                Track support requests submitted to ShopEase support.
              </p>
            </div>

            <Link
              to="/contact-support"
              className="btn btn-primary support-header-action-btn"
            >
              <i className="bi bi-plus-lg me-2" />
              New Ticket
            </Link>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        {errorMessage ? (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        ) : null}

        <div className="row g-3 mb-4">
          <div className="col-md col-6">
            <div className="support-summary-tile bg-white border rounded-4 p-3">
              <span>Total</span>
              <strong>{summary.total}</strong>
            </div>
          </div>

          <div className="col-md col-6">
            <div className="support-summary-tile bg-white border rounded-4 p-3">
              <span>Open</span>
              <strong>{summary.open}</strong>
            </div>
          </div>

          <div className="col-md col-6">
            <div className="support-summary-tile bg-white border rounded-4 p-3">
              <span>In Progress</span>
              <strong>{summary.inProgress}</strong>
            </div>
          </div>

          <div className="col-md col-6">
            <div className="support-summary-tile bg-white border rounded-4 p-3">
              <span>On Hold</span>
              <strong>{summary.onHold}</strong>
            </div>
          </div>

          <div className="col-md col-6">
            <div className="support-summary-tile bg-white border rounded-4 p-3">
              <span>Resolved</span>
              <strong>{summary.resolved}</strong>
            </div>
          </div>

          <div className="col-md col-6">
            <div className="support-summary-tile bg-white border rounded-4 p-3">
              <span>Closed</span>
              <strong>{summary.closed}</strong>
            </div>
          </div>
        </div>

        {hasContextFilter ? (
          <div className="alert alert-info d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <strong>Return support context</strong>
              <div className="small">
                {orderIdFilter ? (
                  <>
                    Order ID: <strong>{orderIdFilter}</strong>{" "}
                  </>
                ) : null}

                {returnRequestIdFilter ? (
                  <>
                    Return ID: <strong>{returnRequestIdFilter}</strong>{" "}
                  </>
                ) : null}

                {supportRequestIdFilter ? (
                  <>
                    Ticket ID: <strong>{supportRequestIdFilter}</strong>
                  </>
                ) : null}
              </div>
              <div className="small text-muted mt-1">
                Showing tickets linked to the selected return/order. The matched
                ticket will be highlighted automatically.
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <Link
                to={buildContactSupportUrl({
                  orderId: orderIdFilter,
                  returnRequestId: returnRequestIdFilter
                })}
                className="btn btn-sm btn-outline-dark"
              >
                <i className="bi bi-plus-lg me-2" />
                Create Ticket
              </Link>

              <Link
                to="/support-tickets"
                className="btn btn-sm btn-outline-primary"
              >
                View All Tickets
              </Link>
            </div>
          </div>
        ) : null}

        {filteredTickets.length === 0 ? (
          <EmptyState
            title="No Support Tickets Found"
            message="You haven't submitted any support requests matching this criteria."
            action={
              <Link
                to={buildContactSupportUrl({
                  orderId: orderIdFilter,
                  returnRequestId: returnRequestIdFilter
                })}
                className="btn btn-primary"
              >
                Create Ticket
              </Link>
            }
          />
        ) : (
          <div className="support-ticket-list d-flex flex-column gap-3">
            {filteredTickets.map((ticket) => {
              const ticketMessages = getTicketMessages(ticket);
              const timelineItems = getSupportTimelineItems(ticket);
              const isClosed = ticket.status === "CLOSED";
              const returnRequestId = getTicketOptionalValue(ticket, [
                "returnRequestId",
                "relatedReturnRequestId",
                "returnId"
              ]);
              const isHighlighted = highlightedTicketId === ticket.id;

              return (
                <div
                  ref={(node) => {
                    ticketRefs.current[ticket.id] = node;
                  }}
                  className={`support-ticket-card bg-white border p-4 rounded-3 ${
                    isHighlighted
                      ? "border-primary shadow support-ticket-highlighted"
                      : ""
                  }`}
                  key={ticket.id}
                >
                  {isHighlighted ? (
                    <div className="alert alert-primary py-2 px-3 small mb-3">
                      <i className="bi bi-link-45deg me-2" />
                      You are viewing the related support ticket for the
                      selected order or return.
                    </div>
                  ) : null}

                  <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                    <div>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        <span className="badge text-bg-light border">
                          {ticket.ticketId}
                        </span>

                        <span
                          className={`badge ${getStatusBadgeClass(
                            ticket.status
                          )}`}
                        >
                          {formatLabel(ticket.status)}
                        </span>

                        <span
                          className={`badge ${getPriorityBadgeClass(
                            ticket.priority
                          )}`}
                        >
                          {formatLabel(ticket.priority)}
                        </span>

                        <span className="badge text-bg-light border">
                          {formatLabel(ticket.category)}
                        </span>

                        {returnRequestId ? (
                          <span className="badge text-bg-primary">
                            Return Linked
                          </span>
                        ) : null}

                        {ticket.unreadForCustomer ? (
                          <span className="badge text-bg-primary">
                            New Update
                          </span>
                        ) : null}
                      </div>

                      <h5 className="fw-bold mb-2">{ticket.subject}</h5>
                      <p className="text-muted mb-2">{ticket.message}</p>

                      {ticket.orderId ? (
                        <p className="small text-muted mb-0">
                          Order ID: <strong>{ticket.orderId}</strong>
                        </p>
                      ) : null}

                      {returnRequestId ? (
                        <p className="small text-muted mb-0">
                          Return ID: <strong>{returnRequestId}</strong>
                        </p>
                      ) : null}
                    </div>

                    <div className="text-lg-end small text-muted">
                      <div>
                        Created:{" "}
                        {new Date(ticket.createdAt).toLocaleString("en-IN")}
                      </div>
                      <div>
                        Updated:{" "}
                        {new Date(ticket.updatedAt).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <SupportConversationThread
                      messages={ticketMessages}
                      title="Conversation"
                    />
                  </div>

                  <div className="support-ticket-progress-card mt-3">
                    <div className="support-ticket-progress-header">
                      <div>
                        <h5 className="fw-bold mb-1">Ticket Activity</h5>
                        <p className="mb-0 text-muted">
                          Current Status:{" "}
                          <strong>{formatLabel(ticket.status)}</strong>
                        </p>
                      </div>

                      <span
                        className={`support-ticket-status-pill ${ticket.status.toLowerCase()}`}
                      >
                        {formatLabel(ticket.status)}
                      </span>
                    </div>

                    <div className="support-ticket-progress-timeline">
                      {timelineItems.map((timelineItem, index) => (
                        <div
                          className={`support-ticket-progress-step ${getTimelineStepClass(
                            timelineItem.type,
                            index,
                            timelineItems.length
                          )}`}
                          key={timelineItem.id}
                        >
                          <div className="support-ticket-progress-marker">
                            <span className="support-ticket-progress-icon">
                              <i
                                className={getTimelineIconClass(
                                  timelineItem.type
                                )}
                              />
                            </span>
                          </div>

                          <div className="support-ticket-progress-content">
                            <h6>{timelineItem.label}</h6>
                            <p className="support-ticket-progress-description">
                              {getTimelineStepDescription(timelineItem.type)}
                            </p>

                            <div className="support-ticket-progress-event">
                              <span className="support-ticket-event-dot" />
                              <div className="support-ticket-event-card">
                                <strong>{timelineItem.label}</strong>
                                <p>{timelineItem.description}</p>
                                <div className="support-ticket-event-meta">
                                  <span>
                                    <i className="bi bi-person-badge" />
                                    {timelineItem.actorName}
                                  </span>
                                  <span>
                                    <i className="bi bi-clock" />
                                    {new Date(
                                      timelineItem.createdAt
                                    ).toLocaleString("en-IN")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!isClosed ? (
                    <div className="ticket-reply-box mt-3">
                      <label className="form-label fw-semibold">
                        Add Reply
                      </label>

                      <textarea
                        className="form-control"
                        rows={3}
                        maxLength={MAX_CUSTOMER_REPLY_LENGTH}
                        placeholder="Type your reply..."
                        value={replyByTicketId[ticket.id] ?? ""}
                        onChange={(event) =>
                          setReplyByTicketId((previousValues) => ({
                            ...previousValues,
                            [ticket.id]: event.target.value
                          }))
                        }
                      />

                      <div className="file-upload mt-3">
                        <input
                          id={`supportAttachments-${ticket.id}`}
                          type="file"
                          className="form-control"
                          multiple
                          accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf,text/plain,.doc,.docx"
                          onChange={(event) =>
                            void handleReplyAttachmentChange(ticket.id, event)
                          }
                        />
                        <div className="form-text">
                          Upload up to 3 files. Supported: images, PDF, DOC,
                          DOCX, TXT. Max 3 MB each.
                        </div>
                      </div>

                      <SupportAttachmentPreview
                        attachments={attachmentsByTicketId[ticket.id] ?? []}
                        onRemove={(attachmentId) =>
                          handleRemoveReplyAttachment(ticket.id, attachmentId)
                        }
                      />

                      <div className="d-flex justify-content-end mt-2">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={
                            replyingTicketId === ticket.id ||
                            (!(replyByTicketId[ticket.id] ?? "").trim() &&
                              (attachmentsByTicketId[ticket.id] ?? [])
                                .length === 0)
                          }
                          onClick={() => void handleCustomerReply(ticket)}
                        >
                          {replyingTicketId === ticket.id ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" />
                              Sending...
                            </>
                          ) : (
                            "Send Reply"
                          )}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default MySupportTicketsPage;