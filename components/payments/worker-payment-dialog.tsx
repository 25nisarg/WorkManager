"use client";

import { useActionState, useRef, useState } from "react";
import { ArrowUpFromLine, LoaderCircle, Pencil, X } from "lucide-react";
import {
  createWorkerPayment,
  updateWorkerPayment,
} from "@/lib/actions/payments";
import { PAYMENT_METHODS } from "@/lib/constants/payments";
import { COMMON_CURRENCIES } from "@/lib/constants/contacts";
import type {
  PaymentAccount,
  PaymentAllocation,
  WorkerPaymentFormValues,
} from "@/types/payment";

type WorkerPaymentDialogProps = {
  paymentId?: string;
  allocations: PaymentAllocation[];
  accounts: PaymentAccount[];
  initialValues?: WorkerPaymentFormValues;
  defaultAllocationId?: string;
  lockAllocationContext?: boolean;
};

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 aria-[invalid=true]:border-red-400";

function asText(value: string | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function todayInputValue() {
  const now = new Date();
  const localTime = now.getTime() - now.getTimezoneOffset() * 60 * 1000;
  return new Date(localTime).toISOString().slice(0, 10);
}

export function WorkerPaymentDialog({
  paymentId,
  allocations,
  accounts,
  initialValues,
  defaultAllocationId,
  lockAllocationContext = false,
}: WorkerPaymentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editing = Boolean(paymentId);
  const action = paymentId
    ? updateWorkerPayment.bind(null, paymentId)
    : createWorkerPayment.bind(null, lockAllocationContext ? defaultAllocationId ?? null : null);
  const [state, formAction, pending] = useActionState(action, {});
  const submitted = state.values;
  const initialAllocationId = asText(
    submitted?.assignment_worker_id,
    initialValues?.assignment_worker_id ?? defaultAllocationId
  );
  const [allocationId, setAllocationId] = useState(initialAllocationId);
  const selectedAllocation = allocations.find(
    (allocation) => allocation.id === allocationId
  );
  const initialCurrency = asText(
    submitted?.currency,
    initialValues?.currency ?? selectedAllocation?.currency ?? "INR"
  );
  const [currency, setCurrency] = useState(initialCurrency);
  const currencies = COMMON_CURRENCIES.includes(
    currency as (typeof COMMON_CURRENCIES)[number]
  )
    ? COMMON_CURRENCIES
    : [currency, ...COMMON_CURRENCIES];

  return (
    <>
      <button type="button" disabled={!editing && allocations.length === 0} onClick={() => dialogRef.current?.showModal()} className={editing ? "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-slate-600 hover:bg-slate-100" : "inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"}>
        {editing ? <Pencil aria-hidden="true" className="size-3.5" /> : <ArrowUpFromLine aria-hidden="true" className="size-4" />}
        {editing ? "Edit" : "Record paid"}
      </button>
      <dialog ref={dialogRef} className="m-auto max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-950 shadow-xl backdrop:bg-slate-950/45" aria-labelledby={(editing ? "edit" : "add") + "-worker-payment-title"}>
        <form action={formAction}>
          <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
            <div>
              <h2 id={(editing ? "edit" : "add") + "-worker-payment-title"} className="font-semibold text-slate-900">{editing ? "Edit writer payment" : "Record writer payment"}</h2>
              <p className="mt-1 text-sm text-slate-500">Payments are linked to a specific writer allocation.</p>
            </div>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close dialog" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"><X aria-hidden="true" className="size-4" /></button>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            {state.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</div>}
            {lockAllocationContext && !editing ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Writer allocation</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{selectedAllocation?.assignment?.task_code} — {selectedAllocation?.writer?.name}</p>
                <p className="mt-1 text-xs text-slate-500">Assignment and writer are inferred from this allocation.</p>
                <input type="hidden" name="assignment_worker_id" value={initialAllocationId} />
              </div>
            ) : <div className="space-y-2 sm:col-span-2">
              <label htmlFor={"worker-payment-allocation-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Writer allocation *</label>
              <select
                id={"worker-payment-allocation-" + (paymentId ?? "new")}
                name="assignment_worker_id"
                value={allocationId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  setAllocationId(nextId);
                  const allocation = allocations.find((item) => item.id === nextId);
                  if (allocation) setCurrency(allocation.currency);
                }}
                aria-invalid={Boolean(state.fieldErrors?.assignment_worker_id)}
                className={fieldClass}
              >
                <option value="" disabled>Select an assignment writer</option>
                {allocations.map((allocation) => (
                  <option key={allocation.id} value={allocation.id}>
                    {allocation.assignment?.task_code ?? "Assignment"} — {allocation.writer?.name ?? "Writer"} — {allocation.work_description}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.assignment_worker_id && <p className="text-xs text-red-600">{state.fieldErrors.assignment_worker_id[0]}</p>}
            </div>}
            <div className="space-y-2 sm:col-span-2">
              <span className="block text-sm font-medium text-slate-700">Writer</span>
              <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                {selectedAllocation?.writer?.name ?? "Select an allocation"}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor={"worker-payment-date-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Payment date *</label>
              <input id={"worker-payment-date-" + (paymentId ?? "new")} name="payment_date" type="date" defaultValue={asText(submitted?.payment_date, initialValues?.payment_date ?? todayInputValue())} className={fieldClass} />
            </div>
            {lockAllocationContext && !editing ? (
              <div className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">Currency</span>
                <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">{selectedAllocation?.currency ?? currency}</div>
                <input type="hidden" name="currency" value={selectedAllocation?.currency ?? currency} />
              </div>
            ) : <div className="space-y-2">
              <label htmlFor={"worker-payment-currency-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Currency</label>
              <select id={"worker-payment-currency-" + (paymentId ?? "new")} name="currency" value={currency} onChange={(event) => setCurrency(event.target.value)} className={fieldClass}>
                {currencies.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>}
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor={"worker-payment-amount-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Amount *</label>
              <input id={"worker-payment-amount-" + (paymentId ?? "new")} name="amount" type="number" min="0.01" step="0.01" defaultValue={asText(submitted?.amount, String(initialValues?.amount ?? ""))} aria-invalid={Boolean(state.fieldErrors?.amount)} className={fieldClass} />
              {state.fieldErrors?.amount && <p className="text-xs text-red-600">{state.fieldErrors.amount[0]}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor={"worker-payment-method-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Payment method *</label>
              <select id={"worker-payment-method-" + (paymentId ?? "new")} name="payment_method" defaultValue={asText(submitted?.payment_method, initialValues?.payment_method ?? "bank_transfer")} className={fieldClass}>
                {PAYMENT_METHODS.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor={"worker-payment-account-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Payment account</label>
              <select id={"worker-payment-account-" + (paymentId ?? "new")} name="payment_account_id" defaultValue={asText(submitted?.payment_account_id, initialValues?.payment_account_id ?? "")} className={fieldClass}>
                <option value="">No account</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}{!account.is_active ? " (Inactive)" : ""}</option>)}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor={"worker-payment-reference-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Transaction reference</label>
              <input id={"worker-payment-reference-" + (paymentId ?? "new")} name="transaction_reference" defaultValue={asText(submitted?.transaction_reference, initialValues?.transaction_reference ?? "")} placeholder="Bank, UPI, or platform reference" className={fieldClass} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor={"worker-payment-notes-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Notes</label>
              <textarea id={"worker-payment-notes-" + (paymentId ?? "new")} name="notes" rows={3} defaultValue={asText(submitted?.notes, initialValues?.notes ?? "")} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
            </div>
          </div>
          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
            <button type="button" onClick={() => dialogRef.current?.close()} disabled={pending} className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">Cancel</button>
            <button type="submit" disabled={pending} className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-60">{pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}{pending ? "Saving…" : editing ? "Save changes" : "Record payment"}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
