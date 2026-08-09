import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  CalendarDays,
  CircleUserRound,
  FileText,
  ReceiptText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { DataError } from "@/components/ui/data-error";
import { DeadlineIndicator } from "./deadline-indicator";
import { getFinancialSummaryNumber } from "@/lib/utils/financial-summary";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type {
  Assignment,
  AssignmentFinancialSummary,
} from "@/types/assignment";

function FutureSection({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          <span className="mt-3 inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">Future phase</span>
        </div>
      </div>
    </Card>
  );
}

export function AssignmentDetails({
  assignment,
  financialSummary,
  financialError,
}: {
  assignment: Assignment;
  financialSummary: AssignmentFinancialSummary | null;
  financialError?: string;
}) {
  const financialItems = [
    { label: "Selling price", value: assignment.selling_price },
    { label: "Client received", value: getFinancialSummaryNumber(financialSummary, ["client_received", "total_received", "amount_received"]) },
    { label: "Client outstanding", value: getFinancialSummaryNumber(financialSummary, ["client_outstanding", "outstanding_amount"]) },
    { label: "Writer cost", value: getFinancialSummaryNumber(financialSummary, ["writer_cost", "total_writer_cost"]) },
    { label: "Writer paid", value: getFinancialSummaryNumber(financialSummary, ["writer_paid", "total_writer_paid"]) },
    { label: "Writer payable", value: getFinancialSummaryNumber(financialSummary, ["writer_payable"]) },
    { label: "Expected gross profit", value: getFinancialSummaryNumber(financialSummary, ["expected_gross_profit", "gross_profit"]) },
    { label: "Expected net profit", value: getFinancialSummaryNumber(financialSummary, ["expected_net_profit", "net_profit"]) },
    { label: "Current cash margin", value: getFinancialSummaryNumber(financialSummary, ["current_cash_margin", "current_cash_flow"]) },
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
              <p className={"mt-2 text-lg font-semibold " + (item.value === null ? "text-slate-400" : "text-slate-900")}>
                {item.value === null ? "Not available" : formatCurrency(item.value, assignment.currency)}
              </p>
            </div>
          ))}
        </div>
      </Card>
      {financialError && <DataError message={financialError} />}

      <div className="grid gap-6">
        <FutureSection icon={ReceiptText} title="Expenses" description="Assignment-specific expenses will appear here." />
      </div>

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
