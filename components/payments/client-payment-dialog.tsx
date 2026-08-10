"use client";

import { useActionState, useRef } from "react";
import { ArrowDownToLine, LoaderCircle, Pencil, X } from "lucide-react";
import {
  createClientPayment,
  updateClientPayment,
} from "@/lib/actions/payments";
import { PAYMENT_METHODS } from "@/lib/constants/payments";
import { COMMON_CURRENCIES } from "@/lib/constants/contacts";
import type {
  ClientPaymentFormValues,
  PaymentAccount,
  PaymentAssignment,
  PaymentContact,
} from "@/types/payment";

type ClientPaymentDialogProps = {
  paymentId?: string;
  assignments: PaymentAssignment[];
  payers: PaymentContact[];
  accounts: PaymentAccount[];
  initialValues?: ClientPaymentFormValues;
  defaultAssignmentId?: string;
  defaultPayerId?: string;
  lockAssignmentContext?: boolean;
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

export function ClientPaymentDialog({
  paymentId,
  assignments,
  payers,
  accounts,
  initialValues,
  defaultAssignmentId,
  defaultPayerId,
  lockAssignmentContext = false,
}: ClientPaymentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editing = Boolean(paymentId);
  const action = paymentId
    ? updateClientPayment.bind(null, paymentId)
    : createClientPayment.bind(null, lockAssignmentContext ? defaultAssignmentId ?? null : null);
  const [state, formAction, pending] = useActionState(action, {});
  const submitted = state.values;
  const currency = asText(
    submitted?.currency_original,
    initialValues?.currency_original ?? (lockAssignmentContext ? assignments[0]?.currency : undefined) ?? "INR"
  );
  const currencies = COMMON_CURRENCIES.includes(
    currency as (typeof COMMON_CURRENCIES)[number]
  )
    ? COMMON_CURRENCIES
    : [currency, ...COMMON_CURRENCIES];

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className={editing ? "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-slate-600 hover:bg-slate-100" : "inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"}>
        {editing ? <Pencil aria-hidden="true" className="size-3.5" /> : <ArrowDownToLine aria-hidden="true" className="size-4" />}
        {editing ? "Edit" : "Record received"}
      </button>
      <dialog ref={dialogRef} className="m-auto max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-950 shadow-xl backdrop:bg-slate-950/45" aria-labelledby={(editing ? "edit" : "add") + "-client-payment-title"}>
        <form action={formAction}>
          <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
            <div>
              <h2 id={(editing ? "edit" : "add") + "-client-payment-title"} className="font-semibold text-slate-900">{editing ? "Edit received payment" : "Record received payment"}</h2>
              <p className="mt-1 text-sm text-slate-500">Preserve the original payment and actual INR credited.</p>
            </div>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close dialog" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"><X aria-hidden="true" className="size-4" /></button>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            {state.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</div>}
            {lockAssignmentContext && !editing ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Assignment and payer</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{assignments[0]?.task_code} — {assignments[0]?.title}</p>
                <p className="mt-1 text-xs text-slate-500">Payer is securely inferred from the assignment client/source.</p>
              </div>
            ) : <><div className="space-y-2 sm:col-span-2">
              <label htmlFor={"client-payment-assignment-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Assignment *</label>
              <select id={"client-payment-assignment-" + (paymentId ?? "new")} name="assignment_id" defaultValue={asText(submitted?.assignment_id, initialValues?.assignment_id ?? defaultAssignmentId)} aria-invalid={Boolean(state.fieldErrors?.assignment_id)} className={fieldClass}>
                <option value="" disabled>Select an assignment</option>
                {assignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.task_code} — {assignment.title}</option>)}
              </select>
              {state.fieldErrors?.assignment_id && <p className="text-xs text-red-600">{state.fieldErrors.assignment_id[0]}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor={"client-payment-payer-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Payer *</label>
              <select id={"client-payment-payer-" + (paymentId ?? "new")} name="payer_id" defaultValue={asText(submitted?.payer_id, initialValues?.payer_id ?? defaultPayerId)} aria-invalid={Boolean(state.fieldErrors?.payer_id)} className={fieldClass}>
                <option value="" disabled>Select a student, vendor, or freelancer</option>
                {payers.map((payer) => <option key={payer.id} value={payer.id}>{payer.name}{payer.company_name ? " — " + payer.company_name : ""}</option>)}
              </select>
              {state.fieldErrors?.payer_id && <p className="text-xs text-red-600">{state.fieldErrors.payer_id[0]}</p>}
            </div></>}
            <div className="space-y-2">
              <label htmlFor={"client-payment-date-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Payment date *</label>
              <input id={"client-payment-date-" + (paymentId ?? "new")} name="payment_date" type="date" defaultValue={asText(submitted?.payment_date, initialValues?.payment_date ?? todayInputValue())} className={fieldClass} />
            </div>
            <div className="space-y-2">
              <label htmlFor={"original-currency-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Original currency</label>
              <select id={"original-currency-" + (paymentId ?? "new")} name="currency_original" defaultValue={currency} className={fieldClass}>
                {currencies.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor={"original-amount-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Original amount *</label>
              <input id={"original-amount-" + (paymentId ?? "new")} name="amount_original" type="number" min="0.01" step="0.01" defaultValue={asText(submitted?.amount_original, String(initialValues?.amount_original ?? ""))} aria-invalid={Boolean(state.fieldErrors?.amount_original)} className={fieldClass} />
              {state.fieldErrors?.amount_original && <p className="text-xs text-red-600">{state.fieldErrors.amount_original[0]}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor={"exchange-rate-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Exchange rate <span className="font-normal text-slate-400">(optional)</span></label>
              <input id={"exchange-rate-" + (paymentId ?? "new")} name="exchange_rate" type="number" min="0.000001" step="any" defaultValue={asText(submitted?.exchange_rate, initialValues?.exchange_rate === null || initialValues?.exchange_rate === undefined ? "" : String(initialValues.exchange_rate))} aria-invalid={Boolean(state.fieldErrors?.exchange_rate)} className={fieldClass} />
              {state.fieldErrors?.exchange_rate && <p className="text-xs text-red-600">{state.fieldErrors.exchange_rate[0]}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor={"actual-inr-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Actual INR received *</label>
              <input id={"actual-inr-" + (paymentId ?? "new")} name="amount_inr" type="number" min="0.01" step="0.01" defaultValue={asText(submitted?.amount_inr, String(initialValues?.amount_inr ?? ""))} aria-invalid={Boolean(state.fieldErrors?.amount_inr)} className={fieldClass} />
              {state.fieldErrors?.amount_inr && <p className="text-xs text-red-600">{state.fieldErrors.amount_inr[0]}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor={"client-method-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Payment method *</label>
              <select id={"client-method-" + (paymentId ?? "new")} name="payment_method" defaultValue={asText(submitted?.payment_method, initialValues?.payment_method ?? "bank_transfer")} className={fieldClass}>
                {PAYMENT_METHODS.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor={"client-account-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Payment account</label>
              <select id={"client-account-" + (paymentId ?? "new")} name="payment_account_id" defaultValue={asText(submitted?.payment_account_id, initialValues?.payment_account_id ?? "")} className={fieldClass}>
                <option value="">No account</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}{!account.is_active ? " (Inactive)" : ""}</option>)}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor={"client-reference-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Transaction reference</label>
              <input id={"client-reference-" + (paymentId ?? "new")} name="transaction_reference" defaultValue={asText(submitted?.transaction_reference, initialValues?.transaction_reference ?? "")} placeholder="Bank, UPI, or platform reference" className={fieldClass} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor={"client-notes-" + (paymentId ?? "new")} className="block text-sm font-medium text-slate-700">Notes</label>
              <textarea id={"client-notes-" + (paymentId ?? "new")} name="notes" rows={3} defaultValue={asText(submitted?.notes, initialValues?.notes ?? "")} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
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
