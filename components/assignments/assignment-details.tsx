import {
  Banknote,
  CalendarDays,
  CircleUserRound,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { CurrencyValues } from "@/components/ui/currency-values";
import { DeadlineIndicator } from "./deadline-indicator";
import { groupCurrencyAmounts, subtractCurrencyAmounts } from "@/lib/utils/currency";
import { calculateAssignmentInrFinancials } from "@/lib/utils/financial-model";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { ExpensesData } from "@/lib/queries/expenses";
import type { PaymentsData } from "@/lib/queries/payments";
import type { Assignment } from "@/types/assignment";
import type { AssignmentWorker } from "@/types/assignment-worker";

export function AssignmentDetails({
  assignment,
  allocations,
  payments,
  expenses,
}: {
  assignment: Assignment;
  allocations: AssignmentWorker[];
  payments: PaymentsData;
  expenses: ExpensesData;
}) {
  const matchingClientPayments = payments.clientPayments.filter((payment) => payment.currency_original === assignment.currency);
  const unmatchedClientPayments = payments.clientPayments.length - matchingClientPayments.length;
  const clientReceived = matchingClientPayments.reduce((sum, payment) => sum + payment.amount_original, 0);
  const actualInrReceived = payments.clientPayments.reduce((sum, payment) => sum + payment.amount_inr, 0);
  const activeAllocations = allocations.filter((allocation) => allocation.status !== "cancelled");
  const workerCosts = groupCurrencyAmounts(activeAllocations, (allocation) => allocation.currency, (allocation) => allocation.agreed_cost);
  const workerPaid = groupCurrencyAmounts(payments.workerPayments, (payment) => payment.currency, (payment) => payment.amount);
  const expenseTotals = groupCurrencyAmounts(expenses.expenses, (expense) => expense.currency, (expense) => expense.amount);
  const financials = calculateAssignmentInrFinancials({
    workMode: assignment.work_mode,
    actualInrReceived,
    workerCosts: activeAllocations,
    workerPayments: payments.workerPayments,
    expenses: expenses.expenses,
  });
  const workerPayable = subtractCurrencyAmounts(workerCosts, workerPaid);
  const financialItems = [
    { label: "Quoted price", value: formatCurrency(assignment.selling_price, assignment.currency), note: "Original assignment currency" },
    { label: "Original amount paid", value: formatCurrency(clientReceived, assignment.currency), note: unmatchedClientPayments ? `${unmatchedClientPayments} other-currency payment(s) excluded` : "Original payments matching assignment currency" },
    { label: "Client outstanding", value: formatCurrency(Math.max(assignment.selling_price - clientReceived, 0), assignment.currency), note: "Selling price less matching original payments" },
    { label: "Actual INR received", value: formatCurrency(actualInrReceived, "INR"), note: "Actual amount credited" },
    { label: "Writer agreed cost", value: <CurrencyValues values={workerCosts} />, note: assignment.work_mode === "self" ? "Not deducted from self-work profit" : "Liability from non-cancelled allocations" },
    { label: "Writer paid", value: <CurrencyValues values={workerPaid} />, note: "Payments by original currency" },
    { label: "Writer payable", value: <CurrencyValues values={workerPayable} />, note: "Agreed cost less matching-currency payments" },
    { label: "Assignment expenses", value: <CurrencyValues values={expenseTotals} />, note: "Expenses by original currency" },
    { label: "Actual profit to date", value: financials.actualProfitInr === null ? "Unavailable" : formatCurrency(financials.actualProfitInr, "INR"), note: financials.profitUnavailableReason ?? "Actual INR received to date less agreed INR writer cost and INR expenses" },
    { label: "Current cash position", value: financials.currentCashPositionInr === null ? "Unavailable" : formatCurrency(financials.currentCashPositionInr, "INR"), note: financials.cashUnavailableReason ?? "Actual INR received less writer payments and expenses actually paid" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Overview</h2>
          </div>
          <dl className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2">
            <div><dt className="text-xs uppercase tracking-wide text-slate-400">Subject</dt><dd className="mt-1 text-sm font-medium text-slate-800">{assignment.subject || "Not provided"}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-slate-400">Assessment</dt><dd className="mt-1 text-sm font-medium text-slate-800">{assignment.assessment_name || "Not provided"}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-slate-400">Copies</dt><dd className="mt-1 text-sm font-medium text-slate-800">{assignment.number_of_copies}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-slate-400">Price per copy</dt><dd className="mt-1 text-sm font-medium text-slate-800">{formatCurrency(assignment.price_per_copy, assignment.currency)}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs uppercase tracking-wide text-slate-400">Description</dt><dd className={"mt-1 whitespace-pre-wrap text-sm leading-6 " + (assignment.description ? "text-slate-700" : "text-slate-400")}>{assignment.description || "No description provided."}</dd></div>
          </dl>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <CircleUserRound aria-hidden="true" className="size-5 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Client / source</h2>
            </div>
            {assignment.received_from ? (
              <div className="mt-4">
                <p className="font-medium text-slate-900">{assignment.received_from.name}</p>
                <p className="mt-1 text-sm text-slate-500">{assignment.received_from.company_name || "Independent contact"}</p>
                <a href={"/contacts/" + assignment.received_from.id} className="mt-3 inline-flex text-sm font-medium text-indigo-700 hover:underline">View contact</a>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Contact information is unavailable.</p>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <CalendarDays aria-hidden="true" className="size-5 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Schedule and deadline</h2>
            </div>
            <dl className="mt-4 space-y-4">
              <div><dt className="text-xs uppercase tracking-wide text-slate-400">Received</dt><dd className="mt-1 text-sm font-medium text-slate-700">{formatDate(assignment.received_date)}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-slate-400">Client deadline</dt><dd className="mt-1"><DeadlineIndicator deadline={assignment.client_deadline} state={assignment.deadline_state} /></dd></div>
            </dl>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <Banknote aria-hidden="true" className="size-5 text-slate-400" />
          <div>
            <h2 className="font-semibold text-slate-900">Financial overview</h2>
            <p className="mt-0.5 text-sm text-slate-500">Assignment values and existing financial summary data.</p>
          </div>
        </div>
        <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-4">
          {financialItems.map((item) => (
            <div key={item.label} className="bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{item.label}</p>
              <div className="mt-2 text-lg font-semibold text-slate-900">{item.value}</div>
              <p className="mt-1 text-xs leading-5 text-slate-500">{item.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-3">
          <FileText aria-hidden="true" className="size-5 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Notes</h2>
        </div>
        <p className={"mt-3 whitespace-pre-wrap text-sm leading-6 " + (assignment.notes ? "text-slate-600" : "text-slate-400")}>{assignment.notes || "No notes have been added."}</p>
      </Card>
    </div>
  );
}
