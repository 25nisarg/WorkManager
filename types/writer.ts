import type { AssignmentStatus } from "@/types/assignment";
import type { AssignmentWorkerStatus } from "@/types/assignment-worker";
import type { ContactRole } from "@/types/contact";

export type WriterRole = Extract<ContactRole, "writer" | "freelancer">;

export type MoneyAmount = {
  currency: string;
  amount: number;
};

export type WriterMetrics = {
  active_assignments: number;
  total_assignments: number;
  completed_assignments: number;
  total_agreed_cost: MoneyAmount[];
  total_paid: MoneyAmount[];
  total_payable: MoneyAmount[];
  upcoming_deadline: string | null;
};

export type WriterListItem = WriterMetrics & {
  id: string;
  name: string;
  company_name: string | null;
  roles: ContactRole[];
  is_active: boolean;
};

export type WriterAssignment = {
  id: string;
  assignment_id: string;
  work_description: string | null;
  assigned_date: string;
  worker_deadline: string | null;
  agreed_cost: number;
  currency: string;
  status: AssignmentWorkerStatus;
  delivered_at: string | null;
  task_code: string | null;
  assignment_title: string | null;
  assignment_status: AssignmentStatus | null;
};

export type WriterPaymentHistory = {
  id: string;
  assignment_worker_id: string;
  payment_date: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  transaction_reference: string | null;
  account_name: string | null;
  assignment_id: string | null;
  task_code: string | null;
  assignment_title: string | null;
};

export type WriterDetail = WriterListItem & {
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  preferred_currency: string;
  active_allocations: WriterAssignment[];
  completed_allocations: WriterAssignment[];
  other_allocations: WriterAssignment[];
  payments: WriterPaymentHistory[];
};

export type WriterFilters = {
  search?: string;
  role?: WriterRole;
  status?: "active" | "inactive";
  workload?: "assigned" | "available";
};
