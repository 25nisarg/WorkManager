import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/format";
import type { DashboardDeadline, DeadlineGroup } from "@/types/dashboard";

const groupStyles: Record<DeadlineGroup, { label: string; className: string }> = {
  overdue: { label: "Overdue", className: "bg-red-50 text-red-700" },
  today: { label: "Due today", className: "bg-amber-50 text-amber-700" },
  three_days: { label: "Within 3 days", className: "bg-blue-50 text-blue-700" },
  later: { label: "Due later", className: "bg-slate-100 text-slate-600" },
};

export function UpcomingDeadlines({ deadlines, error }: { deadlines: DashboardDeadline[]; error?: string }) {
  return <Card className="overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Upcoming deadlines</h2><p className="mt-1 text-sm text-slate-500">Open work ordered by urgency.</p></div>{error ? <p className="p-5 text-sm text-red-700">{error}</p> : deadlines.length === 0 ? <div className="flex min-h-52 flex-col items-center justify-center p-6 text-center"><CalendarClock aria-hidden="true" className="size-6 text-slate-400" /><h3 className="mt-3 font-semibold text-slate-900">No active deadlines</h3><p className="mt-1 text-sm text-slate-500">Completed, delivered, and cancelled assignments are excluded.</p></div> : <div className="divide-y divide-slate-100">{deadlines.map((deadline) => { const group = groupStyles[deadline.deadline_group]; return <Link key={deadline.id} href={"/assignments/" + deadline.id} className="flex items-start justify-between gap-3 px-5 py-3.5 hover:bg-slate-50"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{deadline.title}</p><p className="mt-1 font-mono text-xs text-slate-500">{deadline.task_code} · {deadline.client_deadline ? formatDateTime(deadline.client_deadline) : "No deadline"}</p></div><span className={"inline-flex shrink-0 rounded-md px-2 py-1 text-xs font-semibold " + group.className}>{group.label}</span></Link>; })}</div>}</Card>;
}
