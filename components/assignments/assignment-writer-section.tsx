import Link from "next/link";
import { CalendarClock, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CurrencyValues } from "@/components/ui/currency-values";
import { DataError } from "@/components/ui/data-error";
import { WorkerPaymentDialog } from "@/components/payments/worker-payment-dialog";
import { AssignmentWorkerDialog } from "./assignment-worker-dialog";
import { AssignmentWorkerStatusBadge } from "./assignment-worker-status-badge";
import { DeleteAssignmentWorkerDialog } from "./delete-assignment-worker-dialog";
import { groupCurrencyAmounts } from "@/lib/utils/currency";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import type { PaymentsData } from "@/lib/queries/payments";
import type { Assignment } from "@/types/assignment";
import type { AssignmentWorker, EligibleWriter } from "@/types/assignment-worker";

type Props = { assignment: Assignment; allocations: AssignmentWorker[]; eligibleWriters: EligibleWriter[]; payments: PaymentsData; error?: string };

export function AssignmentWriterSection({ assignment, allocations, eligibleWriters, payments, error }: Props) {
  const assignedWriterIds = allocations.map((row) => row.worker_id);
  const active = allocations.filter((row) => row.status !== "cancelled");
  const costs = groupCurrencyAmounts(active, (row) => row.currency, (row) => row.agreed_cost);
  const canAdd = eligibleWriters.some((writer) => !assignedWriterIds.includes(writer.id));
  const needsWriter = assignment.work_mode !== "self";

  return (
    <section className="space-y-3" aria-labelledby="writer-allocation-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Work allocation</p><div className="mt-1 flex flex-wrap items-baseline gap-x-3"><h2 id="writer-allocation-heading" className="text-xl font-semibold tracking-tight text-slate-950">Writers</h2>{active.length > 0 && <p className="text-sm text-slate-500">{active.length} allocated · <span className="font-medium text-slate-700"><CurrencyValues values={costs} /></span> agreed</p>}</div></div>
        {allocations.length === 0 && <AssignmentWorkerDialog assignmentId={assignment.id} writers={eligibleWriters} assignedWriterIds={assignedWriterIds} subdued={!needsWriter} />}
      </div>
      {error ? <DataError message={error} /> : allocations.length === 0 ? (
        <div className={"flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between " + (needsWriter ? "border-amber-200 bg-amber-50/60" : "border-slate-200 bg-white")}>
          <div className="flex items-center gap-3"><UsersRound aria-hidden="true" className={needsWriter ? "size-5 text-amber-600" : "size-5 text-slate-400"} /><div><p className="text-sm font-medium text-slate-800">{needsWriter ? "No writer assigned." : "This assignment is being completed personally."}</p><p className="text-xs text-slate-500">{needsWriter ? "Assign a writer to establish responsibility and cost." : "External writer allocation is optional."}</p></div></div>
          {eligibleWriters.length === 0 && <Link href="/contacts/new?role=writer" className="text-sm font-semibold text-indigo-700 hover:underline">Add a writer contact</Link>}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {allocations.map((allocation) => {
            const allocationPayments = payments.workerPayments.filter((payment) => payment.assignment_worker_id === allocation.id && payment.currency === allocation.currency);
            const paid = allocationPayments.reduce((sum, payment) => sum + payment.amount, 0);
            const payable = Math.max(allocation.agreed_cost - paid, 0);
            const paymentAllocation = payments.allocations.find((item) => item.id === allocation.id);
            return <Card key={allocation.id} className="p-4">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-semibold text-slate-900">{allocation.worker?.name ?? "Unavailable writer"}</h3>{allocation.work_description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{allocation.work_description}</p>}</div><AssignmentWorkerStatusBadge status={allocation.status} /></div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><div><dt className="text-xs text-slate-400">Deadline</dt><dd className="mt-1 flex items-center gap-1 text-slate-700"><CalendarClock aria-hidden="true" className="size-3.5" />{formatDateTime(allocation.worker_deadline)}</dd></div><div><dt className="text-xs text-slate-400">Agreed cost</dt><dd className="mt-1 font-semibold text-slate-800">{formatCurrency(allocation.agreed_cost, allocation.currency)}</dd></div><div><dt className="text-xs text-slate-400">Paid</dt><dd className="mt-1 text-slate-700">{formatCurrency(paid, allocation.currency)}</dd></div><div><dt className="text-xs text-slate-400">Payable</dt><dd className="mt-1 font-semibold text-amber-700">{formatCurrency(payable, allocation.currency)}</dd></div></dl>
              {allocation.notes && <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">{allocation.notes}</p>}
              <div className="mt-3 flex flex-wrap justify-end gap-1 border-t border-slate-100 pt-2">
                {paymentAllocation && <WorkerPaymentDialog allocations={[paymentAllocation]} accounts={payments.accounts} defaultAllocationId={allocation.id} lockAllocationContext />}
                <AssignmentWorkerDialog assignmentId={assignment.id} allocationId={allocation.id} writers={eligibleWriters} assignedWriterIds={assignedWriterIds} initialValues={allocation} />
                <DeleteAssignmentWorkerDialog assignmentId={assignment.id} allocationId={allocation.id} writerName={allocation.worker?.name ?? "this writer"} />
              </div>
            </Card>;
          })}
        </div>
      )}
      {allocations.length > 0 && canAdd && <div className="flex justify-end"><AssignmentWorkerDialog assignmentId={assignment.id} writers={eligibleWriters} assignedWriterIds={assignedWriterIds} subdued createLabel="Assign another writer" /></div>}
    </section>
  );
}
