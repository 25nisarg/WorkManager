import { ExpenseDialog } from "./expense-dialog";
import { ExpenseTable } from "./expense-table";
import { DataError } from "@/components/ui/data-error";
import { formatCurrency } from "@/lib/utils/format";
import type { ExpensesData } from "@/lib/queries/expenses";

export function AssignmentExpensesSection({ assignmentId, currency, data }: { assignmentId: string; currency: string; data: ExpensesData }) {
  const sameCurrency = data.expenses.every((expense) => expense.currency === currency);
  const total = sameCurrency ? data.expenses.reduce((sum, expense) => sum + expense.amount, 0) : null;
  return <section className="space-y-4" aria-labelledby="assignment-expenses-heading"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Business costs</p><h2 id="assignment-expenses-heading" className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Expenses</h2><p className="mt-1 text-sm text-slate-500">{total === null ? "Expenses use multiple currencies; totals remain separated in their original currency." : "Assignment expenses: " + formatCurrency(total, currency) + ". INR expenses reduce actual profit and current cash position."}</p></div><ExpenseDialog assignments={data.assignments} accounts={data.accounts} defaultAssignmentId={assignmentId} returnToAssignment /></div>{data.error ? <DataError message={data.error} /> : <ExpenseTable expenses={data.expenses} assignments={data.assignments} accounts={data.accounts} assignmentContext />}</section>;
}
