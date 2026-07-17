export interface SizeRecommendationInput {
  chest?: number;
  waist?: number;
  hip?: number;
  footLength?: number;
  preferredFit: "SLIM" | "REGULAR" | "RELAXED";
}

export interface SizeRecommendationResult {
  size: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
}

type SizeChartRow = Record<string, string | number | undefined>;

const normalizeNumber = (value: string | number | undefined): number | null => {
  if (value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  const match = value.match(/\d+(\.\d+)?/);

  return match ? Number(match[0]) : null;
};

const getSizeValue = (row: SizeChartRow): string => {
  return String(row.size ?? row.Size ?? row.label ?? row.Label ?? "");
};

const getMeasurementScore = (
  target: number | undefined,
  chartValue: number | null
): number => {
  if (!target || chartValue === null) {
    return 0;
  }

  return Math.abs(target - chartValue);
};

export const recommendProductSize = (
  sizeChartRows: SizeChartRow[],
  input: SizeRecommendationInput
): SizeRecommendationResult | null => {
  if (sizeChartRows.length === 0) {
    return null;
  }

  const fitAdjustment =
    input.preferredFit === "SLIM"
      ? -1
      : input.preferredFit === "RELAXED"
        ? 1
        : 0;

  const scoredRows = sizeChartRows
    .map((row) => {
      const size = getSizeValue(row);

      const chestValue = normalizeNumber(row.chest ?? row.Chest);
      const waistValue = normalizeNumber(row.waist ?? row.Waist);
      const hipValue = normalizeNumber(row.hip ?? row.Hip);
      const footLengthValue = normalizeNumber(
        row.footLength ?? row["Foot Length"] ?? row.foot_length
      );

      const score =
        getMeasurementScore(input.chest, chestValue) +
        getMeasurementScore(input.waist, waistValue) +
        getMeasurementScore(input.hip, hipValue) +
        getMeasurementScore(input.footLength, footLengthValue) +
        Math.abs(fitAdjustment);

      return {
        size,
        score,
        hasMeasurement:
          chestValue !== null ||
          waistValue !== null ||
          hipValue !== null ||
          footLengthValue !== null
      };
    })
    .filter((item) => item.size);

  if (scoredRows.length === 0) {
    return null;
  }

  const bestMatch = scoredRows.sort(
    (first, second) => first.score - second.score
  )[0];

  return {
    size: bestMatch.size,
    confidence: bestMatch.hasMeasurement ? "HIGH" : "LOW",
    reason: bestMatch.hasMeasurement
      ? "Recommended based on the measurements entered and the product size chart."
      : "Recommended from available size options because detailed measurements are unavailable."
  };
};