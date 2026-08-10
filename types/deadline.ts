import type { AssignmentPriority, AssignmentStatus, WorkMode } from "@/types/assignment";
import type { AssignmentWorkerStatus } from "@/types/assignment-worker";

export type DeadlineUrgency = "overdue" | "today" | "tomorrow" | "three_days" | "later";

export type DeadlineWriter = { id: string; name: string };

export type DeadlineItem = {
  id: string;
  kind: "client" | "writer";
  assignment_id: string;
  task_code: string;
  title: string;
  client_name: string | null;
  deadline: string;
  urgency: DeadlineUrgency;
  assignment_status: AssignmentStatus;
  priority: AssignmentPriority;
  work_mode: WorkMode;
  writer: DeadlineWriter | null;
  writer_status: AssignmentWorkerStatus | null;
};

export type DeadlineFilters = {
  timing?: "overdue" | "today" | "upcoming";
  status?: string;
  priority?: string;
  writerId?: string;
};

export type DeadlinesData = {
  items: DeadlineItem[];
  writers: DeadlineWriter[];
  error?: string;
};
