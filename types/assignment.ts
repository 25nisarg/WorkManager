import type {
  ASSIGNMENT_PRIORITY_VALUES,
  ASSIGNMENT_STATUS_VALUES,
  WORK_MODE_VALUES,
} from "@/lib/constants/assignments";

export type AssignmentStatus = (typeof ASSIGNMENT_STATUS_VALUES)[number];
export type AssignmentPriority = (typeof ASSIGNMENT_PRIORITY_VALUES)[number];
export type WorkMode = (typeof WORK_MODE_VALUES)[number];
export type DeadlineState = "overdue" | "upcoming" | "scheduled" | "closed";

export type AssignmentContact = {
  id: string;
  name: string;
  company_name: string | null;
  is_active: boolean;
};

export type Assignment = {
  id: string;
  owner_id: string;
  task_code: string;
  title: string;
  subject: string | null;
  assessment_name: string | null;
  received_from_id: string;
  received_date: string;
  client_deadline: string;
  number_of_copies: number;
  price_per_copy: number;
  selling_price: number;
  currency: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  work_mode: WorkMode;
  delivered_at: string | null;
  completed_at: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  received_from: AssignmentContact | null;
  deadline_state: DeadlineState;
};

export type AssignmentFormValues = Pick<
  Assignment,
  | "title"
  | "subject"
  | "assessment_name"
  | "received_from_id"
  | "received_date"
  | "client_deadline"
  | "number_of_copies"
  | "price_per_copy"
  | "selling_price"
  | "currency"
  | "status"
  | "priority"
  | "work_mode"
  | "description"
  | "notes"
>;

export type AssignmentActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};
