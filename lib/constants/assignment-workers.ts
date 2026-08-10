export const ASSIGNMENT_WORKER_STATUSES = [
  { value: "assigned", label: "Assigned" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const ASSIGNMENT_WORKER_STATUS_VALUES =
  ASSIGNMENT_WORKER_STATUSES.map((status) => status.value);
