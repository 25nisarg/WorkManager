import type { ASSIGNMENT_WORKER_STATUS_VALUES } from "@/lib/constants/assignment-workers";

export type AssignmentWorkerStatus =
  (typeof ASSIGNMENT_WORKER_STATUS_VALUES)[number];

export type EligibleWriter = {
  id: string;
  name: string;
  company_name: string | null;
  is_active: boolean;
  roles: Array<"writer" | "freelancer">;
};

export type AssignmentWorker = {
  id: string;
  owner_id: string;
  assignment_id: string;
  worker_id: string;
  work_description: string;
  assigned_date: string;
  worker_deadline: string;
  agreed_cost: number;
  currency: string;
  status: AssignmentWorkerStatus;
  delivered_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  worker: EligibleWriter | null;
};

export type AssignmentWorkerFormValues = Pick<
  AssignmentWorker,
  | "worker_id"
  | "work_description"
  | "assigned_date"
  | "worker_deadline"
  | "agreed_cost"
  | "currency"
  | "status"
  | "delivered_at"
  | "notes"
>;

export type AssignmentWorkerActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};
