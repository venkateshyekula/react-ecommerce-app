import type { ReturnLossBreakdownItem } from "../../types/returnLossDashboard";

type AdminReturnLossBreakdownCardsProps = {
  breakdown: ReturnLossBreakdownItem[];
};

const AdminReturnLossBreakdownCards = ({
  breakdown
}: AdminReturnLossBreakdownCardsProps) => {
  if (!breakdown || breakdown.length === 0) {
    return null;
  }

  return (
    <div className="card border-0 shadow-sm rounded-4 mb-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-3">Return Loss Breakdown</h5>

        <div className="row g-3">
          {breakdown.map((item, index) => (
            <div className="col-md-6 col-xl-4" key={item.label ?? index}>
              <div className="border rounded-4 p-3 h-100 bg-light d-flex flex-column justify-content-between">
                <div>
                  <span className="text-muted small d-block mb-1">
                    {item.label}
                  </span>
                  <strong className="fs-5 text-dark">
                    {item.formattedValue}
                  </strong>
                </div>

                {item.description ? (
                  <p className="small text-muted mb-0 mt-2">
                    {item.description}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminReturnLossBreakdownCards;