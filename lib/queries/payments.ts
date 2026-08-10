import { createClient } from "@/lib/supabase/server";
import type {
  ClientPayment,
  ClientPaymentAllocation,
  PaymentAccount,
  PaymentAllocation,
  PaymentAssignment,
  PaymentContact,
  WorkerPayment,
} from "@/types/payment";

type ClientPaymentRow = Omit<
  ClientPayment,
  "allocations" | "payer" | "account"
>;
type ClientAllocationRow = Omit<ClientPaymentAllocation, "assignment">;
type WorkerPaymentRow = Omit<
  WorkerPayment,
  "allocation" | "writer" | "account"
>;
type AllocationRow = Omit<PaymentAllocation, "assignment" | "writer">;
type ContactRoleRow = { contact_id: string; role: string };

export type PaymentFilters = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  contactId?: string;
  assignmentId?: string;
  method?: string;
};

export type PaymentsData = {
  clientPayments: ClientPayment[];
  workerPayments: WorkerPayment[];
  assignments: PaymentAssignment[];
  contacts: PaymentContact[];
  eligiblePayers: PaymentContact[];
  allocations: PaymentAllocation[];
  accounts: PaymentAccount[];
  error?: string;
};

const clientPaymentColumns =
  "id, owner_id, payer_id, payment_date, amount_original, currency_original, exchange_rate, amount_inr, payment_method, transaction_reference, notes, created_at, payment_account_id";
const clientAllocationColumns = "id, owner_id, client_payment_id, assignment_id, amount_original, amount_inr, created_at";
const workerPaymentColumns =
  "id, owner_id, assignment_worker_id, worker_id, payment_date, amount, currency, payment_method, transaction_reference, notes, created_at, payment_account_id";
const assignmentColumns = "id, task_code, title, received_from_id, currency, selling_price";
const contactColumns = "id, name, company_name";
const allocationColumns =
  "id, assignment_id, worker_id, work_description, currency";

function paymentAccountFromRow(row: Record<string, unknown>): PaymentAccount {
  const label =
    row.name ??
    row.account_name ??
    row.display_name ??
    row.bank_name ??
    row.account_type;

  return {
    id: String(row.id),
    name:
      typeof label === "string" && label.trim()
        ? label
        : "Payment account",
    is_active: row.is_active !== false,
  };
}

export async function getPaymentsData(
  ownerId: string,
  filters: PaymentFilters = {}
): Promise<PaymentsData> {
  const supabase = await createClient();
  const [
    clientResult,
    clientAllocationResult,
    workerResult,
    assignmentResult,
    contactResult,
    roleResult,
    allocationResult,
    accountResult,
  ] = await Promise.all([
    supabase
      .from("client_payments")
      .select(clientPaymentColumns)
      .eq("owner_id", ownerId),
    supabase.from("client_payment_allocations").select(clientAllocationColumns).eq("owner_id", ownerId),
    supabase
      .from("worker_payments")
      .select(workerPaymentColumns)
      .eq("owner_id", ownerId),
    supabase
      .from("assignments")
      .select(assignmentColumns)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false }),
    supabase
      .from("contacts")
      .select(contactColumns)
      .eq("owner_id", ownerId)
      .order("name", { ascending: true }),
    supabase
      .from("contact_roles")
      .select("contact_id, role")
      .eq("owner_id", ownerId)
      .in("role", ["student", "vendor", "freelancer"]),
    supabase
      .from("assignment_workers")
      .select(allocationColumns)
      .eq("owner_id", ownerId),
    supabase
      .from("payment_accounts")
      .select("id, account_name, is_active")
      .eq("owner_id", ownerId),
  ]);

  const results = [
    clientResult,
    clientAllocationResult,
    workerResult,
    assignmentResult,
    contactResult,
    roleResult,
    allocationResult,
    accountResult,
  ];
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    console.error("[payments query failed]", {
      errorCode: failed.error.code,
      errorMessage: failed.error.message,
    });
    return {
      clientPayments: [],
      workerPayments: [],
      assignments: [],
      contacts: [],
      eligiblePayers: [],
      allocations: [],
      accounts: [],
      error: "We could not load payments. Please refresh and try again.",
    };
  }

  const rawAssignments = (assignmentResult.data ?? []) as Array<Omit<PaymentAssignment, "selling_price" | "outstanding_original"> & { selling_price: number | string }>;
  const paymentCurrencies = new Map(((clientResult.data ?? []) as ClientPaymentRow[]).map((payment) => [payment.id, payment.currency_original]));
  const assignmentCurrencies = new Map(rawAssignments.map((assignment) => [assignment.id, assignment.currency]));
  const allocatedByAssignment = new Map<string, number>();
  for (const row of (clientAllocationResult.data ?? []) as ClientAllocationRow[]) {
    if (paymentCurrencies.get(row.client_payment_id) !== assignmentCurrencies.get(row.assignment_id)) continue;
    allocatedByAssignment.set(row.assignment_id, (allocatedByAssignment.get(row.assignment_id) ?? 0) + Number(row.amount_original));
  }
  const assignments: PaymentAssignment[] = rawAssignments.map((assignment) => ({ ...assignment, selling_price: Number(assignment.selling_price), outstanding_original: Math.max(Number(assignment.selling_price) - (allocatedByAssignment.get(assignment.id) ?? 0), 0) }));
  const contacts = (contactResult.data ?? []) as PaymentContact[];
  const roles = (roleResult.data ?? []) as ContactRoleRow[];
  const eligiblePayerIds = new Set(roles.map((role) => role.contact_id));
  const eligiblePayers = contacts.filter((contact) =>
    eligiblePayerIds.has(contact.id)
  );
  const accounts = ((accountResult.data ?? []) as Record<string, unknown>[])
    .map(paymentAccountFromRow)
    .sort((a, b) => a.name.localeCompare(b.name));
  const assignmentsById = new Map(
    assignments.map((assignment) => [assignment.id, assignment])
  );
  const contactsById = new Map(
    contacts.map((contact) => [contact.id, contact])
  );
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const allocations: PaymentAllocation[] = (
    (allocationResult.data ?? []) as AllocationRow[]
  ).map((allocation) => ({
    ...allocation,
    assignment: assignmentsById.get(allocation.assignment_id) ?? null,
    writer: contactsById.get(allocation.worker_id) ?? null,
  }));
  const allocationsById = new Map(
    allocations.map((allocation) => [allocation.id, allocation])
  );
  const clientAllocationsByPayment = new Map<string, ClientPaymentAllocation[]>();
  for (const row of (clientAllocationResult.data ?? []) as ClientAllocationRow[]) {
    const rows = clientAllocationsByPayment.get(row.client_payment_id) ?? [];
    rows.push({ ...row, amount_original: Number(row.amount_original), amount_inr: Number(row.amount_inr), assignment: assignmentsById.get(row.assignment_id) ?? null });
    clientAllocationsByPayment.set(row.client_payment_id, rows);
  }

  let clientPayments: ClientPayment[] = (
    (clientResult.data ?? []) as ClientPaymentRow[]
  ).map((payment) => ({
    ...payment,
    amount_original: Number(payment.amount_original),
    exchange_rate:
      payment.exchange_rate === null ? null : Number(payment.exchange_rate),
    amount_inr: Number(payment.amount_inr),
    allocations: clientAllocationsByPayment.get(payment.id) ?? [],
    payer: contactsById.get(payment.payer_id) ?? null,
    account: payment.payment_account_id
      ? accountsById.get(payment.payment_account_id) ?? null
      : null,
  }));
  let workerPayments: WorkerPayment[] = (
    (workerResult.data ?? []) as WorkerPaymentRow[]
  ).map((payment) => ({
    ...payment,
    amount: Number(payment.amount),
    allocation: allocationsById.get(payment.assignment_worker_id) ?? null,
    writer: contactsById.get(payment.worker_id) ?? null,
    account: payment.payment_account_id
      ? accountsById.get(payment.payment_account_id) ?? null
      : null,
  }));

  const search = filters.search?.trim().toLocaleLowerCase();
  if (search) {
    clientPayments = clientPayments.filter((payment) =>
      [
        ...payment.allocations.flatMap((allocation) => [allocation.assignment?.task_code, allocation.assignment?.title]),
        payment.payer?.name,
        payment.transaction_reference,
      ].some((value) => value?.toLocaleLowerCase().includes(search))
    );
    workerPayments = workerPayments.filter((payment) =>
      [
        payment.allocation?.assignment?.task_code,
        payment.allocation?.assignment?.title,
        payment.writer?.name,
        payment.transaction_reference,
      ].some((value) => value?.toLocaleLowerCase().includes(search))
    );
  }

  if (filters.dateFrom) {
    clientPayments = clientPayments.filter(
      (payment) => payment.payment_date >= filters.dateFrom!
    );
    workerPayments = workerPayments.filter(
      (payment) => payment.payment_date >= filters.dateFrom!
    );
  }
  if (filters.dateTo) {
    clientPayments = clientPayments.filter(
      (payment) => payment.payment_date <= filters.dateTo!
    );
    workerPayments = workerPayments.filter(
      (payment) => payment.payment_date <= filters.dateTo!
    );
  }
  if (filters.contactId) {
    clientPayments = clientPayments.filter(
      (payment) => payment.payer_id === filters.contactId
    );
    workerPayments = workerPayments.filter(
      (payment) => payment.worker_id === filters.contactId
    );
  }
  if (filters.assignmentId) {
    clientPayments = clientPayments.filter(
      (payment) => payment.allocations.some((allocation) => allocation.assignment_id === filters.assignmentId)
    );
    workerPayments = workerPayments.filter(
      (payment) =>
        payment.allocation?.assignment_id === filters.assignmentId
    );
  }
  if (filters.method) {
    clientPayments = clientPayments.filter(
      (payment) => payment.payment_method === filters.method
    );
    workerPayments = workerPayments.filter(
      (payment) => payment.payment_method === filters.method
    );
  }

  clientPayments.sort((a, b) =>
    b.payment_date.localeCompare(a.payment_date)
  );
  workerPayments.sort((a, b) =>
    b.payment_date.localeCompare(a.payment_date)
  );

  return {
    clientPayments,
    workerPayments,
    assignments,
    contacts,
    eligiblePayers,
    allocations,
    accounts,
  };
}
