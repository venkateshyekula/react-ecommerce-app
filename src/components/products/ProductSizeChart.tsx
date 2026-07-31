import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent
} from "react";

import type {
  ProductSizeChart as ProductSizeChartType,
  ProductSizeChartRow
} from "../../types/product";

/* ==========================================================================
   Types
   ========================================================================== */

interface ProductSizeChartProps {
  sizeChart: ProductSizeChartType;
  onClose: () => void;
}

type SizeChartTab = "chart" | "measure";

type MeasurementUnit = "cm" | "in";

interface SizeChartColumns {
  hasChest: boolean;
  hasWaist: boolean;
  hasHip: boolean;
  hasShoulder: boolean;
  hasLength: boolean;
  hasFootLength: boolean;
  hasUkSize: boolean;
  hasUsSize: boolean;
  hasEuSize: boolean;
  hasCircumference: boolean;
}

interface SizeChartTabItem {
  id: SizeChartTab;
  label: string;
  icon: string;
}

/* ==========================================================================
   Constants
   ========================================================================== */

const CM_TO_INCH = 0.393701;
const INCH_TO_CM = 2.54;

const sizeChartTabs: SizeChartTabItem[] = [
  {
    id: "chart",
    label: "Size Chart",
    icon: "bi bi-table"
  },
  {
    id: "measure",
    label: "How to Measure",
    icon: "bi bi-rulers"
  }
];

/* ==========================================================================
   Measurement Helpers
   ========================================================================== */

const hasValue = (value: string | undefined): boolean => {
  return Boolean(value?.trim());
};

const getMeasurementUnitLabel = (unit: MeasurementUnit): string => {
  return unit === "cm" ? "cm" : "in";
};

const getMeasurementUnitDescription = (unit: MeasurementUnit): string => {
  return unit === "cm" ? "centimetres" : "inches";
};

const convertSingleMeasurement = (
  value: string,
  sourceUnit: MeasurementUnit,
  targetUnit: MeasurementUnit
): string => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return "-";
  }

  if (sourceUnit === targetUnit) {
    return normalizedValue;
  }

  const numericValue = Number(normalizedValue);

  if (!Number.isFinite(numericValue)) {
    return normalizedValue;
  }

  const convertedValue =
    sourceUnit === "cm"
      ? numericValue * CM_TO_INCH
      : numericValue * INCH_TO_CM;

  return convertedValue.toFixed(1);
};

const convertMeasurement = (
  value: string | undefined,
  sourceUnit: MeasurementUnit,
  targetUnit: MeasurementUnit
): string => {
  if (!value?.trim()) {
    return "-";
  }

  const normalizedValue = value.trim();

  if (sourceUnit === targetUnit) {
    return normalizedValue;
  }

  const rangeMatch = normalizedValue.match(
    /^(-?\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(-?\d+(?:\.\d+)?)$/i
  );

  if (rangeMatch) {
    const startingValue = convertSingleMeasurement(
      rangeMatch[1],
      sourceUnit,
      targetUnit
    );

    const endingValue = convertSingleMeasurement(
      rangeMatch[2],
      sourceUnit,
      targetUnit
    );

    return `${startingValue} - ${endingValue}`;
  }

  return convertSingleMeasurement(
    normalizedValue,
    sourceUnit,
    targetUnit
  );
};

/* ==========================================================================
   Product Size Chart Component
   ========================================================================== */

const ProductSizeChart = ({
  sizeChart,
  onClose
}: ProductSizeChartProps) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const tabListRef = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = useState<SizeChartTab>("chart");
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>(
    sizeChart.unit === "in" ? "in" : "cm"
  );

  const sourceMeasurementUnit: MeasurementUnit =
    sizeChart.unit === "in" ? "in" : "cm";

  /* ==========================================================================
     Detect Available Columns
     ========================================================================== */

  const availableColumns = useMemo<SizeChartColumns>(() => {
    return {
      hasChest: sizeChart.rows.some((row) => hasValue(row.chest)),
      hasWaist: sizeChart.rows.some((row) => hasValue(row.waist)),
      hasHip: sizeChart.rows.some((row) => hasValue(row.hip)),
      hasShoulder: sizeChart.rows.some((row) => hasValue(row.shoulder)),
      hasLength: sizeChart.rows.some((row) => hasValue(row.length)),
      hasFootLength: sizeChart.rows.some((row) => hasValue(row.footLength)),
      hasUkSize: sizeChart.rows.some((row) => hasValue(row.ukSize)),
      hasUsSize: sizeChart.rows.some((row) => hasValue(row.usSize)),
      hasEuSize: sizeChart.rows.some((row) => hasValue(row.euSize)),
      hasCircumference: sizeChart.rows.some((row) => hasValue(row.circumference))
    };
  }, [sizeChart.rows]);

  const hasMeasurementColumns =
    availableColumns.hasChest ||
    availableColumns.hasWaist ||
    availableColumns.hasHip ||
    availableColumns.hasShoulder ||
    availableColumns.hasLength ||
    availableColumns.hasFootLength ||
    availableColumns.hasCircumference;

  /* Reset When Size Chart Changes */
  useEffect(() => {
    setActiveTab("chart");
    setMeasurementUnit(sizeChart.unit === "in" ? "in" : "cm");
  }, [sizeChart]);

  /* Modal Lifecycle and Keyboard Accessibility Focus Trap */
  useEffect(() => {
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;
    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleDocumentKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) {
        return;
      }

      /* Fixed Selector Syntax */
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        [
          "button:not([disabled])",
          "a[href]",
          "input:not([disabled])",
          "select:not([disabled])",
          "textarea:not([disabled])",
          '[tabindex]:not([tabindex="-1"])'
        ].join(",")
      );

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("keydown", handleDocumentKeyDown);

      window.requestAnimationFrame(() => {
        previouslyFocusedElement?.focus();
      });
    };
  }, [onClose]);

  /* Backdrop Handler */
  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  /* Tab Navigation */
  const focusTabAtIndex = (index: number): void => {
    const tabButtons =
      tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');

    tabButtons?.[index]?.focus();
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ): void => {
    let nextIndex = currentIndex;

    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        nextIndex =
          currentIndex === sizeChartTabs.length - 1 ? 0 : currentIndex + 1;
        break;

      case "ArrowLeft":
        event.preventDefault();
        nextIndex =
          currentIndex === 0 ? sizeChartTabs.length - 1 : currentIndex - 1;
        break;

      case "Home":
        event.preventDefault();
        nextIndex = 0;
        break;

      case "End":
        event.preventDefault();
        nextIndex = sizeChartTabs.length - 1;
        break;

      default:
        return;
    }

    const nextTab = sizeChartTabs[nextIndex];
    setActiveTab(nextTab.id);

    window.requestAnimationFrame(() => {
      focusTabAtIndex(nextIndex);
    });
  };

  /* Cell Helper */
  const renderMeasurementCell = (value: string | undefined): string => {
    return convertMeasurement(
      value,
      sourceMeasurementUnit,
      measurementUnit
    );
  };

  /* Size Row Renderer */
  const renderSizeRow = (row: ProductSizeChartRow, index: number) => {
    return (
      <tr key={`${row.size}-${index}`}>
        <th scope="row" className="size-chart-size-cell">
          {row.size}
        </th>

        {availableColumns.hasChest ? (
          <td>{renderMeasurementCell(row.chest)}</td>
        ) : null}

        {availableColumns.hasWaist ? (
          <td>{renderMeasurementCell(row.waist)}</td>
        ) : null}

        {availableColumns.hasHip ? (
          <td>{renderMeasurementCell(row.hip)}</td>
        ) : null}

        {availableColumns.hasShoulder ? (
          <td>{renderMeasurementCell(row.shoulder)}</td>
        ) : null}

        {availableColumns.hasLength ? (
          <td>{renderMeasurementCell(row.length)}</td>
        ) : null}

        {availableColumns.hasFootLength ? (
          <td>{renderMeasurementCell(row.footLength)}</td>
        ) : null}

        {availableColumns.hasUkSize ? (
          <td>{row.ukSize?.trim() || "-"}</td>
        ) : null}

        {availableColumns.hasUsSize ? (
          <td>{row.usSize?.trim() || "-"}</td>
        ) : null}

        {availableColumns.hasEuSize ? (
          <td>{row.euSize?.trim() || "-"}</td>
        ) : null}

        {availableColumns.hasCircumference ? (
          <td>{renderMeasurementCell(row.circumference)}</td>
        ) : null}
      </tr>
    );
  };

  return (
    <div
      className="size-chart-overlay"
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="size-chart-modal bg-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-chart-dialog-title"
        aria-describedby="size-chart-dialog-description"
      >
        {/* Header */}
        <header className="size-chart-header">
          <div>
            <h2 id="size-chart-dialog-title" className="size-chart-title">
              Size Guide
            </h2>

            <p
              id="size-chart-dialog-description"
              className="size-chart-description"
            >
              Select the correct size using measurements in{" "}
              {getMeasurementUnitDescription(measurementUnit)}.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="size-chart-close"
            aria-label="Close size guide"
            onClick={onClose}
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>

        {/* Tabs */}
        <div
          ref={tabListRef}
          className="size-chart-tabs"
          role="tablist"
          aria-label="Size guide sections"
        >
          {sizeChartTabs.map((tab, index) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`size-chart-${tab.id}-tab`}
                type="button"
                role="tab"
                className={`nav-link ${isActive ? "active" : ""}`}
                aria-selected={isActive}
                aria-controls={`size-chart-${tab.id}-panel`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                <i className={`${tab.icon} me-2`} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Size Chart Panel */}
        {activeTab === "chart" ? (
          <section
            id="size-chart-chart-panel"
            className="size-chart-content"
            role="tabpanel"
            aria-labelledby="size-chart-chart-tab"
            tabIndex={0}
          >
            <div className="size-chart-content-header">
              <div>
                <h3 className="size-chart-section-title">Size Chart</h3>

                <p className="size-chart-section-description">
                  Measurements are displayed in{" "}
                  {getMeasurementUnitDescription(measurementUnit)}.
                </p>
              </div>

              {hasMeasurementColumns ? (
                <div
                  className="size-unit-toggle"
                  role="group"
                  aria-label="Measurement unit"
                >
                  <button
                    type="button"
                    className={`btn ${
                      measurementUnit === "cm"
                        ? "btn-primary active"
                        : "btn-outline-secondary"
                    }`}
                    aria-pressed={measurementUnit === "cm"}
                    onClick={() => setMeasurementUnit("cm")}
                  >
                    CM
                  </button>

                  <button
                    type="button"
                    className={`btn ${
                      measurementUnit === "in"
                        ? "btn-primary active"
                        : "btn-outline-secondary"
                    }`}
                    aria-pressed={measurementUnit === "in"}
                    onClick={() => setMeasurementUnit("in")}
                  >
                    IN
                  </button>
                </div>
              ) : null}
            </div>

            {sizeChart.rows.length > 0 ? (
              <div className="size-chart-table-wrapper">
                <table className="table size-chart-table">
                  <caption className="visually-hidden">
                    Product size measurements in{" "}
                    {getMeasurementUnitDescription(measurementUnit)}
                  </caption>

                  <thead>
                    <tr>
                      <th scope="col">Size</th>

                      {availableColumns.hasChest ? (
                        <th scope="col">
                          Chest ({getMeasurementUnitLabel(measurementUnit)})
                        </th>
                      ) : null}

                      {availableColumns.hasWaist ? (
                        <th scope="col">
                          Waist ({getMeasurementUnitLabel(measurementUnit)})
                        </th>
                      ) : null}

                      {availableColumns.hasHip ? (
                        <th scope="col">
                          Hip ({getMeasurementUnitLabel(measurementUnit)})
                        </th>
                      ) : null}

                      {availableColumns.hasShoulder ? (
                        <th scope="col">
                          Shoulder ({getMeasurementUnitLabel(measurementUnit)})
                        </th>
                      ) : null}

                      {availableColumns.hasLength ? (
                        <th scope="col">
                          Length ({getMeasurementUnitLabel(measurementUnit)})
                        </th>
                      ) : null}

                      {availableColumns.hasFootLength ? (
                        <th scope="col">
                          Foot Length ({getMeasurementUnitLabel(measurementUnit)})
                        </th>
                      ) : null}

                      {availableColumns.hasUkSize ? <th scope="col">UK</th> : null}
                      {availableColumns.hasUsSize ? <th scope="col">US</th> : null}
                      {availableColumns.hasEuSize ? <th scope="col">EU</th> : null}

                      {availableColumns.hasCircumference ? (
                        <th scope="col">
                          Circumference ({getMeasurementUnitLabel(measurementUnit)})
                        </th>
                      ) : null}
                    </tr>
                  </thead>

                  <tbody>{sizeChart.rows.map(renderSizeRow)}</tbody>
                </table>
              </div>
            ) : (
              <div className="size-chart-empty">
                <i className="bi bi-rulers" aria-hidden="true" />
                <p>Size measurements are not available for this product.</p>
              </div>
            )}

            {hasMeasurementColumns &&
            sourceMeasurementUnit !== measurementUnit ? (
              <p className="size-chart-conversion-note">
                <i className="bi bi-info-circle me-2" aria-hidden="true" />
                Values were converted from{" "}
                {getMeasurementUnitDescription(sourceMeasurementUnit)} and
                rounded to one decimal place.
              </p>
            ) : null}
          </section>
        ) : null}

        {/* How to Measure Panel */}
        {activeTab === "measure" ? (
          <section
            id="size-chart-measure-panel"
            className="size-chart-content"
            role="tabpanel"
            aria-labelledby="size-chart-measure-tab"
            tabIndex={0}
          >
            <div className="size-chart-measure-header">
              <h3 className="size-chart-section-title">How to Measure</h3>

              <p className="size-chart-section-description">
                Use a flexible measuring tape and keep the tape level while
                measuring.
              </p>
            </div>

            {sizeChart.howToMeasure.length > 0 ? (
              <ol className="how-to-measure-list">
                {sizeChart.howToMeasure.map((instruction, index) => (
                  <li
                    className="how-to-measure-step"
                    key={`${index}-${instruction}`}
                  >
                    <span className="how-to-measure-number" aria-hidden="true">
                      {index + 1}
                    </span>
                    <p>{instruction}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="size-chart-empty">
                <i className="bi bi-info-circle" aria-hidden="true" />
                <p>
                  Measurement instructions are not available for this product.
                </p>
              </div>
            )}
          </section>
        ) : null}

        {/* Footer */}
        <footer className="size-chart-footer">
          <p>Size measurements may vary slightly by brand and product style.</p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ProductSizeChart;