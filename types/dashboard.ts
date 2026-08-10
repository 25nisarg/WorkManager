import type { AssignmentPriority, AssignmentStatus, WorkMode } from "@/types/assignment";
import type { CurrencyAmount } from "@/types/financial";

export type DashboardSummary = {
  total_assignments: number;
  active_assignments: number;
  total_work_value: CurrencyAmount[];
  original_client_received: CurrencyAmount[];
  actual_inr_received: number;
  client_outstanding: CurrencyAmount[];
  worker_cost: CurrencyAmount[];
  worker_paid: CurrencyAmount[];
  worker_payable: CurrencyAmount[];
  expenses: CurrencyAmount[];
  actual_profit_inr: number | null;
  current_cash_position_inr: number | null;
  profit_unavailable_assignments: number;
  unmatched_client_payments: number;
  excluded_non_inr_cash_out: number;
};

export type DashboardAssignment = {
  id: string;
  received_from_id: string | null;
  task_code: string;
  title: string;
  client_deadline: string | null;
  selling_price: number;
  currency: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  work_mode: WorkMode;
  created_at: string;
  client_name: string | null;
};

export type DeadlineGroup = "overdue" | "today" | "three_days" | "later";
export type DashboardDeadline = DashboardAssignment & { deadline_group: DeadlineGroup };

export type ClientOutstandingItem = {
  assignment_id: string;
  task_code: string;
  title: string;
  client_name: string | null;
  client_deadline: string | null;
  currency: string;
  selling_price: number;
  client_received: number;
  client_outstanding: number;
  unmatched_payment_count: number;
};

export type WriterPayableItem = {
  key: string;
  assignment_id: string;
  task_code: string;
  title: string;
  writer_names: string[];
  writer_count: number;
  currency: string;
  worker_cost: number;
  worker_paid: number;
  worker_payable: number;
};

export type MonthlyCashPoint = { key: string; label: string; received: number; worker_paid: number; expenses: number; cash_flow: number | null; has_unconverted_cash_out: boolean };
export type DashboardData = {
  summary: DashboardSummary | null;
  recentAssignments: DashboardAssignment[];
  deadlines: DashboardDeadline[];
  outstandingClients: ClientOutstandingItem[];
  writerPayables: WriterPayableItem[];
  monthlyCash: MonthlyCashPoint[];
  excludedNonInrCashOut: number;
  errors: { summary?: string; assignments?: string; balances?: string; charts?: string };
};
