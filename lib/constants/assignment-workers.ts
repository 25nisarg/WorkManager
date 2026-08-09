export const ASSIGNMENT_WORKER_STATUSES = [
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "delivered", label: "Delivered" },
  { value: "revision", label: "Revision" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const ASSIGNMENT_WORKER_STATUS_VALUES =
  ASSIGNMENT_WORKER_STATUSES.map((status) => status.value);
