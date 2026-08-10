import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { ClientPaymentDialog } from "./client-payment-dialog";
import { ClientPaymentsTable, WorkerPaymentsTable } from "./payment-tables";
import { DataError } from "@/components/ui/data-error";
import type { Assignment } from "@/types/assignment";
import type { PaymentsData } from "@/lib/queries/payments";

function scopedOptions(assignment: Assignment, payments: PaymentsData) {
  return {
    assignments: payments.assignments.filter((item) => item.id === assignment.id),
    payers: payments.eligiblePayers,
    allocations: payments.allocations.filter((item) => item.assignment_id === assignment.id),
    accounts: payments.accounts,
  };
}

export function AssignmentClientPaymentsSection({ assignment, payments }: { assignment: Assignment; payments: PaymentsData }) {
  const options = scopedOptions(assignment, payments);
  const payer = assignment.received_from?.name ?? "assignment client";
  return (
    <section className="space-y-3" aria-labelledby="client-payments-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex items-center gap-2"><ArrowDownToLine aria-hidden="true" className="size-4 text-emerald-600" /><h2 id="client-payments-heading" className="font-semibold text-slate-900">Client payments</h2><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{payments.clientPayments.length}</span></div><p className="mt-1 text-sm text-slate-500">Payments from {payer}; assignment and payer are inferred automatically.</p></div>
        {!payments.error && <ClientPaymentDialog assignments={options.assignments} payers={options.payers} accounts={options.accounts} defaultAssignmentId={assignment.id} defaultPayerId={assignment.received_from_id} lockAssignmentContext />}
      </div>
      {payments.error ? <DataError message={payments.error} /> : <ClientPaymentsTable payments={payments.clientPayments} options={options} assignmentContext />}
    </section>
  );
}

export function AssignmentWriterPaymentsSection({ assignment, payments }: { assignment: Assignment; payments: PaymentsData }) {
  const options = scopedOptions(assignment, payments);
  return (
    <section className="space-y-3" aria-labelledby="writer-payments-heading">
      <div><div className="flex items-center gap-2"><ArrowUpFromLine aria-hidden="true" className="size-4 text-amber-600" /><h2 id="writer-payments-heading" className="font-semibold text-slate-900">Writer payments</h2><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{payments.workerPayments.length}</span></div><p className="mt-1 text-sm text-slate-500">Record a payment directly from its writer allocation above.</p></div>
      {payments.error ? <DataError message={payments.error} /> : <WorkerPaymentsTable payments={payments.workerPayments} options={options} assignmentContext />}
    </section>
  );
}
