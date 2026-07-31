import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/common/Button";
import FormInput from "../components/common/FormInput";
import SupportAttachmentPreview from "../components/support/SupportAttachmentPreview";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { customerSupportService } from "../services/customerSupportService";
import { notificationService } from "../services/notificationService";
import type {
  CustomerSupportTicket,
  SupportTicketAttachment,
  SupportTicketCategory,
  SupportTicketIssueType,
  SupportTicketPriority,
  SupportTicketStatus
} from "../types/customerSupport";
import {
  convertFileToSupportAttachment,
  SUPPORT_ATTACHMENT_MAX_COUNT
} from "../utils/supportAttachmentUtils";
import { createSupportTeamNewTicketNotification } from "../utils/supportNotificationUtils";

interface ContactSupportFormValues {
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  subject: string;
  message: string;
  orderId: string;
  returnRequestId: string;
  issueType: SupportTicketIssueType;
}

const initialValues: ContactSupportFormValues = {
  category: "ORDER",
  priority: "MEDIUM",
  subject: "",
  message: "",
  orderId: "",
  returnRequestId: "",
  issueType: "GENERAL"
};

const categoryOptions: Array<{
  label: string;
  value: SupportTicketCategory;
}> = [
  { label: "Order", value: "ORDER" },
  { label: "Return / Refund", value: "RETURN_REFUND" },
  { label: "Payment", value: "PAYMENT" },
  { label: "Wallet / Rewards", value: "WALLET_REWARDS" },
  { label: "Coupon", value: "COUPON" },
  { label: "Account", value: "ACCOUNT" },
  { label: "Delivery", value: "DELIVERY" },
  { label: "Other", value: "OTHER" }
];

const priorityOptions: Array<{
  label: string;
  value: SupportTicketPriority;
}> = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Urgent", value: "URGENT" }
];

const validIssueTypes: SupportTicketIssueType[] = [
  "GENERAL",
  "RAISE_RETURN_ISSUE",
  "REFUND_DELAY",
  "QC_REJECTED",
  "PICKUP_DELAY",
  "PICKUP_FAILED",
  "RETURN_STATUS_QUERY",
  "OTHER"
];

const activeDuplicateStatuses: SupportTicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "ON_HOLD",
  "RESOLVED"
];

const MIN_SUBJECT_LENGTH = 8;
const MAX_SUBJECT_LENGTH = 120;
const MIN_MESSAGE_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 1500;
const MAX_DUPLICATE_REASON_LENGTH = 300;
const ORDER_ID_PATTERN = /^(ORD|ORDER)-[A-Z0-9-]+$/i;

const validCategories = categoryOptions.map((option) => option.value);
const validPriorities = priorityOptions.map((option) => option.value);

const getValidIssueType = (
  value: string | null | undefined
): SupportTicketIssueType => {
  if (value && validIssueTypes.includes(value as SupportTicketIssueType)) {
    return value as SupportTicketIssueType;
  }

  return "GENERAL";
};

const getValidCategory = (
  value: string | null | undefined
): SupportTicketCategory => {
  if (value && validCategories.includes(value as SupportTicketCategory)) {
    return value as SupportTicketCategory;
  }

  return "ORDER";
};

const getValidPriority = (
  value: string | null | undefined
): SupportTicketPriority => {
  if (value && validPriorities.includes(value as SupportTicketPriority)) {
    return value as SupportTicketPriority;
  }

  return "MEDIUM";
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

const formatLabel = (value: string): string => {
  if (!value) {
    return "";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatDateTime = (dateValue?: string): string => {
  if (!dateValue) {
    return "-";
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleString("en-IN");
};

const buildReturnMessageTemplate = ({
  orderId,
  returnRequestId,
  issueType
}: {
  orderId: string;
  returnRequestId: string;
  issueType: SupportTicketIssueType;
}): string => {
  const heading =
    issueType === "RAISE_RETURN_ISSUE"
      ? "I need help with my return request."
      : "I need support for my return/refund.";

  return [
    heading,
    "",
    orderId ? `Order ID: ${orderId}` : "",
    returnRequestId ? `Return Request ID: ${returnRequestId}` : "",
    "",
    "Issue details:"
  ]
    .filter(Boolean)
    .join("\n");
};

const buildSupportTicketsUrl = ({
  orderId,
  returnRequestId,
  ticketId
}: {
  orderId?: string;
  returnRequestId?: string;
  ticketId?: string;
}): string => {
  const params = new URLSearchParams();

  if (orderId) {
    params.set("orderId", orderId);
  }

  if (returnRequestId) {
    params.set("returnRequestId", returnRequestId);
  }

  if (ticketId) {
    params.set("ticketId", ticketId);
  }

  return params.toString()
    ? `/support-tickets?${params.toString()}`
    : "/support-tickets";
};

const ContactSupportPage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const returnSupportPrefill = useMemo(() => {
    const orderId = searchParams.get("orderId")?.trim() ?? "";
    const returnRequestId = searchParams.get("returnRequestId")?.trim() ?? "";
    const issueType = getValidIssueType(searchParams.get("issueType")?.trim());
    const requestedCategory = searchParams.get("category")?.trim();
    const requestedSubject = searchParams.get("subject")?.trim();

    const category: SupportTicketCategory =
      requestedCategory === "RETURN_REFUND" ? "RETURN_REFUND" : "ORDER";

    const subject =
      requestedSubject ||
      (orderId
        ? `Return / Refund issue for order ${orderId}`
        : "Return / Refund issue");

    const message = buildReturnMessageTemplate({
      orderId,
      returnRequestId,
      issueType
    });

    return {
      category,
      orderId,
      returnRequestId,
      issueType,
      subject,
      message
    };
  }, [searchParams]);

  const [values, setValues] =
    useState<ContactSupportFormValues>(initialValues);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactSupportFormValues, string>>
  >({});
  const [serverError, setServerError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<SupportTicketAttachment[]>([]);
  const [existingReturnTickets, setExistingReturnTickets] = useState<
    CustomerSupportTicket[]
  >([]);
  const [isCheckingExistingTickets, setIsCheckingExistingTickets] =
    useState<boolean>(false);
  const [allowDuplicateCreation, setAllowDuplicateCreation] =
    useState<boolean>(false);
  const [duplicateReason, setDuplicateReason] = useState<string>("");

  const primaryExistingTicket = existingReturnTickets[0] ?? null;
  const hasDuplicateTicket = existingReturnTickets.length > 0;
  const shouldBlockDuplicateSubmit =
    hasDuplicateTicket && !allowDuplicateCreation;

  // Initialize form state once from URL search params
  useEffect(() => {
    if (
      !returnSupportPrefill.orderId &&
      !returnSupportPrefill.returnRequestId &&
      returnSupportPrefill.category !== "RETURN_REFUND"
    ) {
      return;
    }

    setValues((previousValues) => ({
      ...previousValues,
      category: returnSupportPrefill.category,
      orderId: returnSupportPrefill.orderId || previousValues.orderId,
      returnRequestId:
        returnSupportPrefill.returnRequestId ||
        previousValues.returnRequestId,
      issueType: returnSupportPrefill.issueType,
      subject: returnSupportPrefill.subject || previousValues.subject,
      message:
        previousValues.message.trim().length > 0
          ? previousValues.message
          : returnSupportPrefill.message
    }));
  }, [returnSupportPrefill]);

  // Check for duplicate active tickets dynamically based on values.orderId and values.returnRequestId
  useEffect(() => {
    const checkExistingReturnTickets = async (): Promise<void> => {
      if (!currentUser) {
        setExistingReturnTickets([]);
        setAllowDuplicateCreation(false);
        setDuplicateReason("");
        return;
      }

      const orderId = values.orderId.trim();
      const returnRequestId = values.returnRequestId.trim();

      if (!orderId && !returnRequestId) {
        setExistingReturnTickets([]);
        setAllowDuplicateCreation(false);
        setDuplicateReason("");
        return;
      }

      try {
        setIsCheckingExistingTickets(true);

        const userTickets = await customerSupportService.getTicketsByUserId(
          currentUser.id
        );

        const matchingTickets = userTickets.filter((ticket) => {
          const ticketReturnRequestId = getTicketOptionalValue(ticket, [
            "returnRequestId",
            "relatedReturnRequestId",
            "returnId"
          ]);

          const matchesOrder = !orderId || ticket.orderId === orderId;

          const matchesReturn =
            !returnRequestId ||
            ticketReturnRequestId === returnRequestId ||
            ticket.subject.includes(returnRequestId) ||
            ticket.message.includes(returnRequestId);

          return (
            ticket.category === "RETURN_REFUND" &&
            activeDuplicateStatuses.includes(ticket.status) &&
            matchesOrder &&
            matchesReturn
          );
        });

        setExistingReturnTickets(matchingTickets);
        setAllowDuplicateCreation(false);
        setDuplicateReason("");
      } catch {
        setExistingReturnTickets([]);
        setAllowDuplicateCreation(false);
        setDuplicateReason("");
      } finally {
        setIsCheckingExistingTickets(false);
      }
    };

    void checkExistingReturnTickets();
  }, [currentUser, values.orderId, values.returnRequestId]);

  const handleAttachmentChange = async (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    if (!currentUser || !event.target.files) {
      return;
    }

    const selectedFiles = Array.from(event.target.files);

    if (
      attachments.length + selectedFiles.length >
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

      setAttachments((previousAttachments) => [
        ...previousAttachments,
        ...convertedAttachments
      ]);
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

  const handleRemoveAttachment = (attachmentId: string): void => {
    setAttachments((previousAttachments) =>
      previousAttachments.filter((attachment) => attachment.id !== attachmentId)
    );
  };

  const handleInputChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ): void => {
    const { name, value } = event.target;
    const fieldName = name as keyof ContactSupportFormValues;

    setValues((previousValues) => {
      if (fieldName === "category") {
        return {
          ...previousValues,
          category: getValidCategory(value)
        };
      }

      if (fieldName === "priority") {
        return {
          ...previousValues,
          priority: getValidPriority(value)
        };
      }

      if (fieldName === "issueType") {
        return {
          ...previousValues,
          issueType: getValidIssueType(value)
        };
      }

      return {
        ...previousValues,
        [fieldName]: value // Fixed computed property key!
      };
    });

    setErrors((previousErrors) => {
      const nextErrors = { ...previousErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });

    setServerError("");
  };

  const validateForm = (): boolean => {
    const nextErrors: Partial<
      Record<keyof ContactSupportFormValues, string>
    > = {};

    const normalizedSubject = values.subject.trim();
    const normalizedMessage = values.message.trim();
    const normalizedOrderId = values.orderId.trim();
    const normalizedReturnRequestId = values.returnRequestId.trim();

    if (!values.category || !validCategories.includes(values.category)) {
      nextErrors.category = "Please select a valid support category.";
    }

    if (!values.priority || !validPriorities.includes(values.priority)) {
      nextErrors.priority = "Please select a valid priority.";
    }

    if (!normalizedSubject) {
      nextErrors.subject = "Subject is required.";
    } else if (normalizedSubject.length < MIN_SUBJECT_LENGTH) {
      nextErrors.subject = `Subject should be at least ${MIN_SUBJECT_LENGTH} characters.`;
    } else if (normalizedSubject.length > MAX_SUBJECT_LENGTH) {
      nextErrors.subject = `Subject should not exceed ${MAX_SUBJECT_LENGTH} characters.`;
    }

    if (!normalizedMessage) {
      nextErrors.message = "Message is required.";
    } else if (normalizedMessage.length < MIN_MESSAGE_LENGTH) {
      nextErrors.message = `Please describe the issue in at least ${MIN_MESSAGE_LENGTH} characters.`;
    } else if (normalizedMessage.length > MAX_MESSAGE_LENGTH) {
      nextErrors.message = `Message should not exceed ${MAX_MESSAGE_LENGTH} characters.`;
    }

    if (normalizedOrderId && !ORDER_ID_PATTERN.test(normalizedOrderId)) {
      nextErrors.orderId = "Order ID should start with ORD- or ORDER-.";
    }

    if (
      values.category === "RETURN_REFUND" &&
      normalizedReturnRequestId.length === 0
    ) {
      nextErrors.returnRequestId =
        "Return Request ID is required for return/refund issues.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (!currentUser) {
      showToast("Login required", "Please login to contact support.", "warning");
      navigate("/login", { replace: true });
      return;
    }

    const isValid = validateForm();

    if (!isValid) {
      showToast(
        "Please fix the highlighted fields",
        "Complete the required support details before submitting.",
        "warning"
      );
      return;
    }

    if (shouldBlockDuplicateSubmit) {
      showToast(
        "Existing ticket found",
        "Please continue the existing ticket conversation or choose Create New Anyway.",
        "warning"
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setServerError("");

      const normalizedReturnRequestId = values.returnRequestId.trim();
      const normalizedDuplicateReason = duplicateReason.trim();

      const finalMessage =
        allowDuplicateCreation && normalizedDuplicateReason
          ? [
              values.message.trim(),
              "",
              "Duplicate Ticket Reason:",
              normalizedDuplicateReason
            ].join("\n")
          : values.message.trim();

      const createdTicket = await customerSupportService.createTicket({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        category: values.category,
        priority: values.priority,
        subject: values.subject.trim(),
        message: finalMessage,
        orderId: values.orderId.trim() || undefined,
        returnRequestId: normalizedReturnRequestId || undefined,
        relatedReturnRequestId: normalizedReturnRequestId || undefined,
        issueType: values.issueType,
        attachments,
        unreadForSupport: true,
        unreadForCustomer: false
      });

      try {
        await notificationService.createNotification(
          createSupportTeamNewTicketNotification(createdTicket)
        );
      } catch {
        showToast(
          "Ticket created",
          "Ticket was created, but support notification sync failed.",
          "warning"
        );
      }

      setAttachments([]);
      setValues(initialValues);
      setAllowDuplicateCreation(false);
      setDuplicateReason("");

      showToast(
        "Support ticket created",
        `Ticket ${createdTicket.ticketId} has been submitted successfully.`,
        "success"
      );

      const createdReturnRequestId = getTicketOptionalValue(createdTicket, [
        "returnRequestId",
        "relatedReturnRequestId",
        "returnId"
      ]);

      navigate(
        buildSupportTicketsUrl({
          orderId: createdTicket.orderId,
          returnRequestId: createdReturnRequestId,
          ticketId: createdTicket.ticketId
        }),
        { replace: true }
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create support ticket. Please try again.";

      setServerError(message);
      showToast("Support request failed", message, "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const existingTicketReturnId = primaryExistingTicket
    ? getTicketOptionalValue(primaryExistingTicket, [
        "returnRequestId",
        "relatedReturnRequestId",
        "returnId"
      ])
    : "";

  return (
    <main className="contact-support-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">Contact Support</h1>
              <p className="text-muted mb-0">
                Submit a support request for orders, refunds, payments, wallet,
                rewards, coupons or account issues.
              </p>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <Link to="/faqs" className="btn btn-outline-secondary">
                <i className="bi bi-question-circle me-2" />
                View FAQs
              </Link>

              <Link to="/support-tickets" className="btn btn-outline-secondary">
                <i className="bi bi-ticket-detailed me-2" />
                My Tickets
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <div className="row g-4 justify-content-center">
          <div className="col-lg-8">
            <div className="card border">
              <div className="card-header bg-white p-4">
                <h5 className="fw-bold mb-1">Create Support Ticket</h5>
                <p className="text-muted small mb-0">
                  Our support team will review your request and update the
                  ticket status.
                </p>
              </div>

              <div className="card-body p-4">
                {serverError ? (
                  <div className="alert alert-danger" role="alert">
                    {serverError}
                  </div>
                ) : null}

                {values.category === "RETURN_REFUND" &&
                (values.orderId || values.returnRequestId) ? (
                  <div className="alert alert-info border-0 shadow-sm">
                    <div className="d-flex align-items-start gap-2">
                      <i className="bi bi-arrow-return-left mt-1" />
                      <div>
                        <strong>Return-linked support request</strong>
                        <div className="small">
                          {values.orderId ? (
                            <>
                              Order ID: <strong>{values.orderId}</strong>{" "}
                            </>
                          ) : null}
                          {values.returnRequestId ? (
                            <>
                              Return ID:{" "}
                              <strong>{values.returnRequestId}</strong>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {isCheckingExistingTickets ? (
                  <div className="alert alert-light border d-flex align-items-center gap-2">
                    <span className="spinner-border spinner-border-sm" />
                    Checking existing return support tickets...
                  </div>
                ) : null}

                {primaryExistingTicket ? (
                  <div className="alert alert-warning border-0 shadow-sm">
                    <div className="d-flex flex-column gap-3">
                      <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                        <div>
                          <h6 className="fw-bold mb-1">
                            Existing support ticket found
                          </h6>
                          <p className="mb-2 small">
                            You already have an active ticket for this return or
                            order. Continue the existing conversation for faster
                            resolution.
                          </p>

                          <div className="d-flex flex-wrap gap-2 small">
                            <span className="badge text-bg-light border text-dark">
                              {primaryExistingTicket.ticketId}
                            </span>
                            <span className="badge text-bg-info">
                              {formatLabel(primaryExistingTicket.status)}
                            </span>
                            {primaryExistingTicket.orderId ? (
                              <span className="badge text-bg-light border text-dark">
                                Order: {primaryExistingTicket.orderId}
                              </span>
                            ) : null}
                            {existingTicketReturnId ? (
                              <span className="badge text-bg-light border text-dark">
                                Return: {existingTicketReturnId}
                              </span>
                            ) : null}
                          </div>

                          <div className="small text-muted mt-2">
                            Last updated:{" "}
                            <strong>
                              {formatDateTime(primaryExistingTicket.updatedAt)}
                            </strong>
                          </div>
                        </div>

                        <div className="d-flex flex-wrap align-items-start gap-2">
                          <Link
                            to={buildSupportTicketsUrl({
                              orderId:
                                primaryExistingTicket.orderId || values.orderId,
                              returnRequestId:
                                existingTicketReturnId ||
                                values.returnRequestId,
                              ticketId: primaryExistingTicket.ticketId
                            })}
                            className="btn btn-sm btn-outline-dark"
                          >
                            <i className="bi bi-ticket-detailed me-2" />
                            View Existing Ticket
                          </Link>

                          {!allowDuplicateCreation ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-warning"
                              onClick={() => setAllowDuplicateCreation(true)}
                            >
                              Create New Anyway
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setAllowDuplicateCreation(false);
                                setDuplicateReason("");
                              }}
                            >
                              Cancel Duplicate
                            </button>
                          )}
                        </div>
                      </div>

                      {allowDuplicateCreation ? (
                        <div className="border rounded-4 bg-white p-3">
                          <label
                            htmlFor="duplicateReason"
                            className="form-label fw-semibold small"
                          >
                            Why do you want to create a new ticket?
                          </label>
                          <textarea
                            id="duplicateReason"
                            className="form-control"
                            rows={3}
                            maxLength={MAX_DUPLICATE_REASON_LENGTH}
                            placeholder="Example: This is a different issue for the same return."
                            value={duplicateReason}
                            onChange={(event) =>
                              setDuplicateReason(event.target.value)
                            }
                          />
                          <div className="form-text text-end">
                            {duplicateReason.length}/
                            {MAX_DUPLICATE_REASON_LENGTH}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} noValidate>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label
                        htmlFor="category"
                        className="form-label fw-semibold"
                      >
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        className={`form-select ${
                          errors.category ? "is-invalid" : ""
                        }`}
                        value={values.category}
                        onChange={handleInputChange}
                      >
                        {categoryOptions.map((option) => (
                          <option value={option.value} key={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.category ? (
                        <div className="invalid-feedback">
                          {errors.category}
                        </div>
                      ) : null}
                    </div>

                    <div className="col-md-6">
                      <label
                        htmlFor="priority"
                        className="form-label fw-semibold"
                      >
                        Priority
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        className={`form-select ${
                          errors.priority ? "is-invalid" : ""
                        }`}
                        value={values.priority}
                        onChange={handleInputChange}
                      >
                        {priorityOptions.map((option) => (
                          <option value={option.value} key={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.priority ? (
                        <div className="invalid-feedback">
                          {errors.priority}
                        </div>
                      ) : null}
                    </div>

                    <div className="col-md-6">
                      <FormInput
                        label="Order ID (Optional)"
                        name="orderId"
                        type="text"
                        placeholder="Example: ORD-20260712-1001"
                        value={values.orderId}
                        error={errors.orderId}
                        onChange={handleInputChange}
                      />
                    </div>

                    {values.category === "RETURN_REFUND" ? (
                      <>
                        <div className="col-md-6">
                          <FormInput
                            label="Return Request ID"
                            name="returnRequestId"
                            type="text"
                            placeholder="Example: RET-1001"
                            value={values.returnRequestId}
                            error={errors.returnRequestId}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="col-md-6">
                          <label
                            htmlFor="issueType"
                            className="form-label fw-semibold"
                          >
                            Return Issue Type
                          </label>
                          <select
                            id="issueType"
                            name="issueType"
                            className="form-select"
                            value={values.issueType}
                            onChange={handleInputChange}
                          >
                            <option value="GENERAL">General return query</option>
                            <option value="RAISE_RETURN_ISSUE">
                              Raise return issue
                            </option>
                            <option value="REFUND_DELAY">Refund delay</option>
                            <option value="QC_REJECTED">QC rejected</option>
                            <option value="PICKUP_DELAY">Pickup delay</option>
                            <option value="PICKUP_FAILED">Pickup failed</option>
                            <option value="RETURN_STATUS_QUERY">
                              Return status query
                            </option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                      </>
                    ) : null}

                    <div className="col-12">
                      <FormInput
                        label="Subject"
                        name="subject"
                        type="text"
                        placeholder="Briefly describe the issue"
                        value={values.subject}
                        error={errors.subject}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="col-12">
                      <label
                        htmlFor="message"
                        className="form-label fw-semibold"
                      >
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        className={`form-control ${
                          errors.message ? "is-invalid" : ""
                        }`}
                        rows={6}
                        maxLength={MAX_MESSAGE_LENGTH}
                        placeholder="Describe your support issue in detail..."
                        value={values.message}
                        onChange={handleInputChange}
                      />
                      {errors.message ? (
                        <div className="invalid-feedback">
                          {errors.message}
                        </div>
                      ) : null}
                      <div className="form-text text-end">
                        {values.message.length}/{MAX_MESSAGE_LENGTH}
                      </div>
                    </div>

                    <div className="col-12">
                      <label
                        htmlFor="supportAttachments"
                        className="form-label fw-semibold"
                      >
                        Attach Evidence (Optional)
                      </label>
                      <div className="file-upload">
                        <input
                          id="supportAttachments"
                          type="file"
                          className="form-control"
                          multiple
                          accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf,text/plain,.doc,.docx"
                          onChange={(event) =>
                            void handleAttachmentChange(event)
                          }
                        />
                        <div className="form-text">
                          Upload up to 3 files. Supported: images, PDF, DOC,
                          DOCX, TXT. Max 3 MB each.
                        </div>
                      </div>

                      <SupportAttachmentPreview
                        attachments={attachments}
                        onRemove={handleRemoveAttachment}
                      />
                    </div>
                  </div>

                  <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-4">
                    <Link
                      to="/help-center"
                      className="btn btn-outline-secondary"
                    >
                      Cancel
                    </Link>

                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isSubmitting}
                      disabled={
                        isSubmitting ||
                        isCheckingExistingTickets ||
                        shouldBlockDuplicateSubmit
                      }
                    >
                      <i className="bi bi-send me-2" />
                      {shouldBlockDuplicateSubmit
                        ? "Existing Ticket Found"
                        : "Submit Ticket"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <aside className="col-lg-4">
            <div className="card border">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3">Before submitting</h5>
                <div className="support-help-list">
                  <Link to="/faqs">
                    <i className="bi bi-question-circle" />
                    <span>Check FAQs for quick answers</span>
                  </Link>
                  <Link to="/orders">
                    <i className="bi bi-box-seam" />
                    <span>Check Orders & Returns for status</span>
                  </Link>
                  <Link to="/wallet">
                    <i className="bi bi-wallet2" />
                    <span>Check wallet and refund credit</span>
                  </Link>
                  <Link to="/coupon-history">
                    <i className="bi bi-ticket-perforated" />
                    <span>Check coupon usage history</span>
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default ContactSupportPage;