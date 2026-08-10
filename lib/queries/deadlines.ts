import { createClient } from "@/lib/supabase/server";
import type { AssignmentPriority, WorkMode } from "@/types/assignment";
import type { DeadlineFilters, DeadlineItem, DeadlinesData, DeadlineUrgency } from "@/types/deadline";
import {
  isActiveAssignmentStatus,
  normalizeAssignmentStatus,
  normalizeAssignmentWorkerStatus,
} from "@/lib/utils/status";

type AssignmentRow = {
  id: string;
  received_from_id: string | null;
  task_code: string;
  title: string;
  client_deadline: string | null;
  status: string;
  priority: AssignmentPriority;
  work_mode: WorkMode;
};
type WorkerRow = {
  id: string;
  assignment_id: string;
  worker_id: string;
  worker_deadline: string | null;
  status: string;
};
type ContactRow = { id: string; name: string };

const assignmentColumns = "id, received_from_id, task_code, title, client_deadline, status, priority, work_mode";
const workerColumns = "id, assignment_id, worker_id, worker_deadline, status";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function urgency(value: string, now: Date): DeadlineUrgency {
  const deadline = new Date(value);
  if (deadline.getTime() < now.getTime()) return "overdue";
  const today = startOfDay(now).getTime();
  const deadlineDay = startOfDay(deadline).getTime();
  const dayDifference = Math.round((deadlineDay - today) / (24 * 60 * 60 * 1000));
  if (dayDifference === 0) return "today";
  if (dayDifference === 1) return "tomorrow";
  if (dayDifference <= 3) return "three_days";
  return "later";
}

export async function getDeadlines(ownerId: string, filters: DeadlineFilters = {}): Promise<DeadlinesData> {
  const supabase = await createClient();
  const [assignmentResult, workerResult, contactResult] = await Promise.all([
    supabase.from("assignments").select(assignmentColumns).eq("owner_id", ownerId),
    supabase.from("assignment_workers").select(workerColumns).eq("owner_id", ownerId),
    supabase.from("contacts").select("id, name").eq("owner_id", ownerId),
  ]);
  const error = assignmentResult.error ?? workerResult.error ?? contactResult.error;
  if (error) {
    console.error("[deadlines query failed]", { errorCode: error.code, errorMessage: error.message });
    return { items: [], writers: [], error: "We could not load deadlines. Please refresh and try again." };
  }

  const assignments = (assignmentResult.data ?? []) as AssignmentRow[];
  const workers = (workerResult.data ?? []) as WorkerRow[];
  const contacts = (contactResult.data ?? []) as ContactRow[];
  const names = new Map(contacts.map((contact) => [contact.id, contact.name]));
  const assignmentsById = new Map(assignments.map((assignment) => [assignment.id, assignment]));
  const workersByAssignment = new Map<string, WorkerRow[]>();
  for (const worker of workers) {
    const current = workersByAssignment.get(worker.assignment_id) ?? [];
    current.push(worker);
    workersByAssignment.set(worker.assignment_id, current);
  }
  const writerIds = new Set(workers.map((worker) => worker.worker_id));
  const writerOptions = contacts.filter((contact) => writerIds.has(contact.id)).map((contact) => ({ id: contact.id, name: contact.name })).sort((a, b) => a.name.localeCompare(b.name));
  const now = new Date();
  const items: DeadlineItem[] = [];

  for (const assignment of assignments) {
    if (assignment.client_deadline && isActiveAssignmentStatus(assignment.status)) {
      const assignmentWorkers = workersByAssignment.get(assignment.id) ?? [];
      if (!filters.writerId || assignmentWorkers.some((worker) => worker.worker_id === filters.writerId)) {
        const writerNames = assignmentWorkers.map((worker) => names.get(worker.worker_id)).filter((name): name is string => Boolean(name));
        items.push({ id: `client-${assignment.id}`, kind: "client", assignment_id: assignment.id, task_code: assignment.task_code, title: assignment.title, client_name: assignment.received_from_id ? names.get(assignment.received_from_id) ?? null : null, deadline: assignment.client_deadline, urgency: urgency(assignment.client_deadline, now), assignment_status: normalizeAssignmentStatus(assignment.status), priority: assignment.priority, work_mode: assignment.work_mode, writer: writerNames.length ? { id: assignmentWorkers[0]?.worker_id ?? "", name: writerNames.length === 1 ? writerNames[0] : `${writerNames.length} writers` } : null, writer_status: null });
      }
    }
  }
  for (const worker of workers) {
    const assignment = assignmentsById.get(worker.assignment_id);
    if (!assignment || !worker.worker_deadline || !isActiveAssignmentStatus(assignment.status) || normalizeAssignmentWorkerStatus(worker.status) !== "assigned") continue;
    if (filters.writerId && worker.worker_id !== filters.writerId) continue;
    items.push({ id: `writer-${worker.id}`, kind: "writer", assignment_id: assignment.id, task_code: assignment.task_code, title: assignment.title, client_name: assignment.received_from_id ? names.get(assignment.received_from_id) ?? null : null, deadline: worker.worker_deadline, urgency: urgency(worker.worker_deadline, now), assignment_status: normalizeAssignmentStatus(assignment.status), priority: assignment.priority, work_mode: assignment.work_mode, writer: { id: worker.worker_id, name: names.get(worker.worker_id) ?? "Unavailable writer" }, writer_status: normalizeAssignmentWorkerStatus(worker.status) });
  }

  let filtered = items;
  if (filters.timing === "overdue") filtered = filtered.filter((item) => item.urgency === "overdue");
  if (filters.timing === "today") filtered = filtered.filter((item) => item.urgency === "today");
  if (filters.timing === "upcoming") filtered = filtered.filter((item) => item.urgency !== "overdue");
  if (filters.status) filtered = filtered.filter((item) => item.assignment_status === filters.status);
  if (filters.priority) filtered = filtered.filter((item) => item.priority === filters.priority);
  filtered.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  return { items: filtered, writers: writerOptions };
}
