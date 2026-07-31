/* ==========================================================================
   Size Recommendation Types
   ========================================================================== */

export type PreferredFit =
  | "SLIM"
  | "REGULAR"
  | "RELAXED";

export type SizeRecommendationConfidence =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export interface SizeRecommendationInput {
  chest?: number;
  waist?: number;
  hip?: number;
  footLength?: number;
  preferredFit: PreferredFit;
}

export interface SizeRecommendationResult {
  size: string;
  confidence: SizeRecommendationConfidence;
  reason: string;
}

type SizeChartRow = Record<
  string,
  string | number | undefined
>;

interface MeasurementComparison {
  score: number;
  compared: boolean;
}

interface ScoredSizeRow {
  size: string;
  score: number;
  comparedMeasurements: number;
  chartIndex: number;
}

/* ==========================================================================
   Constants
   ========================================================================== */

const MEASUREMENT_KEYS = {
  chest: ["chest", "Chest"],
  waist: ["waist", "Waist"],
  hip: ["hip", "Hip"],
  footLength: [
    "footLength",
    "Foot Length",
    "foot_length"
  ]
} as const;

/* ==========================================================================
   Value Helpers
   ========================================================================== */

/**
 * Reads the first defined value from a size-chart row using
 * the provided list of possible property names.
 */
const getRowValue = (
  row: SizeChartRow,
  keys: readonly string[]
): string | number | undefined => {
  for (const key of keys) {
    const value = row[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return undefined;
};

/**
 * Converts a string or number measurement into a numeric value.
 *
 * Supported examples:
 * 42
 * "42"
 * "42 cm"
 * "40-42"
 * "40 - 42 cm"
 *
 * For ranges, the midpoint is returned.
 */
const normalizeNumber = (
  value: string | number | undefined
): number | null => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  const rangeMatch = normalizedValue.match(
    /(-?\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(-?\d+(?:\.\d+)?)/i
  );

  if (rangeMatch) {
    const minimum = Number(rangeMatch[1]);
    const maximum = Number(rangeMatch[2]);

    if (
      Number.isFinite(minimum) &&
      Number.isFinite(maximum)
    ) {
      return (minimum + maximum) / 2;
    }
  }

  const numberMatch = normalizedValue.match(
    /-?\d+(?:\.\d+)?/
  );

  if (!numberMatch) {
    return null;
  }

  const parsedValue = Number(numberMatch[0]);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : null;
};

/**
 * Resolves the displayed size from common size-chart property names.
 */
const getSizeValue = (row: SizeChartRow): string => {
  return String(
    row.size ??
      row.Size ??
      row.label ??
      row.Label ??
      ""
  ).trim();
};

/**
 * Checks whether at least one valid positive measurement
 * was entered by the user.
 */
const hasValidInputMeasurement = (
  input: SizeRecommendationInput
): boolean => {
  return [
    input.chest,
    input.waist,
    input.hip,
    input.footLength
  ].some(
    (measurement) =>
      measurement !== undefined &&
      Number.isFinite(measurement) &&
      measurement > 0
  );
};

/* ==========================================================================
   Scoring Helpers
   ========================================================================== */

/**
 * Compares one user measurement against one chart measurement.
 */
const getMeasurementComparison = (
  target: number | undefined,
  chartValue: number | null
): MeasurementComparison => {
  if (
    target === undefined ||
    !Number.isFinite(target) ||
    target <= 0 ||
    chartValue === null
  ) {
    return {
      score: 0,
      compared: false
    };
  }

  return {
    score: Math.abs(target - chartValue),
    compared: true
  };
};

/**
 * Creates a score for one size-chart row.
 *
 * Lower scores indicate a closer measurement match.
 */
const scoreSizeChartRow = (
  row: SizeChartRow,
  input: SizeRecommendationInput,
  chartIndex: number
): ScoredSizeRow | null => {
  const size = getSizeValue(row);

  if (!size) {
    return null;
  }

  const chestValue = normalizeNumber(
    getRowValue(row, MEASUREMENT_KEYS.chest)
  );

  const waistValue = normalizeNumber(
    getRowValue(row, MEASUREMENT_KEYS.waist)
  );

  const hipValue = normalizeNumber(
    getRowValue(row, MEASUREMENT_KEYS.hip)
  );

  const footLengthValue = normalizeNumber(
    getRowValue(
      row,
      MEASUREMENT_KEYS.footLength
    )
  );

  const comparisons: MeasurementComparison[] = [
    getMeasurementComparison(
      input.chest,
      chestValue
    ),
    getMeasurementComparison(
      input.waist,
      waistValue
    ),
    getMeasurementComparison(
      input.hip,
      hipValue
    ),
    getMeasurementComparison(
      input.footLength,
      footLengthValue
    )
  ];

  const applicableComparisons = comparisons.filter(
    (comparison) => comparison.compared
  );

  if (applicableComparisons.length === 0) {
    return null;
  }

  const totalDifference = applicableComparisons.reduce(
    (totalScore, comparison) =>
      totalScore + comparison.score,
    0
  );

  /*
   * Average the score so rows with more available measurements
   * are not unfairly penalized by receiving a larger total.
   */
  const averageScore =
    totalDifference / applicableComparisons.length;

  return {
    size,
    score: averageScore,
    comparedMeasurements:
      applicableComparisons.length,
    chartIndex
  };
};

/**
 * Applies the requested fit preference after finding
 * the closest size-chart row index.
 */
const getAdjustedResultIndex = (
  bestMatchChartIndex: number,
  totalChartRows: number,
  preferredFit: PreferredFit
): number => {
  if (preferredFit === "SLIM") {
    return Math.max(0, bestMatchChartIndex - 1);
  }

  if (preferredFit === "RELAXED") {
    return Math.min(
      totalChartRows - 1,
      bestMatchChartIndex + 1
    );
  }

  return bestMatchChartIndex;
};

/**
 * Calculates recommendation confidence from the number
 * of real chart measurements used in the comparison.
 */
const getRecommendationConfidence = (
  comparedMeasurements: number
): SizeRecommendationConfidence => {
  if (comparedMeasurements >= 3) {
    return "HIGH";
  }

  if (comparedMeasurements === 2) {
    return "MEDIUM";
  }

  return "LOW";
};

/**
 * Generates a user-facing explanation for the recommendation.
 */
const getRecommendationReason = (
  comparedMeasurements: number,
  preferredFit: PreferredFit
): string => {
  const measurementText =
    comparedMeasurements === 1
      ? "1 matching measurement"
      : `${comparedMeasurements} matching measurements`;

  switch (preferredFit) {
    case "SLIM":
      return `Recommended using ${measurementText} from the product size chart. A slightly closer fit preference was applied.`;

    case "RELAXED":
      return `Recommended using ${measurementText} from the product size chart. A slightly roomier fit preference was applied.`;

    case "REGULAR":
    default:
      return `Recommended using ${measurementText} from the product size chart. A regular fit preference was applied.`;
  }
};

/* ==========================================================================
   Size Recommendation
   ========================================================================== */

/**
 * Recommends a size using valid measurements from the product size chart.
 *
 * The function returns null when:
 * - no size-chart rows are available;
 * - the user has not entered any valid measurement;
 * - none of the entered measurements can be compared with the chart;
 * - no valid size labels are available.
 */
export const recommendProductSize = (
  sizeChartRows: SizeChartRow[],
  input: SizeRecommendationInput
): SizeRecommendationResult | null => {
  if (
    !Array.isArray(sizeChartRows) ||
    sizeChartRows.length === 0
  ) {
    return null;
  }

  if (!hasValidInputMeasurement(input)) {
    return null;
  }

  const scoredRows = sizeChartRows
    .map((row, index) =>
      scoreSizeChartRow(row, input, index)
    )
    .filter(
      (row): row is ScoredSizeRow => row !== null
    );

  if (scoredRows.length === 0) {
    return null;
  }

  /*
   * Identify the best-matching row using its original chartIndex.
   */
  const bestMatchRow = scoredRows.reduce(
    (currentBestRow, currentRow) => {
      if (currentRow.score < currentBestRow.score) {
        return currentRow;
      }

      /*
       * When scores are equal, prefer the row matched
       * against more measurements.
       */
      if (
        currentRow.score === currentBestRow.score &&
        currentRow.comparedMeasurements >
          currentBestRow.comparedMeasurements
      ) {
        return currentRow;
      }

      return currentBestRow;
    }
  );

  const adjustedChartIndex = getAdjustedResultIndex(
    bestMatchRow.chartIndex,
    sizeChartRows.length,
    input.preferredFit
  );

  const recommendedChartRow =
    sizeChartRows[adjustedChartIndex];

  const recommendedSizeLabel = getSizeValue(
    recommendedChartRow
  );

  if (!recommendedSizeLabel) {
    return null;
  }

  return {
    size: recommendedSizeLabel,
    confidence: getRecommendationConfidence(
      bestMatchRow.comparedMeasurements
    ),
    reason: getRecommendationReason(
      bestMatchRow.comparedMeasurements,
      input.preferredFit
    )
  };
};