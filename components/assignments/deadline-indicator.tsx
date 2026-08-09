import { AlertTriangle, CalendarClock } from "lucide-react";
import { formatDateTime } from "@/lib/utils/format";
import type { DeadlineState } from "@/types/assignment";

export function DeadlineIndicator({
  deadline,
  state,
  compact = false,
}: {
  deadline: string;
  state: DeadlineState;
  compact?: boolean;
}) {
  const overdue = state === "overdue";
  const upcoming = state === "upcoming";

  return (
    <div>
      <p className={"flex items-center gap-1.5 text-sm " + (overdue ? "font-medium text-red-700" : upcoming ? "font-medium text-amber-700" : "text-slate-600")}>
        {overdue ? (
          <AlertTriangle aria-hidden="true" className="size-3.5 shrink-0" />
        ) : (
          <CalendarClock aria-hidden="true" className="size-3.5 shrink-0" />
        )}
        {formatDateTime(deadline)}
      </p>
      {!compact && (overdue || upcoming) && (
        <p className={"mt-1 text-xs " + (overdue ? "text-red-600" : "text-amber-600")}>
          {overdue ? "Overdue" : "Due within 7 days"}
        </p>
      )}
    </div>
  );
}
