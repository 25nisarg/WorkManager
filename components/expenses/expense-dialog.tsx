"use client";

import { useActionState, useRef } from "react";
import { LoaderCircle, Pencil, Plus, X } from "lucide-react";
import { createExpense, updateExpense } from "@/lib/actions/expenses";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expenses";
import { PAYMENT_METHODS } from "@/lib/constants/payments";
import { COMMON_CURRENCIES } from "@/lib/constants/contacts";
import type {
  ExpenseAssignment,
  ExpenseFormValues,
  ExpensePaymentAccount,
} from "@/types/expense";

type Props = {
  expenseId?: string;
  assignments: ExpenseAssignment[];
  accounts: ExpensePaymentAccount[];
  initialValues?: ExpenseFormValues;
  defaultAssignmentId?: string;
  returnToAssignment?: boolean;
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

export function ExpenseDialog({
  expenseId,
  assignments,
  accounts,
  initialValues,
  defaultAssignmentId,
  returnToAssignment = false,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editing = Boolean(expenseId);
  const categoryListId = "expense-category-suggestions-" + (expenseId ?? "new");
  const action = expenseId
    ? updateExpense.bind(null, expenseId)
    : createExpense;
  const [state, formAction, pending] = useActionState(action, {});
  const submitted = state.values;
  const selectedAssignment = asText(
    submitted?.assignment_id,
    initialValues?.assignment_id ?? defaultAssignmentId
  );
  const currency = asText(
    submitted?.currency,
    initialValues?.currency ?? "INR"
  );
  const currencies = COMMON_CURRENCIES.includes(
    currency as (typeof COMMON_CURRENCIES)[number]
  )
    ? COMMON_CURRENCIES
    : [currency, ...COMMON_CURRENCIES];

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={
          editing
            ? "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
            : "inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        }
      >
        {editing ? <Pencil aria-hidden="true" className="size-3.5" /> : <Plus aria-hidden="true" className="size-4" />}
        {editing ? "Edit" : "Add expense"}
      </button>
      <dialog ref={dialogRef} className="m-auto max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-950 shadow-xl backdrop:bg-slate-950/45" aria-labelledby={(editing ? "edit" : "add") + "-expense-title"}>
        <form action={formAction}>
          {returnToAssignment && selectedAssignment && (
            <input type="hidden" name="return_to_assignment" value={selectedAssignment} />
          )}
          <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
            <div>
              <h2 id={(editing ? "edit" : "add") + "-expense-title"} className="font-semibold text-slate-900">{editing ? "Edit expense" : "Add expense"}</h2>
              <p className="mt-1 text-sm text-slate-500">Record a general or assignment-specific business cost.</p>
            </div>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close dialog" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"><X aria-hidden="true" className="size-4" /></button>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            {state.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</div>}
            <div className="space-y-2">
              <label htmlFor={"expense-category-" + (expenseId ?? "new")} className="block text-sm font-medium text-slate-700">Category *</label>
              <input id={"expense-category-" + (expenseId ?? "new")} name="category" list={categoryListId} defaultValue={asText(submitted?.category, initialValues?.category ?? "")} placeholder="Choose or enter a category" aria-invalid={Boolean(state.fieldErrors?.category)} className={fieldClass} />
              <datalist id={categoryListId}>{EXPENSE_CATEGORIES.map((category) => <option key={category} value={category} />)}</datalist>
              {state.fieldErrors?.category && <p className="text-xs text-red-600">{state.fieldErrors.category[0]}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor={"expense-date-" + (expenseId ?? "new")} className="block text-sm font-medium text-slate-700">Expense date *</label>
              <input id={"expense-date-" + (expenseId ?? "new")} name="expense_date" type="date" defaultValue={asText(submitted?.expense_date, initialValues?.expense_date ?? todayInputValue())} aria-invalid={Boolean(state.fieldErrors?.expense_date)} className={fieldClass} />
              {state.fieldErrors?.expense_date && <p className="text-xs text-red-600">{state.fieldErrors.expense_date[0]}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor={"expense-description-" + (expenseId ?? "new")} className="block text-sm font-medium text-slate-700">Description *</label>
              <input id={"expense-description-" + (expenseId ?? "new")} name="description" defaultValue={asText(submitted?.description, initialValues?.description ?? "")} placeholder="What was this expense for?" aria-invalid={Boolean(state.fieldErrors?.description)} className={fieldClass} />
              {state.fieldErrors?.description && <p className="text-xs text-red-600">{state.fieldErrors.description[0]}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor={"expense-amount-" + (expenseId ?? "new")} className="block text-sm font-medium text-slate-700">Amount *</label>
              <input id={"expense-amount-" + (expenseId ?? "new")} name="amount" type="number" min="0.01" step="0.01" defaultValue={asText(submitted?.amount, String(initialValues?.amount ?? ""))} aria-invalid={Boolean(state.fieldErrors?.amount)} className={fieldClass} />
              {state.fieldErrors?.amount && <p className="text-xs text-red-600">{state.fieldErrors.amount[0]}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor={"expense-currency-" + (expenseId ?? "new")} className="block text-sm font-medium text-slate-700">Currency *</label>
              <select id={"expense-currency-" + (expenseId ?? "new")} name="currency" defaultValue={currency} className={fieldClass}>{currencies.map((item) => <option key={item} value={item}>{item}</option>)}</select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor={"expense-assignment-" + (expenseId ?? "new")} className="block text-sm font-medium text-slate-700">Assignment <span className="font-normal text-slate-400">(optional)</span></label>
              <select id={"expense-assignment-" + (expenseId ?? "new")} name="assignment_id" defaultValue={selectedAssignment} disabled={returnToAssignment} aria-invalid={Boolean(state.fieldErrors?.assignment_id)} className={fieldClass}>
                <option value="">General business expense</option>
                {assignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.task_code} — {assignment.title}</option>)}
              </select>
              {returnToAssignment && <input type="hidden" name="assignment_id" value={selectedAssignment} />}
              {state.fieldErrors?.assignment_id && <p className="text-xs text-red-600">{state.fieldErrors.assignment_id[0]}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor={"expense-method-" + (expenseId ?? "new")} className="block text-sm font-medium text-slate-700">Payment method *</label>
              <select id={"expense-method-" + (expenseId ?? "new")} name="payment_method" defaultValue={asText(submitted?.payment_method, initialValues?.payment_method ?? "bank_transfer")} className={fieldClass}>{PAYMENT_METHODS.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}</select>
            </div>
            <div className="space-y-2">
              <label htmlFor={"expense-account-" + (expenseId ?? "new")} className="block text-sm font-medium text-slate-700">Payment account</label>
              <select id={"expense-account-" + (expenseId ?? "new")} name="payment_account_id" defaultValue={asText(submitted?.payment_account_id, initialValues?.payment_account_id ?? "")} aria-invalid={Boolean(state.fieldErrors?.payment_account_id)} className={fieldClass}>
                <option value="">No account</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.account_name}{!account.is_active ? " (Inactive)" : ""}</option>)}
              </select>
              {state.fieldErrors?.payment_account_id && <p className="text-xs text-red-600">{state.fieldErrors.payment_account_id[0]}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor={"expense-reference-" + (expenseId ?? "new")} className="block text-sm font-medium text-slate-700">Transaction reference</label>
              <input id={"expense-reference-" + (expenseId ?? "new")} name="transaction_reference" defaultValue={asText(submitted?.transaction_reference, initialValues?.transaction_reference ?? "")} className={fieldClass} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor={"expense-notes-" + (expenseId ?? "new")} className="block text-sm font-medium text-slate-700">Notes</label>
              <textarea id={"expense-notes-" + (expenseId ?? "new")} name="notes" rows={3} defaultValue={asText(submitted?.notes, initialValues?.notes ?? "")} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
            </div>
          </div>
          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
            <button type="button" onClick={() => dialogRef.current?.close()} disabled={pending} className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">Cancel</button>
            <button type="submit" disabled={pending} className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-60">{pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}{pending ? "Saving…" : editing ? "Save changes" : "Add expense"}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
