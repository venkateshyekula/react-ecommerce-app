import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import FormInput from "../components/common/FormInput";
import SupportAttachmentPreview from "../components/support/SupportAttachmentPreview";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { customerSupportService } from "../services/customerSupportService";
import { notificationService } from "../services/notificationService";
import type {
  SupportTicketAttachment,
  SupportTicketCategory,
  SupportTicketPriority
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
}

const initialValues: ContactSupportFormValues = {
  category: "ORDER",
  priority: "MEDIUM",
  subject: "",
  message: "",
  orderId: ""
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

const MIN_SUBJECT_LENGTH = 8;
const MAX_SUBJECT_LENGTH = 120;
const MIN_MESSAGE_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 1500;
const ORDER_ID_PATTERN = /^(ORD|ORDER)-[A-Z0-9-]+$/i;

const validCategories = categoryOptions.map((option) => option.value);
const validPriorities = priorityOptions.map((option) => option.value);

const ContactSupportPage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [values, setValues] = useState<ContactSupportFormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactSupportFormValues, string>>>({});
  const [serverError, setServerError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<SupportTicketAttachment[]>([]);

  const handleAttachmentChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (!currentUser || !event.target.files) return;

    const selectedFiles = Array.from(event.target.files);

    if (attachments.length + selectedFiles.length > SUPPORT_ATTACHMENT_MAX_COUNT) {
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

      setAttachments((previousAttachments) => [...previousAttachments, ...convertedAttachments]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to attach selected file.";
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
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = event.target;
    const fieldName = name as keyof ContactSupportFormValues;

    setValues((previousValues) => ({ ...previousValues, [fieldName]: value }));
    setErrors((previousErrors) => {
      const nextErrors = { ...previousErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
    setServerError("");
  };

  const validateForm = (): boolean => {
    const nextErrors: Partial<Record<keyof ContactSupportFormValues, string>> = {};
    const normalizedSubject = values.subject.trim();
    const normalizedMessage = values.message.trim();
    const normalizedOrderId = values.orderId.trim();

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

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
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

    try {
      setIsSubmitting(true);
      setServerError("");

      const createdTicket = await customerSupportService.createTicket({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        category: values.category,
        priority: values.priority,
        subject: values.subject.trim(),
        message: values.message.trim(),
        orderId: values.orderId.trim() || undefined,
        attachments
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
      showToast(
        "Support ticket created",
        `Ticket ${createdTicket.ticketId} has been submitted successfully.`,
        "success"
      );
      navigate("/support-tickets", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create support ticket. Please try again.";
      setServerError(message);
      showToast("Support request failed", message, "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="contact-support-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">Contact Support</h1>
              <p className="text-muted mb-0">
                Submit a support request for orders, refunds, payments, wallet, rewards, coupons or account issues.
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
                  Our support team will review your request and update the ticket status.
                </p>
              </div>

              <div className="card-body p-4">
                {serverError && (
                  <div className="alert alert-danger" role="alert">
                    {serverError}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="category" className="form-label fw-semibold">
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        className={`form-select ${errors.category ? "is-invalid" : ""}`}
                        value={values.category}
                        onChange={handleInputChange}
                      >
                        {categoryOptions.map((option) => (
                          <option value={option.value} key={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="priority" className="form-label fw-semibold">
                        Priority
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        className={`form-select ${errors.priority ? "is-invalid" : ""}`}
                        value={values.priority}
                        onChange={handleInputChange}
                      >
                        {priorityOptions.map((option) => (
                          <option value={option.value} key={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.priority && <div className="invalid-feedback">{errors.priority}</div>}
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
                      <label htmlFor="message" className="form-label fw-semibold">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        className={`form-control ${errors.message ? "is-invalid" : ""}`}
                        rows={6}
                        maxLength={MAX_MESSAGE_LENGTH}
                        placeholder="Describe your support issue in detail..."
                        value={values.message}
                        onChange={handleInputChange}
                      />
                      {errors.message && <div className="invalid-feedback">{errors.message}</div>}
                      <div className="form-text text-end">
                        {values.message.length}/{MAX_MESSAGE_LENGTH}
                      </div>
                    </div>

                    <div className="col-12">
                      <label htmlFor="supportAttachments" className="form-label fw-semibold">
                        Attach Evidence (Optional)
                      </label>
                      <div className="file-upload">
                        <input
                          id="supportAttachments"
                          type="file"
                          className="form-control"
                          multiple
                          accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf,text/plain,.doc,.docx"
                          onChange={(event) => void handleAttachmentChange(event)}
                        />
                        <div className="form-text">
                          Upload up to 3 files. Supported: images, PDF, DOC, DOCX, TXT. Max 3 MB each.
                        </div>
                      </div>
                      <SupportAttachmentPreview
                        attachments={attachments}
                        onRemove={handleRemoveAttachment}
                      />
                    </div>
                  </div>

                  <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-4">
                    <Link to="/help-center" className="btn btn-outline-secondary">
                      Cancel
                    </Link>
                    <Button type="submit" variant="primary" isLoading={isSubmitting}>
                      <i className="bi bi-send me-2" />
                      Submit Ticket
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