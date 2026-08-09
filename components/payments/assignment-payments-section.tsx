import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { ClientPaymentDialog } from "./client-payment-dialog";
import { WorkerPaymentDialog } from "./worker-payment-dialog";
import {
  ClientPaymentsTable,
  WorkerPaymentsTable,
} from "./payment-tables";
import { DataError } from "@/components/ui/data-error";
import type { Assignment } from "@/types/assignment";
import type { PaymentsData } from "@/lib/queries/payments";

export function AssignmentPaymentsSection({
  assignment,
  payments,
}: {
  assignment: Assignment;
  payments: PaymentsData;
}) {
  const scopedAssignments = payments.assignments.filter(
    (item) => item.id === assignment.id
  );
  const scopedAllocations = payments.allocations.filter(
    (allocation) => allocation.assignment_id === assignment.id
  );
  const defaultPayer = payments.eligiblePayers.some(
    (payer) => payer.id === assignment.received_from_id
  )
    ? assignment.received_from_id
    : undefined;
  const options = {
    assignments: scopedAssignments,
    payers: payments.eligiblePayers,
    allocations: scopedAllocations,
    accounts: payments.accounts,
  };

  return (
    <section className="space-y-6" aria-labelledby="assignment-payments-heading">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Transactions</p>
        <h2 id="assignment-payments-heading" className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Payments</h2>
        <p className="mt-1 text-sm text-slate-500">Track each payment received and paid as a separate transaction.</p>
      </div>

      {payments.error ? (
        <DataError message={payments.error} />
      ) : (
        <>
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownToLine aria-hidden="true" className="size-4 text-emerald-600" />
                <h3 className="font-semibold text-slate-900">Client payments</h3>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{payments.clientPayments.length}</span>
              </div>
              <ClientPaymentDialog
                assignments={scopedAssignments}
                payers={payments.eligiblePayers}
                accounts={payments.accounts}
                defaultAssignmentId={assignment.id}
                defaultPayerId={defaultPayer}
              />
            </div>
            <ClientPaymentsTable payments={payments.clientPayments} options={options} />
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpFromLine aria-hidden="true" className="size-4 text-amber-600" />
                <h3 className="font-semibold text-slate-900">Writer payments</h3>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{payments.workerPayments.length}</span>
              </div>
              <WorkerPaymentDialog
                allocations={scopedAllocations}
                accounts={payments.accounts}
              />
            </div>
            <WorkerPaymentsTable payments={payments.workerPayments} options={options} />
          </div>
        </>
      )}
    </section>
  );
}
