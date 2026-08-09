import type { AssignmentFinancialSummary } from "@/types/assignment";

export function getFinancialSummaryNumber(
  summary: AssignmentFinancialSummary | null,
  keys: string[]
) {
  for (const key of keys) {
    const value = summary?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (
      typeof value === "string" &&
      value.trim() &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return null;
}
