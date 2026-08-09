"use client";

import { useActionState, useRef } from "react";
import { LoaderCircle, Pencil, Plus, X } from "lucide-react";
import { createPaymentAccount, updatePaymentAccount } from "@/lib/actions/expenses";
import { PAYMENT_ACCOUNT_TYPES } from "@/lib/constants/expenses";
import { COMMON_CURRENCIES } from "@/lib/constants/contacts";
import type { PaymentAccountFormValues } from "@/types/expense";

const fieldClass = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 aria-[invalid=true]:border-red-400";
function asText(value: string | undefined, fallback = "") { return typeof value === "string" ? value : fallback; }

export function PaymentAccountDialog({ accountId, initialValues }: { accountId?: string; initialValues?: PaymentAccountFormValues }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editing = Boolean(accountId);
  const action = accountId ? updatePaymentAccount.bind(null, accountId) : createPaymentAccount;
  const [state, formAction, pending] = useActionState(action, {});
  const submitted = state.values;
  const currency = asText(submitted?.currency, initialValues?.currency ?? "INR");
  const currencies = COMMON_CURRENCIES.includes(currency as (typeof COMMON_CURRENCIES)[number]) ? COMMON_CURRENCIES : [currency, ...COMMON_CURRENCIES];
  const active = submitted ? submitted.is_active === "active" : initialValues?.is_active ?? true;
  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className={editing ? "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-slate-600 hover:bg-slate-100" : "inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"}>{editing ? <Pencil aria-hidden="true" className="size-3.5" /> : <Plus aria-hidden="true" className="size-4" />}{editing ? "Edit" : "Add account"}</button>
      <dialog ref={dialogRef} className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-slate-200 bg-white p-0 text-slate-950 shadow-xl backdrop:bg-slate-950/45" aria-labelledby={(editing ? "edit" : "add") + "-payment-account-title"}>
        <form action={formAction}>
          <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4"><div><h2 id={(editing ? "edit" : "add") + "-payment-account-title"} className="font-semibold text-slate-900">{editing ? "Edit payment account" : "Add payment account"}</h2><p className="mt-1 text-sm text-slate-500">Accounts can be attached to payments and expenses.</p></div><button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close dialog" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"><X aria-hidden="true" className="size-4" /></button></div>
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            {state.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</div>}
            <div className="space-y-2 sm:col-span-2"><label htmlFor={"account-name-" + (accountId ?? "new")} className="block text-sm font-medium text-slate-700">Account name *</label><input id={"account-name-" + (accountId ?? "new")} name="account_name" defaultValue={asText(submitted?.account_name, initialValues?.account_name ?? "")} placeholder="HDFC Bank" aria-invalid={Boolean(state.fieldErrors?.account_name)} className={fieldClass} />{state.fieldErrors?.account_name && <p className="text-xs text-red-600">{state.fieldErrors.account_name[0]}</p>}</div>
            <div className="space-y-2"><label htmlFor={"account-type-" + (accountId ?? "new")} className="block text-sm font-medium text-slate-700">Account type *</label><select id={"account-type-" + (accountId ?? "new")} name="account_type" defaultValue={asText(submitted?.account_type, initialValues?.account_type ?? "bank")} className={fieldClass}>{PAYMENT_ACCOUNT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></div>
            <div className="space-y-2"><label htmlFor={"account-currency-" + (accountId ?? "new")} className="block text-sm font-medium text-slate-700">Currency *</label><select id={"account-currency-" + (accountId ?? "new")} name="currency" defaultValue={currency} className={fieldClass}>{currencies.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
            <div className="space-y-2 sm:col-span-2"><label htmlFor={"account-notes-" + (accountId ?? "new")} className="block text-sm font-medium text-slate-700">Notes</label><textarea id={"account-notes-" + (accountId ?? "new")} name="notes" rows={3} defaultValue={asText(submitted?.notes, initialValues?.notes ?? "")} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" /></div>
            <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 sm:col-span-2"><input type="checkbox" name="is_active" defaultChecked={active} className="mt-0.5 size-4 rounded border-slate-300 text-indigo-600" /><span><span className="block text-sm font-medium text-slate-800">Active account</span><span className="mt-0.5 block text-xs text-slate-500">Inactive accounts remain available on historical transactions.</span></span></label>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4"><button type="button" onClick={() => dialogRef.current?.close()} disabled={pending} className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={pending} className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-60">{pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}{pending ? "Saving…" : editing ? "Save changes" : "Add account"}</button></div>
        </form>
      </dialog>
    </>
  );
}
