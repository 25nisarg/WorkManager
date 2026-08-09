import { ASSIGNMENT_WORKER_STATUSES } from "@/lib/constants/assignment-workers";
import type { AssignmentWorkerStatus } from "@/types/assignment-worker";

const styles: Record<AssignmentWorkerStatus, string> = {
  assigned: "border-blue-200 bg-blue-50 text-blue-700",
  in_progress: "border-indigo-200 bg-indigo-50 text-indigo-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  revision: "border-amber-200 bg-amber-50 text-amber-700",
  completed: "border-green-200 bg-green-50 text-green-700",
  cancelled: "border-slate-200 bg-slate-50 text-slate-600",
};

const labels = new Map(
  ASSIGNMENT_WORKER_STATUSES.map((status) => [status.value, status.label])
);

export function AssignmentWorkerStatusBadge({
  status,
}: {
  status: AssignmentWorkerStatus;
}) {
  return (
    <span className={"inline-flex rounded-md border px-2 py-0.5 text-xs font-medium " + styles[status]}>
      {labels.get(status) ?? status}
    </span>
  );
}
