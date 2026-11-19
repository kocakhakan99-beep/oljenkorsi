import type { Entry } from './model';
import type { metrics } from './calculations';

export type ReportMonth = ReturnType<typeof metrics> & { key: string };
export type ReportSelection =
  | { type: "month"; month: string; metric: "income" | "expense" }
  | {
      type: "budget";
      month: string;
      planned: number;
      actual: number;
      manualCategories: string[];
    }
  | {
      type: "period";
      from: string;
      to: string;
      metric: "income" | "expense" | "cash";
    }
  | { type: "category"; category: string; from: string; to: string }
  | { type: "day"; date: string };
export type ReportDetailEntry = {
  entry: Entry;
  kind: "income" | "expense";
  amount: number;
  occurrences?: number;
};
