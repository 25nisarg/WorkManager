import type { AssignmentStatus } from "@/types/assignment";
import type { AssignmentWorkerStatus } from "@/types/assignment-worker";

export function normalizeAssignmentStatus(status: string): AssignmentStatus {
  if (status === "delivered" || status === "completed") return "delivered";
  if (status === "cancelled") return "cancelled";
  return "new";
}

export function normalizeAssignmentWorkerStatus(
  status: string
): AssignmentWorkerStatus {
  if (status === "delivered" || status === "completed") return "delivered";
  if (status === "cancelled") return "cancelled";
  return "assigned";
}

export function isActiveAssignmentStatus(status: string) {
  return normalizeAssignmentStatus(status) === "new";
}

export function isCompletedWriterAllocation(
  allocationStatus: string,
  assignmentStatus: string | null | undefined
) {
  if (!assignmentStatus) return false;
  const allocation = normalizeAssignmentWorkerStatus(allocationStatus);
  const assignment = normalizeAssignmentStatus(assignmentStatus);
  return (
    allocation !== "cancelled" &&
    assignment !== "cancelled" &&
    (allocation === "delivered" || assignment === "delivered")
  );
}

export function isActiveWriterAllocation(
  allocationStatus: string,
  assignmentStatus: string | null | undefined
) {
  if (!assignmentStatus) return false;
  const allocation = normalizeAssignmentWorkerStatus(allocationStatus);
  return allocation === "assigned" && isActiveAssignmentStatus(assignmentStatus);
}
