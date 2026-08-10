import { numberValue } from "@/lib/utils/currency";
import type { WorkMode } from "@/types/assignment";

type MoneyRow = { amount: number | string; currency: string };
type WorkerCostRow = { agreed_cost: number | string; currency: string; status?: string };

export function calculateAssignmentInrFinancials(input: {
  workMode: WorkMode;
  actualInrReceived: number;
  workerCosts: WorkerCostRow[];
  workerPayments: MoneyRow[];
  expenses: MoneyRow[];
}) {
  const workerCosts = input.workerCosts.filter((row) => row.status !== "cancelled");
  const externalWork = input.workMode !== "self";
  const missingRequiredAllocation = externalWork && input.actualInrReceived > 0 && workerCosts.length === 0;
  const nonInrLiabilities = externalWork && input.actualInrReceived > 0 && workerCosts.some((row) => row.currency !== "INR");
  const nonInrExpenses = input.expenses.some((row) => row.currency !== "INR");
  const nonInrCashOut = input.workerPayments.some((row) => row.currency !== "INR") || nonInrExpenses;
  const agreedWriterCostInr = externalWork
    ? workerCosts.filter((row) => row.currency === "INR").reduce((sum, row) => sum + numberValue(row.agreed_cost), 0)
    : 0;
  const writerPaidInr = input.workerPayments.filter((row) => row.currency === "INR").reduce((sum, row) => sum + numberValue(row.amount), 0);
  const expensesInr = input.expenses.filter((row) => row.currency === "INR").reduce((sum, row) => sum + numberValue(row.amount), 0);

  return {
    agreedWriterCostInr,
    writerPaidInr,
    expensesInr,
    actualProfitInr: !missingRequiredAllocation && !nonInrLiabilities && !nonInrExpenses
      ? input.actualInrReceived - agreedWriterCostInr - expensesInr
      : null,
    currentCashPositionInr: nonInrCashOut
      ? null
      : input.actualInrReceived - writerPaidInr - expensesInr,
    profitUnavailableReason: missingRequiredAllocation
      ? "Add at least one writer allocation before calculating outsourced profit."
      : nonInrLiabilities || nonInrExpenses
        ? "A writer cost or expense is not in INR; no conversion was assumed."
        : null,
    cashUnavailableReason: nonInrCashOut
      ? "A writer payment or expense is not in INR; no conversion was assumed."
      : null,
  };
}
