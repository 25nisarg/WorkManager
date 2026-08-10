import { createClient } from "@/lib/supabase/server";
import { addCurrencyAmount, currencyAmounts, groupCurrencyAmounts, numberValue, subtractCurrencyAmounts } from "@/lib/utils/currency";
import { calculateAssignmentInrFinancials } from "@/lib/utils/financial-model";
import type { AssignmentPriority, AssignmentStatus } from "@/types/assignment";
import type { ClientOutstandingItem, DashboardAssignment, DashboardData, DashboardDeadline, DashboardSummary, DeadlineGroup, MonthlyCashPoint, WriterPayableItem } from "@/types/dashboard";

type AssignmentRow = Omit<DashboardAssignment, "client_name" | "selling_price"> & { selling_price: number | string };
type ContactRow = { id: string; name: string };
type WorkerRow = { id: string; assignment_id: string; worker_id: string; agreed_cost: number | string; currency: string; status: string };
type ClientPaymentRow = { id: string; payment_date: string; amount_original: number | string; currency_original: string; amount_inr: number | string };
type ClientAllocationRow = { client_payment_id: string; assignment_id: string; amount_original: number | string; amount_inr: number | string };
type WorkerPaymentRow = { assignment_worker_id: string; payment_date: string; amount: number | string; currency: string };
type ExpenseRow = { assignment_id: string | null; expense_date: string; amount: number | string; currency: string };

const assignmentColumns = "id, received_from_id, task_code, title, client_deadline, selling_price, currency, status, priority, work_mode, created_at";

function monthRange(count: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - count + 1, 1);
  const months: MonthlyCashPoint[] = [];
  for (let offset = 0; offset < count; offset += 1) {
    const date = new Date(start.getFullYear(), start.getMonth() + offset, 1);
    months.push({ key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`, label: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date), received: 0, worker_paid: 0, expenses: 0, cash_flow: 0, has_unconverted_cash_out: false });
  }
  return months;
}

function deadlineGroup(value: string, now: Date): DeadlineGroup {
  const deadline = new Date(value);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineDay = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  if (deadline < now) return "overdue";
  if (deadlineDay.getTime() === today.getTime()) return "today";
  return deadline.getTime() <= now.getTime() + 3 * 86400000 ? "three_days" : "later";
}

function logError(source: string, error: { code?: string; message?: string }) {
  console.error("[dashboard query failed]", { source, errorCode: error.code, errorMessage: error.message });
}

export async function getDashboardData(ownerId: string): Promise<DashboardData> {
  const supabase = await createClient();
  const [assignmentResult, contactResult, workerResult, clientPaymentResult, clientAllocationResult, workerPaymentResult, expenseResult] = await Promise.all([
    supabase.from("assignments").select(assignmentColumns).eq("owner_id", ownerId).order("created_at", { ascending: false }),
    supabase.from("contacts").select("id, name").eq("owner_id", ownerId),
    supabase.from("assignment_workers").select("id, assignment_id, worker_id, agreed_cost, currency, status").eq("owner_id", ownerId),
    supabase.from("client_payments").select("id, payment_date, amount_original, currency_original, amount_inr").eq("owner_id", ownerId),
    supabase.from("client_payment_allocations").select("client_payment_id, assignment_id, amount_original, amount_inr").eq("owner_id", ownerId),
    supabase.from("worker_payments").select("assignment_worker_id, payment_date, amount, currency").eq("owner_id", ownerId),
    supabase.from("expenses").select("assignment_id, expense_date, amount, currency").eq("owner_id", ownerId),
  ]);
  const errors: DashboardData["errors"] = {};
  const failed = [assignmentResult, contactResult, workerResult, clientPaymentResult, clientAllocationResult, workerPaymentResult, expenseResult].find((result) => result.error);
  if (failed?.error) {
    logError("currency_aware_data", failed.error);
    errors.summary = "Dashboard totals are temporarily unavailable.";
    errors.assignments = "Assignment activity is temporarily unavailable.";
    errors.balances = "Outstanding balances are temporarily unavailable.";
    errors.charts = "Monthly cash trends are temporarily unavailable.";
  }

  const contacts = new Map(((contactResult.data ?? []) as ContactRow[]).map((row) => [row.id, row.name]));
  const assignments: DashboardAssignment[] = ((assignmentResult.data ?? []) as AssignmentRow[]).map((row) => ({ ...row, selling_price: numberValue(row.selling_price), status: row.status as AssignmentStatus, priority: row.priority as AssignmentPriority, client_name: row.received_from_id ? contacts.get(row.received_from_id) ?? null : null }));
  const assignmentsById = new Map(assignments.map((row) => [row.id, row]));
  const workers = (workerResult.data ?? []) as WorkerRow[];
  const clientPayments = (clientPaymentResult.data ?? []) as ClientPaymentRow[];
  const clientAllocations = (clientAllocationResult.data ?? []) as ClientAllocationRow[];
  const clientPaymentsById = new Map(clientPayments.map((row) => [row.id, row]));
  const workerPayments = (workerPaymentResult.data ?? []) as WorkerPaymentRow[];
  const expenses = (expenseResult.data ?? []) as ExpenseRow[];
  const activeStatuses = new Set(["new", "assigned", "in_progress", "writer_delivered", "under_review", "ready_to_deliver", "revision"]);
  const activeWorkers = workers.filter((row) => row.status !== "cancelled");

  const receivedByAssignment = new Map<string, number>();
  const unmatchedByAssignment = new Map<string, number>();
  for (const allocation of clientAllocations) {
    const payment = clientPaymentsById.get(allocation.client_payment_id);
    const assignment = assignmentsById.get(allocation.assignment_id);
    if (!payment) continue;
    if (!assignment) continue;
    if (payment.currency_original === assignment.currency) receivedByAssignment.set(assignment.id, (receivedByAssignment.get(assignment.id) ?? 0) + numberValue(allocation.amount_original));
    else unmatchedByAssignment.set(assignment.id, (unmatchedByAssignment.get(assignment.id) ?? 0) + 1);
  }

  const outstandingMap = new Map<string, number>();
  let unmatchedClientPayments = 0;
  for (const assignment of assignments) {
    addCurrencyAmount(outstandingMap, assignment.currency, Math.max(assignment.selling_price - (receivedByAssignment.get(assignment.id) ?? 0), 0));
    unmatchedClientPayments += unmatchedByAssignment.get(assignment.id) ?? 0;
  }

  const workerCosts = groupCurrencyAmounts(activeWorkers, (row) => row.currency, (row) => row.agreed_cost);
  const workerPaid = groupCurrencyAmounts(workerPayments, (row) => row.currency, (row) => row.amount);
  let profitUnavailableAssignments = 0;
  let assignmentActualProfitInr = 0;
  for (const assignment of assignments) {
    const assignmentWorkers = activeWorkers.filter((row) => row.assignment_id === assignment.id);
    const assignmentExpenses = expenses.filter((row) => row.assignment_id === assignment.id);
    const allocationIds = new Set(assignmentWorkers.map((row) => row.id));
    const result = calculateAssignmentInrFinancials({
      workMode: assignment.work_mode,
      actualInrReceived: clientAllocations.filter((row) => row.assignment_id === assignment.id).reduce((sum, row) => sum + numberValue(row.amount_inr), 0),
      workerCosts: assignmentWorkers,
      workerPayments: workerPayments.filter((row) => allocationIds.has(row.assignment_worker_id)),
      expenses: assignmentExpenses,
    });
    if (result.profitStatus !== "available" && result.profitStatus !== "awaiting_payment") {
      profitUnavailableAssignments += 1;
    } else if (result.actualProfitInr !== null) {
      assignmentActualProfitInr += result.actualProfitInr;
    }
  }

  const actualInrReceived = clientPayments.reduce((sum, row) => sum + numberValue(row.amount_inr), 0);
  const inrWorkerPaid = workerPayments.filter((row) => row.currency === "INR").reduce((sum, row) => sum + numberValue(row.amount), 0);
  const inrExpenses = expenses.filter((row) => row.currency === "INR").reduce((sum, row) => sum + numberValue(row.amount), 0);
  const excludedNonInrCashOut = workerPayments.filter((row) => row.currency !== "INR").length + expenses.filter((row) => row.currency !== "INR").length;
  const generalExpenses = expenses.filter((row) => !row.assignment_id);
  const generalInrExpenses = generalExpenses.filter((row) => row.currency === "INR").reduce((sum, row) => sum + numberValue(row.amount), 0);
  const actualProfitInr = profitUnavailableAssignments > 0 || generalExpenses.some((row) => row.currency !== "INR")
    ? null
    : assignmentActualProfitInr - generalInrExpenses;
  const currentCashPositionInr = excludedNonInrCashOut > 0 ? null : actualInrReceived - inrWorkerPaid - inrExpenses;
  const summary: DashboardSummary | null = failed ? null : {
    total_assignments: assignments.length,
    active_assignments: assignments.filter((row) => activeStatuses.has(row.status)).length,
    total_work_value: groupCurrencyAmounts(assignments.filter((row) => row.status !== "cancelled"), (row) => row.currency, (row) => row.selling_price),
    original_client_received: groupCurrencyAmounts(clientPayments, (row) => row.currency_original, (row) => row.amount_original),
    actual_inr_received: actualInrReceived,
    client_outstanding: currencyAmounts(outstandingMap),
    worker_cost: workerCosts,
    worker_paid: workerPaid,
    worker_payable: subtractCurrencyAmounts(workerCosts, workerPaid),
    expenses: groupCurrencyAmounts(expenses, (row) => row.currency, (row) => row.amount),
    actual_profit_inr: actualProfitInr,
    current_cash_position_inr: currentCashPositionInr,
    profit_unavailable_assignments: profitUnavailableAssignments,
    unmatched_client_payments: unmatchedClientPayments,
    excluded_non_inr_cash_out: excludedNonInrCashOut,
  };

  const now = new Date();
  const deadlines: DashboardDeadline[] = assignments.filter((row) => row.client_deadline && activeStatuses.has(row.status)).sort((a, b) => a.client_deadline!.localeCompare(b.client_deadline!)).slice(0, 8).map((row) => ({ ...row, deadline_group: deadlineGroup(row.client_deadline!, now) }));
  const outstandingClients: ClientOutstandingItem[] = assignments.map((assignment) => ({ assignment_id: assignment.id, task_code: assignment.task_code, title: assignment.title, client_name: assignment.client_name, client_deadline: assignment.client_deadline, currency: assignment.currency, selling_price: assignment.selling_price, client_received: receivedByAssignment.get(assignment.id) ?? 0, client_outstanding: Math.max(assignment.selling_price - (receivedByAssignment.get(assignment.id) ?? 0), 0), unmatched_payment_count: unmatchedByAssignment.get(assignment.id) ?? 0 })).filter((row) => row.client_outstanding > 0).sort((a, b) => (a.client_deadline ?? "9999").localeCompare(b.client_deadline ?? "9999")).slice(0, 6);

  const workerNames = new Map<string, string[]>();
  for (const row of activeWorkers) { const names = workerNames.get(row.assignment_id) ?? []; const name = contacts.get(row.worker_id); if (name && !names.includes(name)) names.push(name); workerNames.set(row.assignment_id, names); }
  const paymentsByAllocation = new Map<string, WorkerPaymentRow[]>();
  for (const row of workerPayments) { const rows = paymentsByAllocation.get(row.assignment_worker_id) ?? []; rows.push(row); paymentsByAllocation.set(row.assignment_worker_id, rows); }
  const writerPayables: WriterPayableItem[] = [];
  for (const assignment of assignments) {
    const costs = new Map<string, number>(); const paid = new Map<string, number>();
    for (const worker of activeWorkers.filter((row) => row.assignment_id === assignment.id)) { addCurrencyAmount(costs, worker.currency, worker.agreed_cost); for (const payment of paymentsByAllocation.get(worker.id) ?? []) addCurrencyAmount(paid, payment.currency, payment.amount); }
    for (const currency of new Set([...costs.keys(), ...paid.keys()])) { const payable = (costs.get(currency) ?? 0) - (paid.get(currency) ?? 0); if (payable > 0) writerPayables.push({ key: `${assignment.id}-${currency}`, assignment_id: assignment.id, task_code: assignment.task_code, title: assignment.title, writer_names: workerNames.get(assignment.id) ?? [], writer_count: workerNames.get(assignment.id)?.length ?? 0, currency, worker_cost: costs.get(currency) ?? 0, worker_paid: paid.get(currency) ?? 0, worker_payable: payable }); }
  }
  writerPayables.sort((a, b) => a.currency.localeCompare(b.currency) || b.worker_payable - a.worker_payable);

  const monthlyCash = monthRange(6); const monthly = new Map(monthlyCash.map((row) => [row.key, row]));
  for (const row of clientPayments) { const month = monthly.get(row.payment_date.slice(0, 7)); if (month) month.received += numberValue(row.amount_inr); }
  for (const row of workerPayments) { const month = monthly.get(row.payment_date.slice(0, 7)); if (!month) continue; if (row.currency !== "INR") month.has_unconverted_cash_out = true; else month.worker_paid += numberValue(row.amount); }
  for (const row of expenses) { const month = monthly.get(row.expense_date.slice(0, 7)); if (!month) continue; if (row.currency !== "INR") month.has_unconverted_cash_out = true; else month.expenses += numberValue(row.amount); }
  for (const row of monthlyCash) row.cash_flow = row.has_unconverted_cash_out ? null : row.received - row.worker_paid - row.expenses;

  return { summary, recentAssignments: assignments.slice(0, 5), deadlines, outstandingClients, writerPayables: writerPayables.slice(0, 6), monthlyCash, excludedNonInrCashOut, errors };
}
