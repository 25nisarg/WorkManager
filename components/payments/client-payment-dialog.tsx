"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { ArrowDownToLine, LoaderCircle, Pencil, X } from "lucide-react";
import { createClientPayment, updateClientPayment } from "@/lib/actions/payments";
import { PAYMENT_METHODS } from "@/lib/constants/payments";
import { COMMON_CURRENCIES } from "@/lib/constants/contacts";
import { formatCurrency } from "@/lib/utils/format";
import type { ClientPaymentFormValues, PaymentAccount, PaymentAssignment, PaymentContact } from "@/types/payment";

type Props = { paymentId?: string; assignments: PaymentAssignment[]; payers: PaymentContact[]; accounts: PaymentAccount[]; initialValues?: ClientPaymentFormValues; defaultAssignmentId?: string; defaultPayerId?: string; lockAssignmentContext?: boolean };
type AllocationDraft = Record<string, { amount_original: string; amount_inr: string }>;
const fieldClass = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 aria-[invalid=true]:border-red-400";
const asText = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
const today = () => { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

function suggestProportionalInr(drafts: AllocationDraft, totalInr: string) {
  const entries = Object.entries(drafts);
  const totalCents = Math.round((Number(totalInr) || 0) * 100);
  const originalTotal = entries.reduce((sum, [, row]) => sum + (Number(row.amount_original) || 0), 0);
  if (entries.length === 0 || totalCents <= 0 || originalTotal <= 0) return drafts;
  let allocatedCents = 0;
  return Object.fromEntries(entries.map(([id, row], index) => {
    const cents = index === entries.length - 1
      ? totalCents - allocatedCents
      : Math.round(totalCents * ((Number(row.amount_original) || 0) / originalTotal));
    allocatedCents += cents;
    return [id, { ...row, amount_inr: (cents / 100).toFixed(2) }];
  }));
}

export function ClientPaymentDialog({ paymentId, assignments, payers, accounts, initialValues, defaultAssignmentId, defaultPayerId, lockAssignmentContext = false }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editing = Boolean(paymentId);
  const action = paymentId ? updateClientPayment.bind(null, paymentId) : createClientPayment.bind(null, lockAssignmentContext ? defaultAssignmentId ?? null : null);
  const [state, formAction, pending] = useActionState(action, {});
  const [payerId, setPayerId] = useState(initialValues?.payer_id ?? defaultPayerId ?? "");
  const [originalCurrency, setOriginalCurrency] = useState(initialValues?.currency_original ?? (lockAssignmentContext ? assignments.find((row) => row.id === defaultAssignmentId)?.currency : undefined) ?? "INR");
  const [totalOriginal, setTotalOriginal] = useState(String(initialValues?.amount_original ?? ""));
  const [totalInr, setTotalInr] = useState(String(initialValues?.amount_inr ?? ""));
  const [drafts, setDrafts] = useState<AllocationDraft>(() => Object.fromEntries((initialValues?.allocations ?? []).map((row) => [row.assignment_id, { amount_original: String(row.amount_original), amount_inr: String(row.amount_inr) }])));
  const selectedIds = Object.keys(drafts);
  const availableAssignments = assignments.filter((assignment) => assignment.received_from_id === payerId && assignment.currency === originalCurrency && (assignment.outstanding_original > 0 || selectedIds.includes(assignment.id)));
  const allocationRows = lockAssignmentContext
    ? defaultAssignmentId ? [{ assignment_id: defaultAssignmentId, amount_original: Number(totalOriginal), amount_inr: Number(totalInr) }] : []
    : selectedIds.map((assignmentId) => ({ assignment_id: assignmentId, amount_original: Number(drafts[assignmentId].amount_original), amount_inr: Number(drafts[assignmentId].amount_inr) }));
  const allocatedOriginal = allocationRows.reduce((sum, row) => sum + (Number.isFinite(row.amount_original) ? row.amount_original : 0), 0);
  const allocatedInr = allocationRows.reduce((sum, row) => sum + (Number.isFinite(row.amount_inr) ? row.amount_inr : 0), 0);
  const allocationsBalanced = lockAssignmentContext || (selectedIds.length > 0 && Math.abs(Number(totalOriginal || 0) - allocatedOriginal) < 0.009 && Math.abs(Number(totalInr || 0) - allocatedInr) < 0.009);
  const currency = asText(state.values?.currency_original, originalCurrency);
  const currencies = useMemo(() => COMMON_CURRENCIES.includes(currency as (typeof COMMON_CURRENCIES)[number]) ? COMMON_CURRENCIES : [currency, ...COMMON_CURRENCIES], [currency]);
  const updateDraft = (id: string, field: "amount_original" | "amount_inr", value: string) => setDrafts((current) => {
    const next = { ...current, [id]: { ...current[id], [field]: value } };
    return field === "amount_original" ? suggestProportionalInr(next, totalInr) : next;
  });

  return <>
    <button type="button" onClick={() => dialogRef.current?.showModal()} className={editing ? "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-slate-600 hover:bg-slate-100" : "inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"}>{editing ? <Pencil className="size-3.5" /> : <ArrowDownToLine className="size-4" />}{editing ? "Edit" : "Record received"}</button>
    <dialog ref={dialogRef} className="m-auto max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-950 shadow-xl backdrop:bg-slate-950/45">
      <form action={formAction}>
        <input type="hidden" name="allocations" value={JSON.stringify(allocationRows)} />
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4"><div><h2 className="font-semibold text-slate-900">{editing ? "Edit received payment" : "Record received payment"}</h2><p className="mt-1 text-sm text-slate-500">Record one transaction and allocate it across the client’s assignments.</p></div><button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close dialog" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"><X className="size-4" /></button></div>
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          {state.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</div>}
          {lockAssignmentContext ? <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:col-span-2"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Assignment and payer</p><p className="mt-1 text-sm font-semibold text-slate-800">{assignments.find((row) => row.id === defaultAssignmentId)?.task_code} — {assignments.find((row) => row.id === defaultAssignmentId)?.title}</p><p className="mt-1 text-xs text-slate-500">Payer: {payers.find((row) => row.id === defaultPayerId)?.name ?? "assignment client/source"}</p></div> : <div className="space-y-2 sm:col-span-2"><label htmlFor={`payer-${paymentId ?? "new"}`} className="text-sm font-medium text-slate-700">Client / vendor *</label><select id={`payer-${paymentId ?? "new"}`} name="payer_id" value={payerId} onChange={(event) => { setPayerId(event.target.value); setDrafts({}); }} className={fieldClass}><option value="" disabled>Select a payer</option>{payers.map((payer) => <option key={payer.id} value={payer.id}>{payer.name}{payer.company_name ? ` — ${payer.company_name}` : ""}</option>)}</select></div>}
          {lockAssignmentContext && <input type="hidden" name="payer_id" value={defaultPayerId ?? ""} />}
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Payment date *</label><input name="payment_date" type="date" defaultValue={asText(state.values?.payment_date, initialValues?.payment_date ?? today())} className={fieldClass} /></div>
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Original currency *</label><select name="currency_original" value={originalCurrency} onChange={(event) => { setOriginalCurrency(event.target.value); if (!lockAssignmentContext) setDrafts({}); }} className={fieldClass}>{currencies.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Payment total *</label><input name="amount_original" type="number" min="0.01" step="0.01" value={totalOriginal} onChange={(event) => setTotalOriginal(event.target.value)} className={fieldClass} /></div>
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Actual INR received *</label><input name="amount_inr" type="number" min="0.01" step="0.01" value={totalInr} onChange={(event) => { const value = event.target.value; setTotalInr(value); setDrafts((current) => suggestProportionalInr(current, value)); }} className={fieldClass} /></div>
          {!lockAssignmentContext && <div className="sm:col-span-2"><div className="mb-2 flex items-end justify-between"><div><h3 className="text-sm font-semibold text-slate-800">Assignment allocations</h3><p className="text-xs text-slate-500">Outstanding {originalCurrency} assignments received from this payer. INR is suggested proportionally and the last allocation absorbs rounding.</p></div></div>{!payerId ? <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">Select a payer to see assignments.</p> : availableAssignments.length === 0 ? <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">No outstanding assignments in {originalCurrency} for this payer.</p> : <div className="space-y-2">{availableAssignments.map((assignment) => { const checked = Boolean(drafts[assignment.id]); return <div key={assignment.id} className="rounded-lg border border-slate-200 p-3"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={checked} onChange={(event) => setDrafts((current) => { const next = { ...current }; if (event.target.checked) next[assignment.id] = { amount_original: String(Math.min(assignment.outstanding_original, Number(totalOriginal) || assignment.outstanding_original)), amount_inr: "" }; else delete next[assignment.id]; return suggestProportionalInr(next, totalInr); })} className="mt-1 size-4 accent-indigo-600" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">{assignment.task_code} — {assignment.title}</span><span className="mt-0.5 block text-xs text-slate-500">Outstanding {formatCurrency(assignment.outstanding_original, assignment.currency)}</span></span></label>{checked && <div className="mt-3 grid gap-3 pl-7 sm:grid-cols-2"><label className="text-xs text-slate-500">Original allocation<input type="number" min="0.01" step="0.01" value={drafts[assignment.id].amount_original} onChange={(event) => updateDraft(assignment.id, "amount_original", event.target.value)} className={`${fieldClass} mt-1`} /></label><label className="text-xs text-slate-500">INR allocation<input type="number" min="0.01" step="0.01" value={drafts[assignment.id].amount_inr} onChange={(event) => updateDraft(assignment.id, "amount_inr", event.target.value)} className={`${fieldClass} mt-1`} /></label></div>}</div>; })}</div>}<div className="mt-3 grid gap-2 rounded-lg bg-slate-900 p-3 text-sm text-white sm:grid-cols-3"><div><span className="text-slate-400">Payment total</span><p className="font-semibold">{originalCurrency} {Number(totalOriginal || 0).toFixed(2)}</p></div><div><span className="text-slate-400">Allocated</span><p className="font-semibold">{originalCurrency} {allocatedOriginal.toFixed(2)}</p></div><div><span className="text-slate-400">Remaining</span><p className={Math.abs(Number(totalOriginal || 0) - allocatedOriginal) < 0.01 ? "font-semibold text-emerald-300" : "font-semibold text-amber-300"}>{originalCurrency} {(Number(totalOriginal || 0) - allocatedOriginal).toFixed(2)}</p></div><div className="sm:col-span-3 text-xs text-slate-400">INR allocated ₹{allocatedInr.toFixed(2)} · remaining ₹{(Number(totalInr || 0) - allocatedInr).toFixed(2)}</div></div>{state.fieldErrors?.allocations && <p className="mt-2 text-xs text-red-600">{state.fieldErrors.allocations[0]}</p>}</div>}
          <input type="hidden" name="exchange_rate" value={asText(state.values?.exchange_rate, initialValues?.exchange_rate == null ? "" : String(initialValues.exchange_rate))} />
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Payment method *</label><select name="payment_method" defaultValue={asText(state.values?.payment_method, initialValues?.payment_method ?? "bank_transfer")} className={fieldClass}>{PAYMENT_METHODS.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}</select></div>
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Payment account</label><select name="payment_account_id" defaultValue={asText(state.values?.payment_account_id, initialValues?.payment_account_id ?? "")} className={fieldClass}><option value="">No account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}{!account.is_active ? " (Inactive)" : ""}</option>)}</select></div>
          <div className="space-y-2 sm:col-span-2"><label className="text-sm font-medium text-slate-700">Transaction reference</label><input name="transaction_reference" defaultValue={asText(state.values?.transaction_reference, initialValues?.transaction_reference ?? "")} className={fieldClass} /></div>
          <div className="space-y-2 sm:col-span-2"><label className="text-sm font-medium text-slate-700">Notes</label><textarea name="notes" rows={3} defaultValue={asText(state.values?.notes, initialValues?.notes ?? "")} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" /></div>
        </div>
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4"><p className="text-xs text-amber-700">{!allocationsBalanced && !lockAssignmentContext ? "Allocate both totals completely before saving." : ""}</p><div className="flex gap-3"><button type="button" onClick={() => dialogRef.current?.close()} className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={pending || !allocationsBalanced} className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{pending && <LoaderCircle className="size-4 animate-spin" />}{pending ? "Saving…" : editing ? "Save changes" : "Record payment"}</button></div></div>
      </form>
    </dialog>
  </>;
}
