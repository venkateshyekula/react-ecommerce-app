import { formatCurrency } from "../../utils/currencyFormatter";

interface SavingsInsightCardProps {
  title: string;
  value: number;
  iconClassName: string;
  variant?: "primary" | "success" | "warning" | "info" | "danger";
  description?: string;
  isCurrency?: boolean;
}

const SavingsInsightCard = ({
  title,
  value,
  iconClassName,
  variant = "primary",
  description,
  isCurrency = true
}: SavingsInsightCardProps) => {
  return (
    <div className="savings-insight-card card border shadow-sm rounded-4 h-100">
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div>
            <p className="text-muted small fw-semibold mb-1">{title}</p>

            <h4 className={`fw-bold mb-1 text-${variant}`}>
              {isCurrency ? formatCurrency(value) : value}
            </h4>

            {description ? (
              <p className="text-muted small mb-0">{description}</p>
            ) : null}
          </div>

          <span
            className={`savings-insight-icon bg-${variant}-subtle text-${variant}`}
          >
            <i className={iconClassName} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default SavingsInsightCard;