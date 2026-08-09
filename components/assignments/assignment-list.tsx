import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import {
  AssignmentPriorityBadge,
  AssignmentStatusBadge,
  WorkModeBadge,
} from "./assignment-badges";
import { DeadlineIndicator } from "./deadline-indicator";
import { formatCurrency } from "@/lib/utils/format";
import type { Assignment } from "@/types/assignment";

export function AssignmentList({ assignments }: { assignments: Assignment[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[1180px] text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Task ID</th>
              <th className="px-4 py-3">Assignment</th>
              <th className="px-4 py-3">Received From</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Selling Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Work Mode</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assignments.map((assignment) => (
              <tr key={assignment.id} className="transition hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-4 font-mono text-xs font-semibold text-indigo-700">
                  {assignment.task_code}
                </td>
                <td className="max-w-64 px-4 py-4">
                  <Link href={"/assignments/" + assignment.id} className="block truncate text-sm font-medium text-slate-900 hover:text-indigo-700">
                    {assignment.title}
                  </Link>
                  <p className="mt-1 truncate text-xs text-slate-500">{assignment.subject || "No subject"}</p>
                </td>
                <td className="max-w-44 px-4 py-4">
                  <p className="truncate text-sm text-slate-700">{assignment.received_from?.name ?? "Unavailable"}</p>
                  {assignment.received_from?.company_name && <p className="mt-1 truncate text-xs text-slate-500">{assignment.received_from.company_name}</p>}
                </td>
                <td className="whitespace-nowrap px-4 py-4"><DeadlineIndicator deadline={assignment.client_deadline} state={assignment.deadline_state} /></td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-800">{formatCurrency(assignment.selling_price, assignment.currency)}</td>
                <td className="px-4 py-4"><AssignmentStatusBadge status={assignment.status} /></td>
                <td className="px-4 py-4"><AssignmentPriorityBadge priority={assignment.priority} /></td>
                <td className="px-4 py-4"><WorkModeBadge workMode={assignment.work_mode} /></td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-1">
                    <Link href={"/assignments/" + assignment.id} aria-label={"View " + assignment.task_code} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-700">
                      <Eye aria-hidden="true" className="size-4" />
                    </Link>
                    <Link href={"/assignments/" + assignment.id + "/edit"} aria-label={"Edit " + assignment.task_code} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-700">
                      <Pencil aria-hidden="true" className="size-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 xl:hidden">
        {assignments.map((assignment) => (
          <article key={assignment.id} className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold text-indigo-700">{assignment.task_code}</p>
                <Link href={"/assignments/" + assignment.id} className="mt-1 block truncate font-medium text-slate-900 hover:text-indigo-700">{assignment.title}</Link>
                <p className="mt-1 truncate text-sm text-slate-500">{assignment.subject || "No subject"}</p>
              </div>
              <AssignmentStatusBadge status={assignment.status} />
            </div>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Received from</dt>
                <dd className="mt-1 font-medium text-slate-700">{assignment.received_from?.name ?? "Unavailable"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Deadline</dt>
                <dd className="mt-1"><DeadlineIndicator deadline={assignment.client_deadline} state={assignment.deadline_state} compact /></dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Selling price</dt>
                <dd className="mt-1 font-medium text-slate-700">{formatCurrency(assignment.selling_price, assignment.currency)}</dd>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <AssignmentPriorityBadge priority={assignment.priority} />
                <WorkModeBadge workMode={assignment.work_mode} />
              </div>
            </dl>

            <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Link href={"/assignments/" + assignment.id} className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">
                <Eye aria-hidden="true" className="size-4" /> View
              </Link>
              <Link href={"/assignments/" + assignment.id + "/edit"} className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">
                <Pencil aria-hidden="true" className="size-4" /> Edit
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
