import { useContext } from "react";
import { ComparisonContext } from "./ComparisonContextObject";
import type { ComparisonContextValue } from "../types/comparison";

export const useComparison = (): ComparisonContextValue => {
  const context = useContext(ComparisonContext);

  if (!context) {
    throw new Error("useComparison must be used within a ComparisonProvider.");
  }

  return context;
};