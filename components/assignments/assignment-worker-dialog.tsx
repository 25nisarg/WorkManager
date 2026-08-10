"use client";

import { useActionState, useRef } from "react";
import { LoaderCircle, Pencil, Plus, X } from "lucide-react";
import {
  createAssignmentWorker,
  updateAssignmentWorker,
} from "@/lib/actions/assignment-workers";
import { ASSIGNMENT_WORKER_STATUSES } from "@/lib/constants/assignment-workers";
import type {
  AssignmentWorkerActionState,
  AssignmentWorkerFormValues,
  EligibleWriter,
} from "@/types/assignment-worker";

type AssignmentWorkerDialogProps = {
  assignmentId: string;
  allocationId?: string;
  writers: EligibleWriter[];
  assignedWriterIds: string[];
  initialValues?: AssignmentWorkerFormValues;
  subdued?: boolean;
};

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 aria-[invalid=true]:border-red-400";

function asText(value: string | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toLocalDateTime(value?: string | null) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localTime = date.getTime() - date.getTimezoneOffset() * 60 * 1000;
  return new Date(localTime).toISOString().slice(0, 16);
}

export function AssignmentWorkerDialog({
  assignmentId,
  allocationId,
  writers,
  assignedWriterIds,
  initialValues,
  subdued = false,
}: AssignmentWorkerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editing = Boolean(allocationId);
  const serverAction = allocationId
    ? updateAssignmentWorker.bind(null, assignmentId, allocationId)
    : createAssignmentWorker.bind(null, assignmentId);
  const actionWithTimezone = (
    state: AssignmentWorkerActionState,
    formData: FormData
  ) => {
    formData.set("timezone_offset", String(new Date().getTimezoneOffset()));
    return serverAction(state, formData);
  };
  const [state, formAction, pending] = useActionState(actionWithTimezone, {});
  const submitted = state.values;
  const selectedWriterId = asText(
    submitted?.worker_id,
    initialValues?.worker_id
  );
  const availableWriters = writers.filter(
    (writer) =>
      writer.id === selectedWriterId || !assignedWriterIds.includes(writer.id)
  );
  const assignedDate = asText(submitted?.assigned_date, initialValues?.assigned_date ?? new Date().toISOString().slice(0, 10));
  const allocationCurrency = asText(submitted?.currency, initialValues?.currency ?? "INR");
  const deliveredAt = asText(submitted?.delivered_at, initialValues?.delivered_at ?? "");

  return (
    <>
      <button
        type="button"
        disabled={!editing && availableWriters.length === 0}
        onClick={() => dialogRef.current?.showModal()}
        className={
          editing
            ? "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
            : subdued
              ? "inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              : "inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {editing ? <Pencil aria-hidden="true" className="size-4" /> : <Plus aria-hidden="true" className="size-4" />}
        {editing ? "Edit" : "Add writer"}
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-950 shadow-xl backdrop:bg-slate-950/45"
        aria-labelledby={(editing ? "edit" : "add") + "-writer-title"}
      >
        <form action={formAction}>
          <input type="hidden" name="assigned_date" value={assignedDate} />
          <input type="hidden" name="currency" value={allocationCurrency} />
          <input type="hidden" name="delivered_at" value={toLocalDateTime(deliveredAt)} />
          <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
            <div>
              <h2 id={(editing ? "edit" : "add") + "-writer-title"} className="font-semibold text-slate-900">
                {editing ? "Edit writer allocation" : "Add writer allocation"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">Track agreed work, cost, deadline, and delivery status.</p>
            </div>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close dialog" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2">
            {state.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</div>}

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor={"worker_id-" + (allocationId ?? "new")} className="block text-sm font-medium text-slate-700">Writer *</label>
              <select
                id={"worker_id-" + (allocationId ?? "new")}
                name="worker_id"
                defaultValue={selectedWriterId}
                aria-invalid={Boolean(state.fieldErrors?.worker_id)}
                className={fieldClass}
              >
                <option value="" disabled>Select a writer or freelancer</option>
                {availableWriters.map((writer) => (
                  <option key={writer.id} value={writer.id}>
                    {writer.name}{writer.company_name ? " — " + writer.company_name : ""}{!writer.is_active ? " (Inactive)" : ""}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.worker_id && <p className="text-xs text-red-600">{state.fieldErrors.worker_id[0]}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor={"work_description-" + (allocationId ?? "new")} className="block text-sm font-medium text-slate-700">Work description *</label>
              <textarea
                id={"work_description-" + (allocationId ?? "new")}
                name="work_description"
                rows={3}
                defaultValue={asText(submitted?.work_description, initialValues?.work_description)}
                placeholder="Report, coding, presentation, research…"
                aria-invalid={Boolean(state.fieldErrors?.work_description)}
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
              {state.fieldErrors?.work_description && <p className="text-xs text-red-600">{state.fieldErrors.work_description[0]}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor={"worker_deadline-" + (allocationId ?? "new")} className="block text-sm font-medium text-slate-700">Writer deadline *</label>
              <input id={"worker_deadline-" + (allocationId ?? "new")} name="worker_deadline" type="datetime-local" defaultValue={toLocalDateTime(asText(submitted?.worker_deadline, initialValues?.worker_deadline))} aria-invalid={Boolean(state.fieldErrors?.worker_deadline)} className={fieldClass} />
              {state.fieldErrors?.worker_deadline && <p className="text-xs text-red-600">{state.fieldErrors.worker_deadline[0]}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor={"agreed_cost-" + (allocationId ?? "new")} className="block text-sm font-medium text-slate-700">Agreed cost *</label>
              <input id={"agreed_cost-" + (allocationId ?? "new")} name="agreed_cost" type="number" min="0" step="0.01" defaultValue={asText(submitted?.agreed_cost, String(initialValues?.agreed_cost ?? 0))} aria-invalid={Boolean(state.fieldErrors?.agreed_cost)} className={fieldClass} />
              {state.fieldErrors?.agreed_cost && <p className="text-xs text-red-600">{state.fieldErrors.agreed_cost[0]}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor={"worker-status-" + (allocationId ?? "new")} className="block text-sm font-medium text-slate-700">Status</label>
              <select id={"worker-status-" + (allocationId ?? "new")} name="status" defaultValue={asText(submitted?.status, initialValues?.status ?? "assigned")} className={fieldClass}>
                {ASSIGNMENT_WORKER_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </div>
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">{editing && allocationCurrency !== "INR" ? `This existing allocation remains in ${allocationCurrency}.` : "Agreed costs are recorded in INR for the current workflow."}</div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor={"worker-notes-" + (allocationId ?? "new")} className="block text-sm font-medium text-slate-700">Notes</label>
              <textarea id={"worker-notes-" + (allocationId ?? "new")} name="notes" rows={3} defaultValue={asText(submitted?.notes, initialValues?.notes ?? "")} placeholder="Private delivery notes or context…" className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
              {state.fieldErrors?.notes && <p className="text-xs text-red-600">{state.fieldErrors.notes[0]}</p>}
            </div>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
            <button type="button" onClick={() => dialogRef.current?.close()} disabled={pending} className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={pending} className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
              {pending ? "Saving…" : editing ? "Save changes" : "Add writer"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
