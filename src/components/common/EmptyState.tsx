import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  message?: string;
  iconClassName?: string;
  action?: ReactNode;
}

const EmptyState = ({
  title,
  message,
  iconClassName = "bi bi-inbox",
  action
}: EmptyStateProps) => {
  return (
    <div className="empty-state text-center bg-white p-5">
      <div className="empty-state-icon mb-3">
        <i className={`${iconClassName} display-4 text-primary`} />
      </div>

      <h4 className="fw-bold mb-2">{title}</h4>

      {message ? <p className="text-muted mb-4">{message}</p> : null}

      {action ? <div>{action}</div> : null}
    </div>
  );
};

export default EmptyState;