import { useToast } from "../../context/useToast";

const getToastIcon = (variant: string): string => {
  switch (variant) {
    case "success":
      return "bi bi-check-circle-fill";

    case "danger":
      return "bi bi-x-circle-fill";

    case "warning":
      return "bi bi-exclamation-triangle-fill";

    case "info":
    default:
      return "bi bi-info-circle-fill";
  }
};

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="app-toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`app-toast app-toast-${toast.variant}`}
          role="alert"
        >
          <div className="app-toast-icon">
            <i className={getToastIcon(toast.variant)} />
          </div>

          <div className="flex-grow-1">
            <h6 className="fw-bold mb-1">{toast.title}</h6>

            {toast.message ? (
              <p className="small mb-0">{toast.message}</p>
            ) : null}
          </div>

          <button
            type="button"
            className="app-toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Close toast"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;