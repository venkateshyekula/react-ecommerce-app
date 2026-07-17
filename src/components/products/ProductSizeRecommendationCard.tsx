import { useMemo, useState, type ChangeEvent } from "react";
import Button from "../common/Button";
import type { Product } from "../../types/product";
import {
  recommendProductSize,
  type SizeRecommendationInput
} from "../../utils/sizeRecommendation";

interface ProductSizeRecommendationCardProps {
  product: Product;
  onSelectSize: (size: string) => void;
}

const getSizeChartRows = (product: Product): Record<string, unknown>[] => {
  const rawSizeChart = product.sizeChart as unknown;

  if (Array.isArray(rawSizeChart)) {
    return rawSizeChart as Record<string, unknown>[];
  }

  if (
    rawSizeChart &&
    typeof rawSizeChart === "object" &&
    "rows" in rawSizeChart &&
    Array.isArray((rawSizeChart as { rows?: unknown[] }).rows)
  ) {
    return (rawSizeChart as { rows: Record<string, unknown>[] }).rows;
  }

  return (product.sizeOptions ?? []).map((size) => ({
    size
  }));
};

const ProductSizeRecommendationCard = ({
  product,
  onSelectSize
}: ProductSizeRecommendationCardProps) => {
  const [values, setValues] = useState<SizeRecommendationInput>({
    chest: undefined,
    waist: undefined,
    hip: undefined,
    footLength: undefined,
    preferredFit: "REGULAR"
  });

  const [showResult, setShowResult] = useState<boolean>(false);

  const sizeChartRows = useMemo(() => {
    return getSizeChartRows(product);
  }, [product]);

  const recommendation = useMemo(() => {
    return recommendProductSize(
      sizeChartRows as Record<string, string | number | undefined>[],
      values
    );
  }, [sizeChartRows, values]);

  const handleNumberChange = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = event.target;
    const fieldName = name as keyof SizeRecommendationInput;

    setValues((previousValues) => ({
      ...previousValues,
      [fieldName]: value === "" ? undefined : Number(value)
    }));

    setShowResult(false);
  };

  if (!product.sizeOptions || product.sizeOptions.length === 0) {
    return null;
  }

  return (
    <div className="product-size-recommendation-card border rounded-4 bg-light p-3 mb-4">
      <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
        <div>
          <h6 className="fw-bold mb-1">
            <i className="bi bi-magic text-primary me-2" />
            Size Recommendation
          </h6>

          <p className="text-muted small mb-0">
            Enter your measurements to get a suggested size for this product.
          </p>
        </div>

        <span className="badge bg-primary-subtle align-self-start text-primary border border-primary-subtle">
          Beta
        </span>
      </div>

      <div className="row g-2">
        <div className="col-6 col-md-3">
          <input
            name="chest"
            type="number"
            className="form-control form-control-sm"
            placeholder="Chest cm"
            value={values.chest ?? ""}
            onChange={handleNumberChange}
          />
        </div>

        <div className="col-6 col-md-3">
          <input
            name="waist"
            type="number"
            className="form-control form-control-sm"
            placeholder="Waist cm"
            value={values.waist ?? ""}
            onChange={handleNumberChange}
          />
        </div>

        <div className="col-6 col-md-3">
          <input
            name="hip"
            type="number"
            className="form-control form-control-sm"
            placeholder="Hip cm"
            value={values.hip ?? ""}
            onChange={handleNumberChange}
          />
        </div>

        <div className="col-6 col-md-3">
          <input
            name="footLength"
            type="number"
            className="form-control form-control-sm"
            placeholder="Foot cm"
            value={values.footLength ?? ""}
            onChange={handleNumberChange}
          />
        </div>

        <div className="col-md-6">
          <select
            className="form-select form-select-sm"
            value={values.preferredFit}
            onChange={(event) => {
              setValues((previousValues) => ({
                ...previousValues,
                preferredFit: event.target.value as SizeRecommendationInput["preferredFit"]
              }));
              setShowResult(false);
            }}
          >
            <option value="SLIM">Slim Fit</option>
            <option value="REGULAR">Regular Fit</option>
            <option value="RELAXED">Relaxed Fit</option>
          </select>
        </div>

        <div className="col-md-6">
          <Button
            type="button"
            variant="primary"
            className="btn-sm w-100"
            onClick={() => setShowResult(true)}
          >
            Recommend Size
          </Button>
        </div>
      </div>

      {showResult && recommendation ? (
        <div className="product-size-recommendation-result mt-3 border rounded-4 bg-white p-3">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
            <div>
              <p className="text-muted small mb-1">Recommended Size</p>
              <h5 className="fw-bold text-primary mb-1">
                {recommendation.size}
              </h5>
              <p className="text-muted small mb-0">{recommendation.reason}</p>
            </div>

            <Button
              type="button"
              variant="outline-primary"
              className="btn-sm"
              onClick={() => onSelectSize(recommendation.size)}
            >
              Select {recommendation.size}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProductSizeRecommendationCard;