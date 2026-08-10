import {
  ASSIGNMENT_PRIORITIES,
  ASSIGNMENT_STATUSES,
  WORK_MODES,
} from "@/lib/constants/assignments";
import type {
  AssignmentPriority,
  AssignmentStatus,
  WorkMode,
} from "@/types/assignment";

const statusStyles: Record<AssignmentStatus, string> = {
  new: "border-blue-200 bg-blue-50 text-blue-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-slate-200 bg-slate-50 text-slate-600",
};

const priorityStyles: Record<AssignmentPriority, string> = {
  low: "border-slate-200 bg-slate-50 text-slate-600",
  normal: "border-blue-200 bg-blue-50 text-blue-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  urgent: "border-red-200 bg-red-50 text-red-700",
};

const statusLabels = new Map(
  ASSIGNMENT_STATUSES.map((item) => [item.value, item.label])
);
const priorityLabels = new Map(
  ASSIGNMENT_PRIORITIES.map((item) => [item.value, item.label])
);
const workModeLabels = new Map(WORK_MODES.map((item) => [item.value, item.label]));

const badgeBase =
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium";

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  return (
    <span className={badgeBase + " " + statusStyles[status]}>
      {statusLabels.get(status) ?? status}
    </span>
  );
}

export function AssignmentPriorityBadge({
  priority,
}: {
  priority: AssignmentPriority;
}) {
  return (
    <span className={badgeBase + " " + priorityStyles[priority]}>
      {priorityLabels.get(priority) ?? priority}
    </span>
  );
}

export function WorkModeBadge({ workMode }: { workMode: WorkMode }) {
  return (
    <span className={badgeBase + " border-slate-200 bg-white text-slate-600"}>
      {workModeLabels.get(workMode) ?? workMode}
    </span>
  );
}
