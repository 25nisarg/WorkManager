import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ClientPaymentDialog } from "./client-payment-dialog";
import { WorkerPaymentDialog } from "./worker-payment-dialog";
import { DeletePaymentDialog } from "./delete-payment-dialog";
import { PAYMENT_METHODS } from "@/lib/constants/payments";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type {
  ClientPayment,
  PaymentAccount,
  PaymentAllocation,
  PaymentAssignment,
  PaymentContact,
  WorkerPayment,
} from "@/types/payment";

type PaymentOptions = {
  assignments: PaymentAssignment[];
  payers: PaymentContact[];
  allocations: PaymentAllocation[];
  accounts: PaymentAccount[];
};

const methodLabels = new Map<string, string>(
  PAYMENT_METHODS.map((method) => [method.value, method.label])
);

export function ClientPaymentsTable({
  payments,
  options,
  assignmentContext = false,
}: {
  payments: ClientPayment[];
  options: PaymentOptions;
  assignmentContext?: boolean;
}) {
  if (payments.length === 0) {
    return (
      <Card className={assignmentContext ? "flex items-center gap-3 px-4 py-3" : "flex min-h-44 flex-col items-center justify-center px-6 py-8 text-center"}>
        <ArrowDownToLine aria-hidden="true" className="size-6 text-slate-400" />
        <div><p className={assignmentContext ? "font-medium text-slate-800" : "mt-3 font-medium text-slate-800"}>No client payments recorded</p><p className="mt-1 text-sm text-slate-500">Each payment received will appear as a separate transaction.</p></div>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1050px] text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Date</th>
              {!assignmentContext && <th className="px-4 py-3">Assignments</th>}
              <th className="px-4 py-3">Payer</th>
              <th className="px-4 py-3">Original amount</th>
              <th className="px-4 py-3">INR received</th>
              <th className="px-4 py-3">Method / Account</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <tr key={payment.id} className="align-top hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{formatDate(payment.payment_date)}</td>
                {!assignmentContext && <td className="max-w-56 px-4 py-4">{payment.allocations.map((allocation) => <div key={allocation.id} className="mb-1 last:mb-0"><p className="font-mono text-xs font-semibold text-indigo-700">{allocation.assignment?.task_code ?? "Unavailable"}</p><p className="truncate text-xs text-slate-500">{formatCurrency(allocation.amount_original, payment.currency_original)}</p></div>)}</td>}
                <td className="px-4 py-4 text-sm font-medium text-slate-700">{payment.payer?.name ?? "Unavailable"}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">{formatCurrency(assignmentContext ? payment.allocations.find((row) => row.assignment_id === options.assignments[0]?.id)?.amount_original ?? 0 : payment.amount_original, payment.currency_original)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-emerald-700">{formatCurrency(assignmentContext ? payment.allocations.find((row) => row.assignment_id === options.assignments[0]?.id)?.amount_inr ?? 0 : payment.amount_inr, "INR")}</td>
                <td className="px-4 py-4 text-sm text-slate-600"><p>{methodLabels.get(payment.payment_method) ?? payment.payment_method}</p><p className="mt-1 text-xs text-slate-400">{payment.account?.name ?? "No account"}</p></td>
                <td className="max-w-44 px-4 py-4 text-sm text-slate-500"><p className="truncate">{payment.transaction_reference || "—"}</p>{payment.notes && <p className="mt-1 line-clamp-2 text-xs text-slate-400">{payment.notes}</p>}</td>
                <td className="px-4 py-4"><div className="flex justify-end gap-1">
                  <ClientPaymentDialog paymentId={payment.id} assignments={options.assignments} payers={options.payers} accounts={options.accounts} initialValues={payment} />
                  <DeletePaymentDialog paymentId={payment.id} direction="received" description={formatCurrency(payment.amount_inr, "INR") + " received"} />
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-slate-100 lg:hidden">
        {payments.map((payment) => (
          <article key={payment.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>{!assignmentContext && <p className="font-mono text-xs font-semibold text-indigo-700">{payment.allocations.map((allocation) => allocation.assignment?.task_code).filter(Boolean).join(", ") || "Unavailable"}</p>}<p className={assignmentContext ? "font-medium text-slate-800" : "mt-1 font-medium text-slate-800"}>{payment.payer?.name ?? "Unavailable payer"}</p></div>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"><ArrowDownToLine aria-hidden="true" className="size-3" />Received</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-slate-400">Date</dt><dd className="mt-1 text-slate-700">{formatDate(payment.payment_date)}</dd></div>
              <div><dt className="text-xs text-slate-400">INR received</dt><dd className="mt-1 font-semibold text-emerald-700">{formatCurrency(assignmentContext ? payment.allocations.find((row) => row.assignment_id === options.assignments[0]?.id)?.amount_inr ?? 0 : payment.amount_inr, "INR")}</dd></div>
              <div><dt className="text-xs text-slate-400">Original</dt><dd className="mt-1 text-slate-700">{formatCurrency(assignmentContext ? payment.allocations.find((row) => row.assignment_id === options.assignments[0]?.id)?.amount_original ?? 0 : payment.amount_original, payment.currency_original)}</dd></div>
              <div><dt className="text-xs text-slate-400">Method</dt><dd className="mt-1 text-slate-700">{methodLabels.get(payment.payment_method) ?? payment.payment_method}</dd></div>
            </dl>
            {(payment.transaction_reference || payment.notes) && <p className="mt-3 text-xs leading-5 text-slate-500">{payment.transaction_reference}{payment.transaction_reference && payment.notes ? " · " : ""}{payment.notes}</p>}
            <div className="mt-3 flex justify-end gap-1 border-t border-slate-100 pt-2">
              <ClientPaymentDialog paymentId={payment.id} assignments={options.assignments} payers={options.payers} accounts={options.accounts} initialValues={payment} />
              <DeletePaymentDialog paymentId={payment.id} direction="received" description={formatCurrency(payment.amount_inr, "INR") + " received"} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function WorkerPaymentsTable({
  payments,
  options,
  assignmentContext = false,
}: {
  payments: WorkerPayment[];
  options: PaymentOptions;
  assignmentContext?: boolean;
}) {
  if (payments.length === 0) {
    return (
      <Card className={assignmentContext ? "flex items-center gap-3 px-4 py-3" : "flex min-h-44 flex-col items-center justify-center px-6 py-8 text-center"}>
        <ArrowUpFromLine aria-hidden="true" className="size-6 text-slate-400" />
        <div><p className={assignmentContext ? "font-medium text-slate-800" : "mt-3 font-medium text-slate-800"}>No writer payments recorded</p><p className="mt-1 text-sm text-slate-500">Partial and full writer payments will appear here separately.</p></div>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[950px] text-left">
          <thead className="border-b border-slate-200 bg-slate-50"><tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Date</th>{!assignmentContext && <th className="px-4 py-3">Assignment</th>}<th className="px-4 py-3">Writer</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Method / Account</th><th className="px-4 py-3">Reference</th><th className="px-4 py-3 text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <tr key={payment.id} className="align-top hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{formatDate(payment.payment_date)}</td>
                {!assignmentContext && <td className="max-w-52 px-4 py-4"><p className="font-mono text-xs font-semibold text-indigo-700">{payment.allocation?.assignment?.task_code ?? "Unavailable"}</p><p className="mt-1 truncate text-sm text-slate-600">{payment.allocation?.assignment?.title}</p></td>}
                <td className="px-4 py-4 text-sm font-medium text-slate-700">{payment.writer?.name ?? "Unavailable"}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-800">{formatCurrency(payment.amount, payment.currency)}</td>
                <td className="px-4 py-4 text-sm text-slate-600"><p>{methodLabels.get(payment.payment_method) ?? payment.payment_method}</p><p className="mt-1 text-xs text-slate-400">{payment.account?.name ?? "No account"}</p></td>
                <td className="max-w-44 px-4 py-4 text-sm text-slate-500"><p className="truncate">{payment.transaction_reference || "—"}</p>{payment.notes && <p className="mt-1 line-clamp-2 text-xs text-slate-400">{payment.notes}</p>}</td>
                <td className="px-4 py-4"><div className="flex justify-end gap-1">
                  <WorkerPaymentDialog paymentId={payment.id} allocations={options.allocations} accounts={options.accounts} initialValues={payment} />
                  <DeletePaymentDialog paymentId={payment.id} direction="paid" description={formatCurrency(payment.amount, payment.currency) + " paid"} />
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-slate-100 lg:hidden">
        {payments.map((payment) => (
          <article key={payment.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>{!assignmentContext && <p className="font-mono text-xs font-semibold text-indigo-700">{payment.allocation?.assignment?.task_code ?? "Unavailable"}</p>}<p className={assignmentContext ? "font-medium text-slate-800" : "mt-1 font-medium text-slate-800"}>{payment.writer?.name ?? "Unavailable writer"}</p></div>
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"><ArrowUpFromLine aria-hidden="true" className="size-3" />Paid</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-slate-400">Date</dt><dd className="mt-1 text-slate-700">{formatDate(payment.payment_date)}</dd></div>
              <div><dt className="text-xs text-slate-400">Amount</dt><dd className="mt-1 font-semibold text-slate-800">{formatCurrency(payment.amount, payment.currency)}</dd></div>
              <div><dt className="text-xs text-slate-400">Method</dt><dd className="mt-1 text-slate-700">{methodLabels.get(payment.payment_method) ?? payment.payment_method}</dd></div>
              <div><dt className="text-xs text-slate-400">Account</dt><dd className="mt-1 text-slate-700">{payment.account?.name ?? "No account"}</dd></div>
            </dl>
            {payment.transaction_reference && <p className="mt-3 text-xs text-slate-500">{payment.transaction_reference}</p>}
            <div className="mt-3 flex justify-end gap-1 border-t border-slate-100 pt-2">
              <WorkerPaymentDialog paymentId={payment.id} allocations={options.allocations} accounts={options.accounts} initialValues={payment} />
              <DeletePaymentDialog paymentId={payment.id} direction="paid" description={formatCurrency(payment.amount, payment.currency) + " paid"} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
