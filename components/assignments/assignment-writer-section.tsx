import Link from "next/link";
import {
  CalendarClock,
  CircleCheck,
  HandCoins,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { DataError } from "@/components/ui/data-error";
import { AssignmentWorkerDialog } from "./assignment-worker-dialog";
import { AssignmentWorkerStatusBadge } from "./assignment-worker-status-badge";
import { DeleteAssignmentWorkerDialog } from "./delete-assignment-worker-dialog";
import { getFinancialSummaryNumber } from "@/lib/utils/financial-summary";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/format";
import type { Assignment, AssignmentFinancialSummary } from "@/types/assignment";
import type {
  AssignmentWorker,
  EligibleWriter,
} from "@/types/assignment-worker";

type AssignmentWriterSectionProps = {
  assignment: Assignment;
  allocations: AssignmentWorker[];
  eligibleWriters: EligibleWriter[];
  financialSummary: AssignmentFinancialSummary | null;
  error?: string;
};

export function AssignmentWriterSection({
  assignment,
  allocations,
  eligibleWriters,
  financialSummary,
  error,
}: AssignmentWriterSectionProps) {
  const assignedWriterIds = allocations.map((allocation) => allocation.worker_id);
  const viewWriterCost = getFinancialSummaryNumber(financialSummary, [
    "worker_cost",
    "writer_cost",
    "total_writer_cost",
  ]);
  const sameCurrency = allocations.every(
    (allocation) => allocation.currency === assignment.currency
  );
  const directWriterCost = sameCurrency
    ? allocations.reduce((total, allocation) => total + allocation.agreed_cost, 0)
    : null;
  const writerCost = viewWriterCost ?? directWriterCost;
  const expectedGrossProfit = getFinancialSummaryNumber(financialSummary, [
    "expected_gross_profit",
    "gross_profit",
  ]);
  const availableWriterCount = eligibleWriters.filter(
    (writer) => !assignedWriterIds.includes(writer.id)
  ).length;

  const modeMessage =
    assignment.work_mode === "self"
      ? "This assignment is being completed personally. External writers are optional."
      : assignment.work_mode === "outsourced"
        ? "This assignment is outsourced. Add one or more writers to define responsibility and agreed cost."
        : "The owner is involved in this mixed assignment, and external writers can also be allocated.";

  return (
    <section className="space-y-4" aria-labelledby="writer-allocation-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Work allocation</p>
          <h2 id="writer-allocation-heading" className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Writers</h2>
          <p className="mt-1 text-sm text-slate-500">{modeMessage}</p>
        </div>
        <AssignmentWorkerDialog
          assignmentId={assignment.id}
          writers={eligibleWriters}
          assignedWriterIds={assignedWriterIds}
          assignmentCurrency={assignment.currency}
          subdued={assignment.work_mode === "self"}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Number of writers", value: String(allocations.length), icon: UsersRound },
          { label: "Total agreed writer cost", value: writerCost === null ? "Not available" : formatCurrency(writerCost, assignment.currency), icon: HandCoins },
          { label: "Selling price", value: formatCurrency(assignment.selling_price, assignment.currency), icon: UserRoundCog },
          { label: "Expected gross profit", value: expectedGrossProfit === null ? "Not available" : formatCurrency(expectedGrossProfit, assignment.currency), icon: CircleCheck },
        ].map((item) => (
          <Card key={item.label} className="flex items-start justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-medium text-slate-500">{item.label}</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{item.value}</p>
            </div>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <item.icon aria-hidden="true" className="size-4" />
            </span>
          </Card>
        ))}
      </div>

      {error ? (
        <DataError message={error} />
      ) : allocations.length === 0 ? (
        <Card className={"flex min-h-48 flex-col items-center justify-center px-6 py-8 text-center " + (assignment.work_mode === "outsourced" ? "border-amber-200 bg-amber-50/40" : "")}>
          <span className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <UsersRound aria-hidden="true" className="size-5" />
          </span>
          <h3 className="mt-4 font-semibold text-slate-900">
            {assignment.work_mode === "self" ? "No external writer needed" : "No external writer assigned yet"}
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {assignment.work_mode === "self"
              ? "Add a writer only if you decide to involve external support."
              : "Add a writer if this task is outsourced or mixed."}
          </p>
          {eligibleWriters.length === 0 && (
            <Link href="/contacts/new" className="mt-4 text-sm font-semibold text-indigo-700 hover:underline">
              Create a writer contact
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {allocations.map((allocation) => (
            <Card key={allocation.id} className="overflow-hidden">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900">{allocation.worker?.name ?? "Unavailable writer"}</h3>
                  <p className="mt-1 text-xs text-slate-500">Assigned {formatDate(allocation.assigned_date)}</p>
                </div>
                <AssignmentWorkerStatusBadge status={allocation.status} />
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Work description</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{allocation.work_description}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Writer deadline</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700"><CalendarClock aria-hidden="true" className="size-3.5 text-slate-400" />{formatDateTime(allocation.worker_deadline)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Agreed cost</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{formatCurrency(allocation.agreed_cost, allocation.currency)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Delivery state</p>
                    <p className={"mt-1 text-sm font-medium " + (allocation.delivered_at ? "text-emerald-700" : "text-slate-500")}>
                      {allocation.delivered_at ? "Delivered " + formatDateTime(allocation.delivered_at) : "Not delivered yet"}
                    </p>
                  </div>
                </div>
                {allocation.notes && (
                  <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">{allocation.notes}</div>
                )}
              </div>
              <div className="flex justify-end gap-1 border-t border-slate-100 bg-slate-50/60 px-3 py-2">
                <AssignmentWorkerDialog
                  assignmentId={assignment.id}
                  allocationId={allocation.id}
                  writers={eligibleWriters}
                  assignedWriterIds={assignedWriterIds}
                  initialValues={allocation}
                  assignmentCurrency={assignment.currency}
                />
                <DeleteAssignmentWorkerDialog
                  assignmentId={assignment.id}
                  allocationId={allocation.id}
                  writerName={allocation.worker?.name ?? "this writer"}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {eligibleWriters.length > 0 && availableWriterCount === 0 && allocations.length > 0 && (
        <p className="text-xs text-slate-500">All eligible writer contacts are already allocated to this assignment.</p>
      )}
    </section>
  );
}
