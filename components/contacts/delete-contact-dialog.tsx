"use client";

import { useActionState, useRef } from "react";
import { LoaderCircle, Trash2, X } from "lucide-react";
import { deleteContact } from "@/lib/actions/contacts";

type DeleteContactDialogProps = {
  contactId: string;
  contactName: string;
};

export function DeleteContactDialog({ contactId, contactName }: DeleteContactDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const boundAction = deleteContact.bind(null, contactId);
  const [state, formAction, pending] = useActionState(boundAction, {});

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
      >
        <Trash2 aria-hidden="true" className="size-4" />
        Delete
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-slate-200 bg-white p-0 text-slate-950 shadow-xl backdrop:bg-slate-950/45"
        aria-labelledby="delete-contact-title"
      >
        <form action={formAction}>
          <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 id="delete-contact-title" className="font-semibold text-slate-900">Delete contact?</h2>
              <p className="mt-1 text-sm text-slate-500">This action cannot be undone.</p>
            </div>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close dialog" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm leading-6 text-slate-600">
              Are you sure you want to permanently delete <strong className="font-semibold text-slate-900">{contactName}</strong>?
            </p>
            {state.error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
            <button type="button" onClick={() => dialogRef.current?.close()} disabled={pending} className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
              {pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
              {pending ? "Deleting…" : "Delete contact"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
