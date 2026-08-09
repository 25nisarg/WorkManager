export const ASSIGNMENT_STATUSES = [
  { value: "new", label: "New" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "writer_delivered", label: "Writer Delivered" },
  { value: "under_review", label: "Under Review" },
  { value: "ready_to_deliver", label: "Ready to Deliver" },
  { value: "delivered", label: "Delivered" },
  { value: "revision", label: "Revision" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const ASSIGNMENT_STATUS_VALUES = ASSIGNMENT_STATUSES.map(
  (status) => status.value
);

export const ASSIGNMENT_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

export const ASSIGNMENT_PRIORITY_VALUES = ASSIGNMENT_PRIORITIES.map(
  (priority) => priority.value
);

export const WORK_MODES = [
  { value: "self", label: "Self" },
  { value: "outsourced", label: "Outsourced" },
  { value: "mixed", label: "Mixed" },
] as const;

export const WORK_MODE_VALUES = WORK_MODES.map((mode) => mode.value);

export const ASSIGNMENT_SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "deadline", label: "Deadline soonest" },
  { value: "selling_price", label: "Highest value" },
] as const;

export const PRICING_TYPES = [
  { value: "total", label: "Total Price" },
  { value: "per_copy", label: "Per Copy" },
] as const;
