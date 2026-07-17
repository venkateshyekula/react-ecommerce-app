import { createContext } from "react";
import type { ComparisonContextValue } from "../types/comparison";

export const ComparisonContext = createContext<
  ComparisonContextValue | undefined
>(undefined);