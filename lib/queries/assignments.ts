import { createClient } from "@/lib/supabase/server";
import type {
  Assignment,
  AssignmentContact,
  DeadlineState,
  AssignmentPriority,
  AssignmentStatus,
  WorkMode,
} from "@/types/assignment";
import { normalizeAssignmentStatus } from "@/lib/utils/status";

type AssignmentRow = Omit<Assignment, "received_from" | "deadline_state" | "status"> & {
  status: string;
};
type NormalizedAssignmentRow = Omit<
  Assignment,
  "received_from" | "deadline_state"
>;

type AssignmentFilters = {
  search?: string;
  status?: string;
  priority?: string;
  receivedFrom?: string;
  workMode?: string;
  sort?: string;
};

export type AssignmentQueryResult<T> = {
  data: T;
  error?: string;
};

export type AssignmentDetailResult = {
  assignment: Assignment | null;
  error?: string;
};

const assignmentColumns =
  "id, owner_id, task_code, title, subject, assessment_name, received_from_id, received_date, client_deadline, number_of_copies, price_per_copy, selling_price, currency, status, priority, work_mode, delivered_at, completed_at, description, notes, created_at, updated_at";

const contactColumns = "id, name, company_name, is_active";

function normalizeRow(row: AssignmentRow): NormalizedAssignmentRow {
  return {
    ...row,
    number_of_copies: Number(row.number_of_copies),
    price_per_copy: Number(row.price_per_copy),
    selling_price: Number(row.selling_price),
    status: normalizeAssignmentStatus(row.status),
  };
}

function attachContacts(
  rows: AssignmentRow[],
  contacts: AssignmentContact[]
): Assignment[] {
  const contactsById = new Map(contacts.map((contact) => [contact.id, contact]));
  const now = Date.now();

  return rows.map((row) => {
    const normalized = normalizeRow(row);
    return {
    ...normalized,
    received_from: contactsById.get(normalized.received_from_id) ?? null,
    deadline_state: getDeadlineState(
      normalized.client_deadline,
      normalized.status,
      now
    ),
  };
  });
}

function getDeadlineState(
  deadline: string,
  status: AssignmentStatus,
  now: number
): DeadlineState {
  if (["delivered", "cancelled"].includes(status)) {
    return "closed";
  }

  const remaining = new Date(deadline).getTime() - now;
  if (remaining < 0) return "overdue";
  if (remaining <= 7 * 24 * 60 * 60 * 1000) return "upcoming";
  return "scheduled";
}

export async function getAssignmentContacts(
  ownerId: string
): Promise<AssignmentQueryResult<AssignmentContact[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select(contactColumns)
    .eq("owner_id", ownerId)
    .order("name", { ascending: true });

  if (error) {
    return {
      data: [],
      error: "We could not load contacts for this assignment.",
    };
  }

  return { data: (data ?? []) as AssignmentContact[] };
}

export async function getAssignments(
  ownerId: string,
  filters: AssignmentFilters = {}
): Promise<AssignmentQueryResult<Assignment[]>> {
  const supabase = await createClient();
  const [assignmentResult, contactResult] = await Promise.all([
    supabase
      .from("assignments")
      .select(assignmentColumns)
      .eq("owner_id", ownerId),
    supabase
      .from("contacts")
      .select(contactColumns)
      .eq("owner_id", ownerId),
  ]);

  if (assignmentResult.error || contactResult.error) {
    return {
      data: [],
      error: "We could not load your assignments. Please refresh and try again.",
    };
  }

  let assignments = attachContacts(
    (assignmentResult.data ?? []) as AssignmentRow[],
    (contactResult.data ?? []) as AssignmentContact[]
  );

  const search = filters.search?.trim().toLocaleLowerCase();
  if (search) {
    assignments = assignments.filter((assignment) =>
      [assignment.task_code, assignment.title, assignment.subject].some((value) =>
        value?.toLocaleLowerCase().includes(search)
      )
    );
  }

  if (filters.status) {
    assignments = assignments.filter(
      (assignment) => assignment.status === (filters.status as AssignmentStatus)
    );
  }
  if (filters.priority) {
    assignments = assignments.filter(
      (assignment) =>
        assignment.priority === (filters.priority as AssignmentPriority)
    );
  }
  if (filters.receivedFrom) {
    assignments = assignments.filter(
      (assignment) => assignment.received_from_id === filters.receivedFrom
    );
  }
  if (filters.workMode) {
    assignments = assignments.filter(
      (assignment) => assignment.work_mode === (filters.workMode as WorkMode)
    );
  }

  if (filters.sort === "deadline") {
    assignments.sort(
      (a, b) =>
        new Date(a.client_deadline).getTime() -
        new Date(b.client_deadline).getTime()
    );
  } else if (filters.sort === "selling_price") {
    assignments.sort((a, b) => b.selling_price - a.selling_price);
  } else {
    assignments.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  return { data: assignments };
}

export async function getAssignment(
  ownerId: string,
  assignmentId: string
): Promise<AssignmentDetailResult> {
  const supabase = await createClient();
  const { data: assignmentRow, error } = await supabase
    .from("assignments")
    .select(assignmentColumns)
    .eq("owner_id", ownerId)
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) {
    return {
      assignment: null,
      error: "We could not load this assignment. Please try again.",
    };
  }

  if (!assignmentRow) {
    return { assignment: null };
  }

  const contactResult = await supabase
    .from("contacts")
    .select(contactColumns)
    .eq("owner_id", ownerId)
    .eq("id", assignmentRow.received_from_id)
    .maybeSingle();

  if (contactResult.error) {
    return {
      assignment: null,
      error: "We could not load the assignment contact. Please try again.",
    };
  }

  const [assignment] = attachContacts(
    [assignmentRow as AssignmentRow],
    contactResult.data
      ? [contactResult.data as AssignmentContact]
      : []
  );

  return { assignment };
}
