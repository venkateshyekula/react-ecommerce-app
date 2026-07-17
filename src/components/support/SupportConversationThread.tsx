import type { SupportTicketMessage } from "../../types/customerSupport";
import SupportAttachmentPreview from "./SupportAttachmentPreview";

interface SupportConversationThreadProps {
  messages: SupportTicketMessage[];
  title?: string;
  emptyMessage?: string;
}

const getInitials = (name: string): string => {
  if (!name.trim()) {
    return "U";
  }

  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const getRoleLabel = (role: SupportTicketMessage["authorRole"]): string => {
  switch (role) {
    case "SUPPORT":
      return "Support Team";

    case "CUSTOMER":
      return "Customer";

    case "SYSTEM":
    default:
      return "System";
  }
};

const SupportConversationThread = ({
  messages,
  title = "Conversation",
  emptyMessage = "No conversation messages available yet.",
}: SupportConversationThreadProps) => {
  const sortedMessages = [...messages].sort(
    (firstMessage, secondMessage) =>
      new Date(firstMessage.createdAt).getTime() -
      new Date(secondMessage.createdAt).getTime(),
  );

  return (
    <div className="support-chat-thread">
      <div className="support-chat-header">
        <div>
          <h6 className="fw-bold mb-1">{title}</h6>
          <p className="text-muted small mb-0">
            {sortedMessages.length} message
            {sortedMessages.length === 1 ? "" : "s"}
          </p>
        </div>

        <span className="support-chat-live-badge">
          <i className="bi bi-chat-dots" />
          Thread
        </span>
      </div>

      {sortedMessages.length === 0 ? (
        <div className="support-chat-empty">
          <i className="bi bi-chat-square-text" />
          <span>{emptyMessage}</span>
        </div>
      ) : (
        <div className="support-chat-message-list">
          {sortedMessages.map((message) => {
            const isSupport = message.authorRole === "SUPPORT";
            const isCustomer = message.authorRole === "CUSTOMER";

            return (
              <div
                className={`support-chat-message-row ${
                  isSupport ? "support" : isCustomer ? "customer" : "system"
                }`}
                key={message.id}
              >
                <div className="support-chat-avatar">
                  {message.authorRole === "SYSTEM" ? (
                    <i className="bi bi-info-circle" />
                  ) : (
                    getInitials(message.authorName)
                  )}
                </div>

                <div className="support-chat-bubble-wrap">
                  <div className="support-chat-meta">
                    <strong>{message.authorName}</strong>

                    <span className="support-chat-role">
                      {getRoleLabel(message.authorRole)}
                    </span>

                    <span className="support-chat-time">
                      {new Date(message.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="support-chat-bubble">
                    <p>{message.message}</p>
                    {message.attachments && message.attachments.length > 0 ? (
                      <SupportAttachmentPreview
                        attachments={message.attachments}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupportConversationThread;
