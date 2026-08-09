"use client";

import { useActionState, useRef } from "react";
import { LoaderCircle, Trash2, X } from "lucide-react";
import { deleteExpense } from "@/lib/actions/expenses";

export function DeleteExpenseDialog({
  expenseId,
  description,
  returnAssignmentId,
}: {
  expenseId: string;
  description: string;
  returnAssignmentId?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(
    deleteExpense.bind(null, expenseId, returnAssignmentId ?? null),
    {}
  );
  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-red-600 hover:bg-red-50"><Trash2 aria-hidden="true" className="size-3.5" /> Delete</button>
      <dialog ref={dialogRef} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-slate-200 bg-white p-0 text-slate-950 shadow-xl backdrop:bg-slate-950/45" aria-labelledby={"delete-expense-" + expenseId}>
        <form action={formAction}>
          <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
            <div><h2 id={"delete-expense-" + expenseId} className="font-semibold text-slate-900">Delete expense?</h2><p className="mt-1 text-sm text-slate-500">Assignment financial totals will update after deletion.</p></div>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close dialog" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"><X aria-hidden="true" className="size-4" /></button>
          </div>
          <div className="px-5 py-4"><p className="text-sm leading-6 text-slate-600">Permanently delete <strong className="font-semibold text-slate-900">{description}</strong>?</p>{state.error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}</div>
          <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4"><button type="button" onClick={() => dialogRef.current?.close()} disabled={pending} className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={pending} className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-60">{pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}{pending ? "Deleting…" : "Delete expense"}</button></div>
        </form>
      </dialog>
    </>
  );
}
