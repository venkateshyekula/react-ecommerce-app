import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent
} from "react";

import Button from "../common/Button";

import type {
  Product,
  ProductSizeChartRow,
  ProductSizeOption
} from "../../types/product";

import {
  recommendProductSize,
  type PreferredFit,
  type SizeRecommendationInput,
  type SizeRecommendationResult
} from "../../utils/sizeRecommendation";

/* ==========================================================================
   Types
   ========================================================================== */

interface ProductSizeRecommendationCardProps {
  product: Product;
  selectedSize?: string;
  onSelectSize: (size: string) => void;
}

interface RecommendationFormValues {
  chest: string;
  waist: string;
  hip: string;
  footLength: string;
  preferredFit: PreferredFit;
}

interface AvailableMeasurements {
  chest: boolean;
  waist: boolean;
  hip: boolean;
  footLength: boolean;
}

interface ProductSizeOptionLike {
  size: string;
  stock?: number;
  available?: boolean;
}

type ProductSizeValue =
  | string
  | ProductSizeOptionLike
  | ProductSizeOption;

type RecommendationChartRow = Record<
  string,
  string | number | undefined
>;

/* ==========================================================================
   Constants
   ========================================================================== */

const initialFormValues: RecommendationFormValues = {
  chest: "",
  waist: "",
  hip: "",
  footLength: "",
  preferredFit: "REGULAR"
};

/* ==========================================================================
   Size Option Helpers
   ========================================================================== */

const isProductSizeOption = (
  value: ProductSizeValue
): value is ProductSizeOptionLike => {
  return (
    typeof value === "object" &&
    value !== null &&
    "size" in value &&
    typeof value.size === "string"
  );
};

const getSizeLabel = (
  sizeOption: ProductSizeValue
): string => {
  if (typeof sizeOption === "string") {
    return sizeOption.trim();
  }

  if (isProductSizeOption(sizeOption)) {
    return sizeOption.size.trim();
  }

  return "";
};

const isSizeAvailable = (
  sizeOption: ProductSizeValue
): boolean => {
  if (typeof sizeOption === "string") {
    return Boolean(sizeOption.trim());
  }

  if (!isProductSizeOption(sizeOption)) {
    return false;
  }

  const sizeLabel = sizeOption.size.trim();

  if (!sizeLabel) {
    return false;
  }

  if (sizeOption.available === false) {
    return false;
  }

  if (
    typeof sizeOption.stock === "number" &&
    sizeOption.stock <= 0
  ) {
    return false;
  }

  return true;
};

const getNormalizedAvailableSizes = (
  product: Product
): string[] => {
  const rawSizeOptions =
    (product.sizeOptions ?? []) as ProductSizeValue[];

  const uniqueSizes = new Map<string, string>();

  rawSizeOptions.forEach((sizeOption) => {
    if (!isSizeAvailable(sizeOption)) {
      return;
    }

    const sizeLabel = getSizeLabel(sizeOption);

    if (!sizeLabel) {
      return;
    }

    const normalizedKey = sizeLabel.toLowerCase();

    if (!uniqueSizes.has(normalizedKey)) {
      uniqueSizes.set(normalizedKey, sizeLabel);
    }
  });

  return Array.from(uniqueSizes.values());
};

/* ==========================================================================
   Recommendation Row Helpers
   ========================================================================== */

const convertSizeChartRow = (
  row: ProductSizeChartRow
): RecommendationChartRow => {
  return {
    size: row.size,
    chest: row.chest,
    waist: row.waist,
    hip: row.hip,
    shoulder: row.shoulder,
    length: row.length,
    footLength: row.footLength,
    ukSize: row.ukSize,
    usSize: row.usSize,
    euSize: row.euSize,
    circumference: row.circumference
  };
};

const getRecommendationRows = (
  product: Product,
  availableSizes: string[]
): RecommendationChartRow[] => {
  if (product.sizeChart?.rows.length) {
    return product.sizeChart.rows.map(convertSizeChartRow);
  }

  return availableSizes.map(
    (size): RecommendationChartRow => ({
      size
    })
  );
};

const hasMeasurementValue = (
  value: string | number | undefined
): boolean => {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  return Boolean(value?.trim());
};

const getAvailableMeasurements = (
  product: Product
): AvailableMeasurements => {
  const rows = product.sizeChart?.rows ?? [];

  return {
    chest: rows.some((row) => hasMeasurementValue(row.chest)),
    waist: rows.some((row) => hasMeasurementValue(row.waist)),
    hip: rows.some((row) => hasMeasurementValue(row.hip)),
    footLength: rows.some((row) => hasMeasurementValue(row.footLength))
  };
};

/* ==========================================================================
   Measurement Helpers
   ========================================================================== */

const parseMeasurement = (
  value: string
): number | undefined => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  const numericValue = Number(normalizedValue);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return undefined;
  }

  return numericValue;
};

const hasEnteredMeasurement = (
  values: RecommendationFormValues
): boolean => {
  return [
    values.chest,
    values.waist,
    values.hip,
    values.footLength
  ].some((value) => value.trim() !== "");
};

const hasInvalidMeasurement = (
  values: RecommendationFormValues
): boolean => {
  return [
    values.chest,
    values.waist,
    values.hip,
    values.footLength
  ].some((value) => {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return false;
    }

    const numericValue = Number(normalizedValue);

    return !Number.isFinite(numericValue) || numericValue <= 0;
  });
};

/* ==========================================================================
   Confidence Helpers
   ========================================================================== */

const getConfidenceClass = (
  confidence: SizeRecommendationResult["confidence"]
): string => {
  switch (confidence) {
    case "HIGH":
      return "success";

    case "MEDIUM":
      return "warning";

    case "LOW":
    default:
      return "secondary";
  }
};

const getConfidenceLabel = (
  confidence: SizeRecommendationResult["confidence"]
): string => {
  switch (confidence) {
    case "HIGH":
      return "High confidence";

    case "MEDIUM":
      return "Medium confidence";

    case "LOW":
    default:
      return "Low confidence";
  }
};

/* ==========================================================================
   Product Size Recommendation Card
   ========================================================================== */

const ProductSizeRecommendationCard = ({
  product,
  selectedSize = "",
  onSelectSize
}: ProductSizeRecommendationCardProps) => {
  const [formValues, setFormValues] =
    useState<RecommendationFormValues>(initialFormValues);

  const [recommendation, setRecommendation] =
    useState<SizeRecommendationResult | null>(null);

  const [errorMessage, setErrorMessage] = useState<string>("");

  /* ==========================================================================
     Derived Product Data
     ========================================================================== */

  const availableSizes = useMemo<string[]>(() => {
    return getNormalizedAvailableSizes(product);
  }, [product]);

  const recommendationRows = useMemo<RecommendationChartRow[]>(() => {
    return getRecommendationRows(product, availableSizes);
  }, [availableSizes, product]);

  const availableMeasurements = useMemo<AvailableMeasurements>(() => {
    return getAvailableMeasurements(product);
  }, [product]);

  const measurementUnit =
    product.sizeChart?.unit === "in" ? "in" : "cm";

  const hasSizeOptions = availableSizes.length > 0;

  const hasSupportedMeasurements =
    availableMeasurements.chest ||
    availableMeasurements.waist ||
    availableMeasurements.hip ||
    availableMeasurements.footLength;

  const isSelectedRecommendation =
    Boolean(recommendation) &&
    selectedSize.trim().toLowerCase() ===
      recommendation?.size.trim().toLowerCase();

  /* ==========================================================================
     Reset When Product Changes
     ========================================================================== */

  useEffect(() => {
    setFormValues(initialFormValues);
    setRecommendation(null);
    setErrorMessage("");
  }, [product.id]);

  /* ==========================================================================
     Form Handlers
     ========================================================================== */

  const handleMeasurementChange = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = event.target;

    const fieldName = name as keyof Pick<
      RecommendationFormValues,
      "chest" | "waist" | "hip" | "footLength"
    >;

    /*
     * Allow an empty value or a positive decimal
     * number while the user is typing.
     */
    if (value !== "" && !/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setFormValues((previousValues) => ({
      ...previousValues,
      [fieldName]: value // Fixed: computed property name
    }));

    setRecommendation(null);
    setErrorMessage("");
  };

  const handlePreferredFitChange = (
    event: ChangeEvent<HTMLSelectElement>
  ): void => {
    setFormValues((previousValues) => ({
      ...previousValues,
      preferredFit: event.target.value as PreferredFit
    }));

    setRecommendation(null);
    setErrorMessage("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!hasEnteredMeasurement(formValues)) {
      setRecommendation(null);
      setErrorMessage(
        "Enter at least one measurement to get a size recommendation."
      );
      return;
    }

    if (hasInvalidMeasurement(formValues)) {
      setRecommendation(null);
      setErrorMessage(
        "Measurements must be valid numbers greater than zero."
      );
      return;
    }

    const recommendationInput: SizeRecommendationInput = {
      chest: parseMeasurement(formValues.chest),
      waist: parseMeasurement(formValues.waist),
      hip: parseMeasurement(formValues.hip),
      footLength: parseMeasurement(formValues.footLength),
      preferredFit: formValues.preferredFit
    };

    const recommendationResult = recommendProductSize(
      recommendationRows,
      recommendationInput
    );

    if (!recommendationResult) {
      setRecommendation(null);
      setErrorMessage(
        "A recommendation could not be calculated from the available size chart. Please use the Size Chart to choose a size."
      );
      return;
    }

    const matchingSize = availableSizes.find(
      (size) =>
        size.toLowerCase() ===
        recommendationResult.size.trim().toLowerCase()
    );

    if (!matchingSize) {
      setRecommendation(null);
      setErrorMessage(
        "The recommended size is not currently available for this product."
      );
      return;
    }

    setErrorMessage("");
    setRecommendation({
      ...recommendationResult,
      size: matchingSize
    });
  };

  const handleSelectRecommendedSize = (): void => {
    if (!recommendation) {
      return;
    }

    const matchingSize = availableSizes.find(
      (size) =>
        size.toLowerCase() === recommendation.size.trim().toLowerCase()
    );

    if (!matchingSize) {
      setErrorMessage(
        "The recommended size is not currently available."
      );
      return;
    }

    onSelectSize(matchingSize);
    setErrorMessage("");
  };

  const handleReset = (): void => {
    setFormValues(initialFormValues);
    setRecommendation(null);
    setErrorMessage("");
  };

  /* ==========================================================================
     Visibility
     ========================================================================== */

  if (!hasSizeOptions || !hasSupportedMeasurements) {
    return null;
  }

  /* ==========================================================================
     Render
     ========================================================================== */

  return (
    <section
      className="product-size-recommendation-card"
      aria-labelledby={`size-recommendation-title-${product.id}`}
    >
      {/* Header */}
      <div className="product-size-recommendation-header">
        <div>
          <div className="d-flex align-items-center flex-wrap gap-2">
            <i className="bi bi-rulers" aria-hidden="true" />

            <h5
              id={`size-recommendation-title-${product.id}`}
              className="product-size-recommendation-title mb-0"
            >
              Find Your Size
            </h5>

            <span className="product-size-recommendation-beta">Beta</span>
          </div>

          <p className="product-size-recommendation-description mb-0">
            Enter your measurements to get a suggested size for this product.
          </p>
        </div>

        <button
          type="button"
          className="product-size-recommendation-reset"
          disabled={
            !hasEnteredMeasurement(formValues) && !recommendation
          }
          onClick={handleReset}
        >
          Reset
        </button>
      </div>

      {/* Form */}
      <form
        className="product-size-recommendation-form"
        noValidate
        onSubmit={handleSubmit}
      >
        <div className="product-size-measurement-grid">
          {availableMeasurements.chest ? (
            <div className="product-size-measurement-field">
              <label
                htmlFor={`size-chest-${product.id}`}
                className="form-label"
              >
                <span>Chest</span>
                <span>({measurementUnit})</span>
              </label>

              <input
                id={`size-chest-${product.id}`}
                name="chest"
                type="text"
                className="form-control"
                value={formValues.chest}
                inputMode="decimal"
                autoComplete="off"
                placeholder={`Chest in ${measurementUnit}`}
                onChange={handleMeasurementChange}
              />
            </div>
          ) : null}

          {availableMeasurements.waist ? (
            <div className="product-size-measurement-field">
              <label
                htmlFor={`size-waist-${product.id}`}
                className="form-label"
              >
                <span>Waist</span>
                <span>({measurementUnit})</span>
              </label>

              <input
                id={`size-waist-${product.id}`}
                name="waist"
                type="text"
                className="form-control"
                value={formValues.waist}
                inputMode="decimal"
                autoComplete="off"
                placeholder={`Waist in ${measurementUnit}`}
                onChange={handleMeasurementChange}
              />
            </div>
          ) : null}

          {availableMeasurements.hip ? (
            <div className="product-size-measurement-field">
              <label
                htmlFor={`size-hip-${product.id}`}
                className="form-label"
              >
                <span>Hip</span>
                <span>({measurementUnit})</span>
              </label>

              <input
                id={`size-hip-${product.id}`}
                name="hip"
                type="text"
                className="form-control"
                value={formValues.hip}
                inputMode="decimal"
                autoComplete="off"
                placeholder={`Hip in ${measurementUnit}`}
                onChange={handleMeasurementChange}
              />
            </div>
          ) : null}

          {availableMeasurements.footLength ? (
            <div className="product-size-measurement-field">
              <label
                htmlFor={`size-foot-length-${product.id}`}
                className="form-label"
              >
                <span>Foot Length</span>
                <span>({measurementUnit})</span>
              </label>

              <input
                id={`size-foot-length-${product.id}`}
                name="footLength"
                type="text"
                className="form-control"
                value={formValues.footLength}
                inputMode="decimal"
                autoComplete="off"
                placeholder={`Foot length in ${measurementUnit}`}
                onChange={handleMeasurementChange}
              />
            </div>
          ) : null}

          <div className="product-size-measurement-field">
            <label
              htmlFor={`size-preferred-fit-${product.id}`}
              className="form-label"
            >
              Preferred Fit
            </label>

            <select
              id={`size-preferred-fit-${product.id}`}
              className="form-select"
              value={formValues.preferredFit}
              onChange={handlePreferredFitChange}
            >
              <option value="SLIM">Slim Fit</option>
              <option value="REGULAR">Regular Fit</option>
              <option value="RELAXED">Relaxed Fit</option>
            </select>
          </div>
        </div>

        {errorMessage ? (
          <div
            className="product-size-recommendation-error"
            role="alert"
          >
            <i className="bi bi-exclamation-circle" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <div className="product-size-recommendation-actions">
          <Button
            type="submit"
            variant="outline-primary"
            className="product-size-recommendation-submit"
          >
            <i className="bi bi-magic me-2" aria-hidden="true" />
            Recommend Size
          </Button>
        </div>
      </form>

      {/* Recommendation Result */}
      {recommendation ? (
        <div
          className="product-size-recommendation-result"
          aria-live="polite"
        >
          <div className="product-size-recommendation-result-icon">
            <i className="bi bi-check2-circle" aria-hidden="true" />
          </div>

          <div className="product-size-recommendation-result-content">
            <div className="d-flex align-items-center flex-wrap gap-2">
              <span className="product-size-recommendation-label">
                Recommended Size
              </span>

              <span
                className={`product-size-confidence-badge ${getConfidenceClass(
                  recommendation.confidence
                )}`}
              >
                {getConfidenceLabel(recommendation.confidence)}
              </span>
            </div>

            <strong className="product-size-recommendation-value">
              {recommendation.size}
            </strong>

            <p className="product-size-recommendation-reason">
              {recommendation.reason}
            </p>

            {isSelectedRecommendation ? (
              <span className="product-size-recommendation-selected">
                <i
                  className="bi bi-check-circle-fill me-1"
                  aria-hidden="true"
                />
                Size selected
              </span>
            ) : (
              <Button
                type="button"
                variant="primary"
                className="product-size-recommendation-select"
                onClick={handleSelectRecommendedSize}
              >
                Select {recommendation.size}
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default ProductSizeRecommendationCard;