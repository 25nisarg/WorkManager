import { createClient } from "@/lib/supabase/server";
import type { AssignmentStatus } from "@/types/assignment";
import type { AssignmentWorkerStatus } from "@/types/assignment-worker";
import type { ContactRole } from "@/types/contact";
import type {
  MoneyAmount,
  WriterAssignment,
  WriterDetail,
  WriterFilters,
  WriterListItem,
  WriterMetrics,
  WriterPaymentHistory,
} from "@/types/writer";

type ContactRow = {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  preferred_currency: string;
  is_active: boolean;
};
type RoleRow = { contact_id: string; role: ContactRole };
type AllocationRow = {
  id: string;
  assignment_id: string;
  worker_id: string;
  work_description: string | null;
  assigned_date: string;
  worker_deadline: string | null;
  agreed_cost: number | string;
  currency: string;
  status: AssignmentWorkerStatus;
  delivered_at: string | null;
  updated_at: string;
};
type PaymentRow = {
  id: string;
  assignment_worker_id: string;
  worker_id: string;
  payment_date: string;
  amount: number | string;
  currency: string;
  payment_method: string | null;
  transaction_reference: string | null;
  payment_account_id: string | null;
};
type AssignmentRow = {
  id: string;
  task_code: string;
  title: string;
  status: AssignmentStatus;
};
type AccountRow = { id: string; account_name: string };

const contactColumns =
  "id, name, company_name, email, phone, whatsapp, preferred_currency, is_active";
const allocationColumns =
  "id, assignment_id, worker_id, work_description, assigned_date, worker_deadline, agreed_cost, currency, status, delivered_at, updated_at";
const paymentColumns =
  "id, assignment_worker_id, worker_id, payment_date, amount, currency, payment_method, transaction_reference, payment_account_id";
const activeStatuses = new Set<AssignmentWorkerStatus>([
  "assigned",
  "in_progress",
  "revision",
]);
const completedStatuses = new Set<AssignmentWorkerStatus>([
  "delivered",
  "completed",
]);

function numberValue(value: number | string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function addAmount(map: Map<string, number>, currency: string, amount: number) {
  map.set(currency, (map.get(currency) ?? 0) + amount);
}

function moneyAmounts(map: Map<string, number>): MoneyAmount[] {
  return [...map.entries()]
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

function rolesByContact(rows: RoleRow[]) {
  const result = new Map<string, ContactRole[]>();
  for (const row of rows) {
    const roles = result.get(row.contact_id) ?? [];
    if (!roles.includes(row.role)) roles.push(row.role);
    result.set(row.contact_id, roles);
  }
  return result;
}

function metricsForWriter(
  writerId: string,
  allocations: AllocationRow[],
  payments: PaymentRow[]
): WriterMetrics {
  const writerAllocations = allocations.filter((row) => row.worker_id === writerId);
  const writerPayments = payments.filter((row) => row.worker_id === writerId);
  const agreed = new Map<string, number>();
  const paid = new Map<string, number>();

  for (const row of writerAllocations) {
    if (row.status !== "cancelled") {
      addAmount(agreed, row.currency, numberValue(row.agreed_cost));
    }
  }
  for (const row of writerPayments) {
    addAmount(paid, row.currency, numberValue(row.amount));
  }
  const payable = new Map<string, number>();
  for (const currency of new Set([...agreed.keys(), ...paid.keys()])) {
    payable.set(currency, (agreed.get(currency) ?? 0) - (paid.get(currency) ?? 0));
  }

  const openDeadlines = writerAllocations
    .filter((row) => activeStatuses.has(row.status) && row.worker_deadline)
    .map((row) => row.worker_deadline as string)
    .sort();

  return {
    active_assignments: writerAllocations.filter((row) => activeStatuses.has(row.status)).length,
    total_assignments: writerAllocations.length,
    completed_assignments: writerAllocations.filter((row) => completedStatuses.has(row.status)).length,
    total_agreed_cost: moneyAmounts(agreed),
    total_paid: moneyAmounts(paid),
    total_payable: moneyAmounts(payable),
    upcoming_deadline: openDeadlines[0] ?? null,
  };
}

function databaseError(context: string, error: { code?: string; message: string }) {
  console.error(`[${context} query failed]`, {
    errorCode: error.code,
    errorMessage: error.message,
  });
}

export async function getWriters(ownerId: string, filters: WriterFilters = {}) {
  const supabase = await createClient();
  const [contactsResult, rolesResult, allocationsResult, paymentsResult] = await Promise.all([
    supabase.from("contacts").select(contactColumns).eq("owner_id", ownerId).order("name"),
    supabase.from("contact_roles").select("contact_id, role").eq("owner_id", ownerId),
    supabase.from("assignment_workers").select(allocationColumns).eq("owner_id", ownerId),
    supabase.from("worker_payments").select(paymentColumns).eq("owner_id", ownerId),
  ]);
  const failed = [contactsResult, rolesResult, allocationsResult, paymentsResult].find((result) => result.error);
  if (failed?.error) {
    databaseError("writers", failed.error);
    return { data: [] as WriterListItem[], error: "We could not load writers. Please refresh and try again." };
  }

  const contacts = (contactsResult.data ?? []) as ContactRow[];
  const roles = rolesByContact((rolesResult.data ?? []) as RoleRow[]);
  const allocations = (allocationsResult.data ?? []) as AllocationRow[];
  const payments = (paymentsResult.data ?? []) as PaymentRow[];
  let writers = contacts
    .filter((contact) => {
      const contactRoles = roles.get(contact.id) ?? [];
      return contactRoles.includes("writer") || contactRoles.includes("freelancer");
    })
    .map<WriterListItem>((contact) => ({
      id: contact.id,
      name: contact.name,
      company_name: contact.company_name,
      roles: roles.get(contact.id) ?? [],
      is_active: contact.is_active,
      ...metricsForWriter(contact.id, allocations, payments),
    }));

  const search = filters.search?.toLocaleLowerCase();
  if (search) writers = writers.filter((writer) => [writer.name, writer.company_name].some((value) => value?.toLocaleLowerCase().includes(search)));
  if (filters.role) writers = writers.filter((writer) => writer.roles.includes(filters.role!));
  if (filters.status) writers = writers.filter((writer) => writer.is_active === (filters.status === "active"));
  if (filters.workload) writers = writers.filter((writer) => filters.workload === "assigned" ? writer.active_assignments > 0 : writer.active_assignments === 0);

  return { data: writers };
}

export async function getWriterDetail(ownerId: string, writerId: string): Promise<{ data: WriterDetail | null; error?: string }> {
  const supabase = await createClient();
  const [contactResult, rolesResult, allocationsResult, paymentsResult, assignmentsResult, accountsResult] = await Promise.all([
    supabase.from("contacts").select(contactColumns).eq("owner_id", ownerId).eq("id", writerId).maybeSingle(),
    supabase.from("contact_roles").select("contact_id, role").eq("owner_id", ownerId).eq("contact_id", writerId),
    supabase.from("assignment_workers").select(allocationColumns).eq("owner_id", ownerId).eq("worker_id", writerId),
    supabase.from("worker_payments").select(paymentColumns).eq("owner_id", ownerId).eq("worker_id", writerId),
    supabase.from("assignments").select("id, task_code, title, status").eq("owner_id", ownerId),
    supabase.from("payment_accounts").select("id, account_name").eq("owner_id", ownerId),
  ]);
  const failed = [contactResult, rolesResult, allocationsResult, paymentsResult, assignmentsResult, accountsResult].find((result) => result.error);
  if (failed?.error) {
    databaseError("writer detail", failed.error);
    return { data: null, error: "We could not load this writer. Please refresh and try again." };
  }
  if (!contactResult.data) return { data: null };

  const contact = contactResult.data as ContactRow;
  const roleRows = (rolesResult.data ?? []) as RoleRow[];
  const roles = roleRows.map((row) => row.role);
  if (!roles.includes("writer") && !roles.includes("freelancer")) return { data: null };

  const allocations = (allocationsResult.data ?? []) as AllocationRow[];
  const payments = (paymentsResult.data ?? []) as PaymentRow[];
  const assignments = new Map(((assignmentsResult.data ?? []) as AssignmentRow[]).map((row) => [row.id, row]));
  const accounts = new Map(((accountsResult.data ?? []) as AccountRow[]).map((row) => [row.id, row.account_name]));
  const allocationDetails: WriterAssignment[] = allocations.map((row) => {
    const assignment = assignments.get(row.assignment_id);
    return {
      id: row.id,
      assignment_id: row.assignment_id,
      work_description: row.work_description,
      assigned_date: row.assigned_date,
      worker_deadline: row.worker_deadline,
      agreed_cost: numberValue(row.agreed_cost),
      currency: row.currency,
      status: row.status,
      delivered_at: row.delivered_at,
      task_code: assignment?.task_code ?? null,
      assignment_title: assignment?.title ?? null,
      assignment_status: assignment?.status ?? null,
    };
  });
  const allocationById = new Map(allocationDetails.map((row) => [row.id, row]));
  const paymentHistory: WriterPaymentHistory[] = payments.map((row) => {
    const allocation = allocationById.get(row.assignment_worker_id);
    return {
      id: row.id,
      assignment_worker_id: row.assignment_worker_id,
      payment_date: row.payment_date,
      amount: numberValue(row.amount),
      currency: row.currency,
      payment_method: row.payment_method,
      transaction_reference: row.transaction_reference,
      account_name: row.payment_account_id ? accounts.get(row.payment_account_id) ?? null : null,
      assignment_id: allocation?.assignment_id ?? null,
      task_code: allocation?.task_code ?? null,
      assignment_title: allocation?.assignment_title ?? null,
    };
  }).sort((a, b) => b.payment_date.localeCompare(a.payment_date));

  const byDeadline = (a: WriterAssignment, b: WriterAssignment) => (a.worker_deadline ?? "9999").localeCompare(b.worker_deadline ?? "9999");
  return {
    data: {
      id: contact.id,
      name: contact.name,
      company_name: contact.company_name,
      email: contact.email,
      phone: contact.phone,
      whatsapp: contact.whatsapp,
      preferred_currency: contact.preferred_currency,
      roles,
      is_active: contact.is_active,
      ...metricsForWriter(writerId, allocations, payments),
      active_allocations: allocationDetails.filter((row) => activeStatuses.has(row.status)).sort(byDeadline),
      completed_allocations: allocationDetails.filter((row) => completedStatuses.has(row.status)).sort((a, b) => (b.delivered_at ?? b.assigned_date).localeCompare(a.delivered_at ?? a.assigned_date)),
      other_allocations: allocationDetails.filter((row) => row.status === "cancelled"),
      payments: paymentHistory,
    },
  };
}
