import { Link } from "react-router-dom";
import Button from "../common/Button";
import { useComparison } from "../../context/useComparison";

const ComparisonBar = () => {
  const { compareItems, compareCount, removeFromCompare, clearCompare } =
    useComparison();

  if (compareCount === 0) {
    return null;
  }

  return (
    <div className="comparison-bar-wrapper fixed-bottom p-3 z-3">
      <div className="comparison-bar bg-white rounded-4 shadow-lg p-3 d-flex align-items-center justify-content-between flex-wrap gap-3 max-w-5xl mx-auto border">
        
        {/* Left Side: Selected Items List */}
        <div className="d-flex align-items-center gap-3 flex-grow-1 overflow-auto py-1">
          <div className="comparison-bar-title flex-shrink-0">
            <strong className="d-block text-dark lh-sm">Compare</strong>
            <span className="small text-muted">{compareCount}/4 selected</span>
          </div>

          <div className="comparison-mini-list d-flex align-items-center gap-3">
            {compareItems.map((product) => (
              <div 
                className="comparison-mini-item d-flex align-items-center gap-2 border rounded-3 p-1 bg-light position-relative" 
                key={product.id}
                style={{ minWidth: "160px", maxWidth: "200px" }}
              >
                {/* FIXED: Turning potential raw string paths into visual HTML image tags */}
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="rounded-2 bg-white object-fit-contain border"
                    style={{ width: "32px", height: "32px" }}
                  />
                )}

                {/* OPTIMIZED: Text truncation layout safety wrapper */}
                <span className="small fw-semibold text-dark text-truncate flex-grow-1pe-3">
                  {product.name}
                </span>

                <button
                  type="button"
                  className="btn-close p-1 small position-absolute top-50 end-0 translate-middle-y me-1"
                  style={{ fontSize: "0.65rem" }}
                  onClick={() => removeFromCompare(product.id)}
                  aria-label={`Remove ${product.name} from comparison`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Action Control Items */}
        <div className="d-flex gap-2 flex-shrink-0 align-items-center">
          {/* FIXED: Prevented structural link bypass tracking via e.preventDefault() */}
          <Link
            to="/compare"
            aria-disabled={compareCount < 2}
            onClick={(e) => compareCount < 2 && e.preventDefault()}
            className={`btn btn-primary px-4 rounded-3 fw-semibold ${
              compareCount < 2 ? "disabled opacity-50" : ""
            }`}
          >
            Compare Now
          </Link>

          <Button variant="outline-secondary" className="rounded-3" onClick={clearCompare}>
            Clear
          </Button>
        </div>

      </div>
    </div>
  );
};

export default ComparisonBar;