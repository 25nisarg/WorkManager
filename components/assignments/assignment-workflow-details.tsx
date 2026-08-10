import { Banknote, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CurrencyValues } from "@/components/ui/currency-values";
import { groupCurrencyAmounts, subtractCurrencyAmounts } from "@/lib/utils/currency";
import { calculateAssignmentInrFinancials } from "@/lib/utils/financial-model";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { ExpensesData } from "@/lib/queries/expenses";
import type { PaymentsData } from "@/lib/queries/payments";
import type { Assignment } from "@/types/assignment";
import type { AssignmentWorker } from "@/types/assignment-worker";

type WorkflowDetailsProps = {
  assignment: Assignment;
  allocations: AssignmentWorker[];
  payments: PaymentsData;
  expenses: ExpensesData;
};

export function AssignmentOverview({ assignment }: Pick<WorkflowDetailsProps, "assignment">) {
  const showCopyPricing = assignment.number_of_copies > 1 || assignment.price_per_copy > 0;
  const optionalItems = [
    assignment.subject ? { label: "Subject", value: assignment.subject } : null,
    assignment.assessment_name ? { label: "Assessment", value: assignment.assessment_name } : null,
    showCopyPricing ? { label: "Copies", value: String(assignment.number_of_copies) } : null,
    showCopyPricing ? { label: "Price per copy", value: formatCurrency(assignment.price_per_copy, assignment.currency) } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-3">
        <h2 className="font-semibold text-slate-900">Overview</h2>
      </div>
      <dl className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div><dt className="text-xs uppercase tracking-wide text-slate-400">Received</dt><dd className="mt-1 text-sm font-medium text-slate-800">{formatDate(assignment.received_date)}</dd></div>
        {optionalItems.map((item) => <div key={item.label}><dt className="text-xs uppercase tracking-wide text-slate-400">{item.label}</dt><dd className="mt-1 text-sm font-medium text-slate-800">{item.value}</dd></div>)}
        {assignment.description && <div className="sm:col-span-2 lg:col-span-4"><dt className="text-xs uppercase tracking-wide text-slate-400">Description</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{assignment.description}</dd></div>}
      </dl>
    </Card>
  );
}

export function AssignmentFinancialSummary({ assignment, allocations, payments, expenses }: WorkflowDetailsProps) {
  const assignmentAllocations = payments.clientPayments.flatMap((payment) => payment.allocations.map((allocation) => ({ payment, allocation }))).filter(({ allocation }) => allocation.assignment_id === assignment.id);
  const matchingPayments = assignmentAllocations.filter(({ payment }) => payment.currency_original === assignment.currency);
  const originalPaid = matchingPayments.reduce((sum, row) => sum + row.allocation.amount_original, 0);
  const actualInrReceived = assignmentAllocations.reduce((sum, row) => sum + row.allocation.amount_inr, 0);
  const activeAllocations = allocations.filter((allocation) => allocation.status !== "cancelled");
  const workerCosts = groupCurrencyAmounts(activeAllocations, (row) => row.currency, (row) => row.agreed_cost);
  const workerPaid = groupCurrencyAmounts(payments.workerPayments, (row) => row.currency, (row) => row.amount);
  const expenseTotals = groupCurrencyAmounts(expenses.expenses, (row) => row.currency, (row) => row.amount);
  const writerPayable = subtractCurrencyAmounts(workerCosts, workerPaid);
  const financials = calculateAssignmentInrFinancials({ workMode: assignment.work_mode, actualInrReceived, workerCosts: activeAllocations, workerPayments: payments.workerPayments, expenses: expenses.expenses });
  const unmatched = assignmentAllocations.length - matchingPayments.length;
  const items = [
    { group: "Client", label: "Quoted price", value: formatCurrency(assignment.selling_price, assignment.currency), note: "Original assignment currency" },
    { group: "Client", label: "Original paid", value: formatCurrency(originalPaid, assignment.currency), note: unmatched ? `${unmatched} other-currency payment(s) excluded` : "Matching original-currency payments" },
    { group: "Client", label: "Client outstanding", value: formatCurrency(Math.max(assignment.selling_price - originalPaid, 0), assignment.currency), note: "Quoted price less matching payments" },
    { group: "Client", label: "Actual INR received", value: formatCurrency(actualInrReceived, "INR"), note: "Actual amount credited" },
    { group: "Writer", label: "Writer agreed cost", value: <CurrencyValues values={workerCosts} />, note: "From non-cancelled allocations" },
    { group: "Writer", label: "Writer paid", value: <CurrencyValues values={workerPaid} />, note: "Payments grouped by currency" },
    { group: "Writer", label: "Writer payable", value: <CurrencyValues values={writerPayable} />, note: "Agreed cost less matching-currency payments" },
    { group: "Result", label: "Assignment expenses", value: <CurrencyValues values={expenseTotals} />, note: "Expenses grouped by currency" },
    { group: "Result", label: "Actual profit to date", value: financials.actualProfitInr === null ? "Unavailable" : formatCurrency(financials.actualProfitInr, "INR"), note: financials.profitUnavailableReason ?? "INR received less agreed INR writer cost and INR expenses" },
    { group: "Result", label: "Current cash position", value: financials.currentCashPositionInr === null ? "Unavailable" : formatCurrency(financials.currentCashPositionInr, "INR"), note: financials.cashUnavailableReason ?? "INR received less writer payments and expenses paid" },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><Banknote aria-hidden="true" className="size-5 text-slate-400" /><div><h2 className="font-semibold text-slate-900">Financial summary</h2><p className="mt-0.5 text-sm text-slate-500">Quoted value, liabilities, profit, and cash remain distinct.</p></div></div>
      <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => <div key={item.label} className="bg-white p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">{item.group}</p><p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">{item.label}</p><div className="mt-2 text-base font-semibold text-slate-900">{item.value}</div><p className="mt-1 text-xs leading-5 text-slate-500">{item.note}</p></div>)}
      </div>
    </Card>
  );
}

export function AssignmentNotes({ assignment }: Pick<WorkflowDetailsProps, "assignment">) {
  if (!assignment.notes) return null;
  return <Card className="p-5"><div className="flex items-center gap-3"><FileText aria-hidden="true" className="size-5 text-slate-400" /><h2 className="font-semibold text-slate-900">Internal notes</h2></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{assignment.notes}</p></Card>;
}
