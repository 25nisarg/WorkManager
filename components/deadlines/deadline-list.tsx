import Link from "next/link";
import { CalendarClock, UserRound } from "lucide-react";
import { AssignmentPriorityBadge, AssignmentStatusBadge, WorkModeBadge } from "@/components/assignments/assignment-badges";
import { AssignmentWorkerStatusBadge } from "@/components/assignments/assignment-worker-status-badge";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/format";
import type { DeadlineItem, DeadlineUrgency } from "@/types/deadline";

const urgencyStyles: Record<DeadlineUrgency, { label: string; className: string }> = {
  overdue: { label: "Overdue", className: "border-red-200 bg-red-50 text-red-700" },
  today: { label: "Due today", className: "border-amber-200 bg-amber-50 text-amber-700" },
  tomorrow: { label: "Due tomorrow", className: "border-orange-200 bg-orange-50 text-orange-700" },
  three_days: { label: "Within 3 days", className: "border-blue-200 bg-blue-50 text-blue-700" },
  later: { label: "Due later", className: "border-slate-200 bg-slate-50 text-slate-600" },
};

export function DeadlineList({ items }: { items: DeadlineItem[] }) {
  if (!items.length) return <Card className="flex min-h-56 flex-col items-center justify-center p-6 text-center"><CalendarClock aria-hidden="true" className="size-7 text-slate-400" /><h2 className="mt-3 font-semibold text-slate-900">No deadlines match these filters</h2><p className="mt-1 max-w-md text-sm text-slate-500">Completed, delivered, and cancelled work is excluded from active deadline tracking.</p></Card>;
  return <div className="grid gap-4 xl:grid-cols-2">{items.map((item) => { const urgency = urgencyStyles[item.urgency]; return <Card key={item.id} className={"overflow-hidden " + (item.urgency === "overdue" ? "border-red-200" : "")}><div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-semibold text-indigo-700">{item.task_code}</span><span className={"inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold " + urgency.className}>{urgency.label}</span><span className="text-xs font-medium text-slate-400">{item.kind === "client" ? "Client deadline" : "Writer deadline"}</span></div><Link href={"/assignments/" + item.assignment_id} className="mt-2 block truncate font-semibold text-slate-900 hover:text-indigo-700">{item.title}</Link><p className="mt-1 text-sm text-slate-500">{item.client_name ?? "No client/source"}</p></div><CalendarClock aria-hidden="true" className={"mt-1 size-5 shrink-0 " + (item.urgency === "overdue" ? "text-red-500" : "text-slate-400")} /></div><div className="space-y-4 p-5"><div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Deadline</p><p className="mt-1 text-sm font-semibold text-slate-800">{formatDateTime(item.deadline)}</p></div>{item.writer && <div className="flex items-center gap-2 text-sm text-slate-600"><UserRound aria-hidden="true" className="size-4 text-slate-400" /><span>{item.writer.name}</span>{item.writer_status && <AssignmentWorkerStatusBadge status={item.writer_status} />}</div>}<div className="flex flex-wrap gap-2"><AssignmentStatusBadge status={item.assignment_status} /><AssignmentPriorityBadge priority={item.priority} /><WorkModeBadge workMode={item.work_mode} /></div></div></Card>; })}</div>;
}
