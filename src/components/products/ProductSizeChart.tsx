import { useState } from "react";
import type { ProductSizeChart as ProductSizeChartType } from "../../types/product";

interface ProductSizeChartProps {
  sizeChart: ProductSizeChartType;
  onClose: () => void;
}

type SizeChartTab = "chart" | "measure";
type MeasurementUnit = "cm" | "inch";

const CM_TO_INCH = 0.393701;

const isNumericValue = (value: string): boolean => {
  return !Number.isNaN(Number(value));
};

const convertSingleCmToInch = (value: string): string => {
  if (!isNumericValue(value)) {
    return value;
  }

  const convertedValue = Number(value) * CM_TO_INCH;

  return convertedValue.toFixed(1);
};

const convertCmToSelectedUnit = (
  value: string | undefined,
  unit: MeasurementUnit
): string => {
  if (!value) {
    return "-";
  }

  if (unit === "cm") {
    return value;
  }

  if (value.toLowerCase() === "adjustable") {
    return value;
  }

  if (value.includes("-")) {
    const values = value.split("-").map((item) => item.trim());

    if (values.length !== 2) {
      return value;
    }

    return `${convertSingleCmToInch(values[0])}-${convertSingleCmToInch(
      values[1]
    )}`;
  }

  return convertSingleCmToInch(value);
};

const ProductSizeChart = ({ sizeChart, onClose }: ProductSizeChartProps) => {
  const [activeTab, setActiveTab] = useState<SizeChartTab>("chart");
  const [measurementUnit, setMeasurementUnit] =
    useState<MeasurementUnit>("cm");

  const hasClothingColumns = sizeChart.rows.some(
    (row) => row.chest || row.waist || row.shoulder || row.length
  );

  const hasFootwearColumns = sizeChart.rows.some(
    (row) => row.footLength || row.ukSize || row.usSize || row.euSize
  );

  const hasAccessoryColumns = sizeChart.rows.some(
    (row) => row.circumference
  );

  const measurementLabel =
    measurementUnit === "cm" ? "centimeters" : "inches";

  return (
    <div className="size-chart-overlay" role="dialog" aria-modal="true">
      <div className="size-chart-modal bg-white rounded-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
          <div>
            <h5 className="fw-bold mb-1">Size Guide</h5>
            <p className="text-muted small mb-0">
              Select the correct size using measurements in {measurementLabel}.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-light rounded-circle size-chart-close"
            onClick={onClose}
            aria-label="Close size chart"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="p-4">
          <ul className="nav nav-pills size-chart-tabs mb-4">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === "chart" ? "active" : ""}`}
                onClick={() => setActiveTab("chart")}
              >
                Size Chart
              </button>
            </li>

            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${
                  activeTab === "measure" ? "active" : ""
                }`}
                onClick={() => setActiveTab("measure")}
              >
                How to Measure
              </button>
            </li>
          </ul>

          {activeTab === "chart" ? (
            <>
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-3">
                <div>
                  <h6 className="fw-bold mb-1">
                    Size Chart ({measurementUnit === "cm" ? "in cm" : "in inch"})
                  </h6>
                  <p className="small text-muted mb-0">
                    Toggle between centimeters and inches.
                  </p>
                </div>

                <div
                  className="btn-group size-unit-toggle"
                  role="group"
                  aria-label="Measurement unit switch"
                >
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      measurementUnit === "cm"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setMeasurementUnit("cm")}
                  >
                    CM
                  </button>

                  <button
                    type="button"
                    className={`btn btn-sm ${
                      measurementUnit === "inch"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setMeasurementUnit("inch")}
                  >
                    Inch
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered align-middle size-chart-table">
                  <thead>
                    <tr>
                      <th>Size</th>

                      {hasClothingColumns ? (
                        <>
                          <th>Chest</th>
                          <th>Waist</th>
                          <th>Shoulder</th>
                          <th>Length</th>
                        </>
                      ) : null}

                      {hasFootwearColumns ? (
                        <>
                          <th>Foot Length</th>
                          <th>UK</th>
                          <th>US</th>
                          <th>EU</th>
                        </>
                      ) : null}

                      {hasAccessoryColumns ? <th>Circumference</th> : null}
                    </tr>
                  </thead>

                  <tbody>
                    {sizeChart.rows.map((row) => (
                      <tr key={row.size}>
                        <td className="fw-bold">{row.size}</td>

                        {hasClothingColumns ? (
                          <>
                            <td>
                              {convertCmToSelectedUnit(
                                row.chest,
                                measurementUnit
                              )}
                            </td>
                            <td>
                              {convertCmToSelectedUnit(
                                row.waist,
                                measurementUnit
                              )}
                            </td>
                            <td>
                              {convertCmToSelectedUnit(
                                row.shoulder,
                                measurementUnit
                              )}
                            </td>
                            <td>
                              {convertCmToSelectedUnit(
                                row.length,
                                measurementUnit
                              )}
                            </td>
                          </>
                        ) : null}

                        {hasFootwearColumns ? (
                          <>
                            <td>
                              {convertCmToSelectedUnit(
                                row.footLength,
                                measurementUnit
                              )}
                            </td>
                            <td>{row.ukSize ?? "-"}</td>
                            <td>{row.usSize ?? "-"}</td>
                            <td>{row.euSize ?? "-"}</td>
                          </>
                        ) : null}

                        {hasAccessoryColumns ? (
                          <td>
                            {convertCmToSelectedUnit(
                              row.circumference,
                              measurementUnit
                            )}
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="small text-muted mb-0">
                Note: Inch values are converted from centimeter measurements and
                rounded to one decimal place.
              </p>
            </>
          ) : null}

          {activeTab === "measure" ? (
            <div className="how-to-measure-list">
              {sizeChart.howToMeasure.map((instruction, index) => (
                <div
                  key={instruction}
                  className="how-to-measure-step bg-light rounded-4 p-3 mb-3"
                >
                  <span className="how-to-measure-number">{index + 1}</span>
                  <p className="mb-0">{instruction}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProductSizeChart;