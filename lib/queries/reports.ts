import { createClient } from "@/lib/supabase/server";
import { addCurrencyAmount, currencyAmounts, groupCurrencyAmounts, numberValue, subtractCurrencyAmounts } from "@/lib/utils/currency";
import { calculateAssignmentInrFinancials } from "@/lib/utils/financial-model";
import {
  isCompletedWriterAllocation,
  normalizeAssignmentStatus,
} from "@/lib/utils/status";
import type { WorkMode } from "@/types/assignment";
import type { CurrencyAmount } from "@/types/financial";
import type { ClientPerformance, MonthlyPerformance, ReportData, ReportPreset, ReportRange, SourcePerformance, WorkModePerformance, WriterPerformance } from "@/types/report";

type AssignmentRow = { id: string; received_from_id: string | null; received_date: string; selling_price: number | string; currency: string; work_mode: WorkMode; status: string };
type ContactRow = { id: string; name: string };
type RoleRow = { contact_id: string; role: string };
type WorkerRow = { id: string; assignment_id: string; worker_id: string; assigned_date: string; agreed_cost: number | string; currency: string; status: string };
type ClientPaymentRow = { id: string; payer_id: string | null; payment_date: string; amount_original: number | string; currency_original: string; amount_inr: number | string };
type ClientAllocationRow = { client_payment_id: string; assignment_id: string; amount_original: number | string; amount_inr: number | string };
type WorkerPaymentRow = { assignment_worker_id: string; worker_id: string; payment_date: string; amount: number | string; currency: string };
type ExpenseRow = { assignment_id: string | null; expense_date: string; amount: number | string; currency: string };

const dateText = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const validDate = (value?: string) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)));
const inRange = (date: string, range: ReportRange) => date >= range.start && date <= range.end;

export function resolveReportRange(presetValue?: string, customStart?: string, customEnd?: string): ReportRange {
  const now = new Date();
  const preset: ReportPreset = (["this_month", "last_month", "this_year", "custom"] as const).includes(presetValue as ReportPreset) ? presetValue as ReportPreset : "this_year";
  if (preset === "custom" && validDate(customStart) && validDate(customEnd) && customStart! <= customEnd!) return { preset, start: customStart!, end: customEnd!, label: `${customStart} to ${customEnd}` };
  if (preset === "last_month") { const start = new Date(now.getFullYear(), now.getMonth() - 1, 1); return { preset, start: dateText(start), end: dateText(new Date(now.getFullYear(), now.getMonth(), 0)), label: "Last month" }; }
  if (preset === "this_month") return { preset, start: dateText(new Date(now.getFullYear(), now.getMonth(), 1)), end: dateText(now), label: "This month" };
  return { preset: "this_year", start: dateText(new Date(now.getFullYear(), 0, 1)), end: dateText(now), label: "This year" };
}

function monthSeries(range: ReportRange) {
  const start = new Date(`${range.start}T00:00:00`); const end = new Date(`${range.end}T00:00:00`); const months: MonthlyPerformance[] = [];
  for (let date = new Date(start.getFullYear(), start.getMonth(), 1); date <= end; date = new Date(date.getFullYear(), date.getMonth() + 1, 1)) { const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; months.push({ key, label: new Intl.DateTimeFormat("en-IN", { month: "short", year: start.getFullYear() === end.getFullYear() ? undefined : "2-digit" }).format(date), work_value: [], client_received_inr: 0, worker_paid_inr: 0, expenses_inr: 0, actual_profit_inr: 0, current_cash_position_inr: 0, has_unconverted_cost: false }); }
  return months;
}

function sourceFor(roles: Set<string>): SourcePerformance["source"] { return roles.has("student") ? "Student" : roles.has("vendor") ? "Vendor" : roles.has("freelancer") ? "Freelancer" : "Other"; }
function addToArray(values: CurrencyAmount[], currency: string, amount: number | string) { const map = new Map(values.map((row) => [row.currency, row.amount])); addCurrencyAmount(map, currency, amount); return currencyAmounts(map); }

export async function getReportData(ownerId: string, range: ReportRange): Promise<ReportData> {
  const supabase = await createClient();
  const [assignmentResult, contactResult, roleResult, workerResult, clientPaymentResult, clientAllocationResult, workerPaymentResult, expenseResult] = await Promise.all([
    supabase.from("assignments").select("id, received_from_id, received_date, selling_price, currency, work_mode, status").eq("owner_id", ownerId),
    supabase.from("contacts").select("id, name").eq("owner_id", ownerId),
    supabase.from("contact_roles").select("contact_id, role").eq("owner_id", ownerId),
    supabase.from("assignment_workers").select("id, assignment_id, worker_id, assigned_date, agreed_cost, currency, status").eq("owner_id", ownerId),
    supabase.from("client_payments").select("id, payer_id, payment_date, amount_original, currency_original, amount_inr").eq("owner_id", ownerId),
    supabase.from("client_payment_allocations").select("client_payment_id, assignment_id, amount_original, amount_inr").eq("owner_id", ownerId),
    supabase.from("worker_payments").select("assignment_worker_id, worker_id, payment_date, amount, currency").eq("owner_id", ownerId),
    supabase.from("expenses").select("assignment_id, expense_date, amount, currency").eq("owner_id", ownerId),
  ]);
  const failed = [assignmentResult, contactResult, roleResult, workerResult, clientPaymentResult, clientAllocationResult, workerPaymentResult, expenseResult].find((result) => result.error);
  const emptySummary = { total_work_value: [], original_client_received: [], actual_inr_received: 0, client_outstanding: [], worker_cost: [], worker_paid: [], worker_payable: [], expenses: [], actual_profit_inr: null, current_cash_position_inr: null, profit_unavailable_assignments: 0, unmatched_client_payments: 0 };
  if (failed?.error) { console.error("[reports query failed]", { errorCode: failed.error.code, errorMessage: failed.error.message }); return { range, summary: emptySummary, monthly: [], sources: [], clients: [], writers: [], workModes: [], excludedNonInrCashOut: 0, error: "We could not load reports. Please refresh and try again." }; }

  const allAssignments = ((assignmentResult.data ?? []) as AssignmentRow[]).map((row) => ({ ...row, status: normalizeAssignmentStatus(row.status) })); const assignments = allAssignments.filter((row) => inRange(row.received_date, range) && row.status !== "cancelled"); const assignmentIds = new Set(assignments.map((row) => row.id));
  const contacts = (contactResult.data ?? []) as ContactRow[]; const names = new Map(contacts.map((row) => [row.id, row.name])); const rolesByContact = new Map<string, Set<string>>();
  for (const row of (roleResult.data ?? []) as RoleRow[]) { const values = rolesByContact.get(row.contact_id) ?? new Set<string>(); values.add(row.role); rolesByContact.set(row.contact_id, values); }
  const reportAssignmentIds = new Set(allAssignments.filter((row) => row.status !== "cancelled").map((row) => row.id)); const allWorkers = (workerResult.data ?? []) as WorkerRow[]; const assignmentWorkers = allWorkers.filter((row) => assignmentIds.has(row.assignment_id) && row.status !== "cancelled"); const rangedWorkers = allWorkers.filter((row) => reportAssignmentIds.has(row.assignment_id) && inRange(row.assigned_date, range) && row.status !== "cancelled"); const rangedWorkerIds = new Set(rangedWorkers.map((row) => row.id));
  const allClientPayments = (clientPaymentResult.data ?? []) as ClientPaymentRow[]; const rangedClientPayments = allClientPayments.filter((row) => inRange(row.payment_date, range)); const paymentsById = new Map(allClientPayments.map((row) => [row.id, row])); const rangedPaymentIds = new Set(rangedClientPayments.map((row) => row.id)); const allClientAllocations = (clientAllocationResult.data ?? []) as ClientAllocationRow[]; const rangedClientAllocations = allClientAllocations.filter((row) => rangedPaymentIds.has(row.client_payment_id));
  const allWorkerPayments = (workerPaymentResult.data ?? []) as WorkerPaymentRow[]; const rangedWorkerPayments = allWorkerPayments.filter((row) => inRange(row.payment_date, range)); const payableWorkerPayments = allWorkerPayments.filter((row) => rangedWorkerIds.has(row.assignment_worker_id) && row.payment_date <= range.end);
  const allExpenses = (expenseResult.data ?? []) as ExpenseRow[]; const rangedExpenses = allExpenses.filter((row) => inRange(row.expense_date, range));

  const outstanding = new Map<string, number>(); let unmatchedClientPayments = 0;
  for (const assignment of assignments) { const rows = allClientAllocations.filter((row) => row.assignment_id === assignment.id); const matching = rows.filter((row) => paymentsById.get(row.client_payment_id)?.currency_original === assignment.currency).reduce((sum, row) => sum + numberValue(row.amount_original), 0); unmatchedClientPayments += rows.filter((row) => paymentsById.get(row.client_payment_id)?.currency_original !== assignment.currency).length; addCurrencyAmount(outstanding, assignment.currency, Math.max(numberValue(assignment.selling_price) - matching, 0)); }

  const writerCost = groupCurrencyAmounts(rangedWorkers, (row) => row.currency, (row) => row.agreed_cost); const writerPaid = groupCurrencyAmounts(payableWorkerPayments, (row) => row.currency, (row) => row.amount);
  const actualInrReceived = rangedClientPayments.reduce((sum, row) => sum + numberValue(row.amount_inr), 0); const inrWriterCash = rangedWorkerPayments.filter((row) => row.currency === "INR").reduce((sum, row) => sum + numberValue(row.amount), 0); const inrExpenses = rangedExpenses.filter((row) => row.currency === "INR").reduce((sum, row) => sum + numberValue(row.amount), 0); const excludedNonInrCashOut = rangedWorkerPayments.filter((row) => row.currency !== "INR").length + rangedExpenses.filter((row) => row.currency !== "INR").length;
  let assignmentProfitInr = 0; let profitUnavailableAssignments = 0;
  const allocationByAssignment = new Map<string, WorkerRow[]>(); for (const row of assignmentWorkers) { const rows = allocationByAssignment.get(row.assignment_id) ?? []; rows.push(row); allocationByAssignment.set(row.assignment_id, rows); }
  for (const assignment of assignments) { const costs = allocationByAssignment.get(assignment.id) ?? []; const allocationIds = new Set(costs.map((row) => row.id)); const result = calculateAssignmentInrFinancials({ workMode: assignment.work_mode, actualInrReceived: rangedClientAllocations.filter((row) => row.assignment_id === assignment.id).reduce((sum, row) => sum + numberValue(row.amount_inr), 0), workerCosts: costs, workerPayments: rangedWorkerPayments.filter((row) => allocationIds.has(row.assignment_worker_id)), expenses: rangedExpenses.filter((row) => row.assignment_id === assignment.id) }); if (result.profitStatus !== "available" && result.profitStatus !== "awaiting_payment") profitUnavailableAssignments += 1; else if (result.actualProfitInr !== null) assignmentProfitInr += result.actualProfitInr; }
  const generalExpenses = rangedExpenses.filter((row) => !row.assignment_id); const generalInrExpenses = generalExpenses.filter((row) => row.currency === "INR").reduce((sum, row) => sum + numberValue(row.amount), 0);
  const actualProfitInr = profitUnavailableAssignments > 0 || generalExpenses.some((row) => row.currency !== "INR") ? null : assignmentProfitInr - generalInrExpenses;
  const currentCashPositionInr = excludedNonInrCashOut > 0 ? null : actualInrReceived - inrWriterCash - inrExpenses;
  const summary = { total_work_value: groupCurrencyAmounts(assignments, (row) => row.currency, (row) => row.selling_price), original_client_received: groupCurrencyAmounts(rangedClientPayments, (row) => row.currency_original, (row) => row.amount_original), actual_inr_received: actualInrReceived, client_outstanding: currencyAmounts(outstanding), worker_cost: writerCost, worker_paid: writerPaid, worker_payable: subtractCurrencyAmounts(writerCost, writerPaid), expenses: groupCurrencyAmounts(rangedExpenses, (row) => row.currency, (row) => row.amount), actual_profit_inr: actualProfitInr, current_cash_position_inr: currentCashPositionInr, profit_unavailable_assignments: profitUnavailableAssignments, unmatched_client_payments: unmatchedClientPayments };

  const monthly = monthSeries(range); const months = new Map(monthly.map((row) => [row.key, row]));
  for (const row of assignments) { const month = months.get(row.received_date.slice(0, 7)); if (month) month.work_value = addToArray(month.work_value, row.currency, row.selling_price); }
  for (const row of rangedClientPayments) { const month = months.get(row.payment_date.slice(0, 7)); if (month) month.client_received_inr += numberValue(row.amount_inr); }
  for (const row of rangedWorkerPayments) { const month = months.get(row.payment_date.slice(0, 7)); if (!month) continue; if (row.currency !== "INR") month.has_unconverted_cost = true; else month.worker_paid_inr += numberValue(row.amount); }
  for (const row of rangedExpenses) { const month = months.get(row.expense_date.slice(0, 7)); if (!month) continue; if (row.currency !== "INR") month.has_unconverted_cost = true; else month.expenses_inr += numberValue(row.amount); }
  for (const row of rangedWorkers) { const month = months.get(row.assigned_date.slice(0, 7)); if (!month) continue; const assignment = allAssignments.find((item) => item.id === row.assignment_id); if (assignment?.work_mode === "self") continue; if (row.currency !== "INR") month.has_unconverted_cost = true; else if (month.actual_profit_inr !== null) month.actual_profit_inr -= numberValue(row.agreed_cost); }
  for (const row of monthly) { row.actual_profit_inr = row.has_unconverted_cost ? null : (row.actual_profit_inr ?? 0) + row.client_received_inr - row.expenses_inr; row.current_cash_position_inr = row.has_unconverted_cost ? null : row.client_received_inr - row.worker_paid_inr - row.expenses_inr; }

  const sourceMap = new Map<SourcePerformance["source"], SourcePerformance>(); const clientMap = new Map<string, ClientPerformance>();
  for (const row of assignments) { const source = sourceFor(rolesByContact.get(row.received_from_id ?? "") ?? new Set()); const sourceRow = sourceMap.get(source) ?? { source, assignment_count: 0, work_value: [] }; sourceRow.assignment_count += 1; sourceRow.work_value = addToArray(sourceRow.work_value, row.currency, row.selling_price); sourceMap.set(source, sourceRow); if (row.received_from_id) { const client = clientMap.get(row.received_from_id) ?? { contact_id: row.received_from_id, name: names.get(row.received_from_id) ?? "Unavailable contact", assignment_count: 0, work_value: [], payments_received: [], client_outstanding: [] }; client.assignment_count += 1; client.work_value = addToArray(client.work_value, row.currency, row.selling_price); const matching = allClientAllocations.filter((allocation) => allocation.assignment_id === row.id && paymentsById.get(allocation.client_payment_id)?.currency_original === row.currency); client.payments_received = addToArray(client.payments_received, row.currency, matching.reduce((sum, allocation) => sum + numberValue(allocation.amount_original), 0)); client.client_outstanding = addToArray(client.client_outstanding, row.currency, Math.max(numberValue(row.selling_price) - matching.reduce((sum, allocation) => sum + numberValue(allocation.amount_original), 0), 0)); clientMap.set(row.received_from_id, client); } }

  const writerMap = new Map<string, WriterPerformance>();
  for (const row of rangedWorkers) { const writer = writerMap.get(row.worker_id) ?? { writer_id: row.worker_id, name: names.get(row.worker_id) ?? "Unavailable writer", assigned_tasks: 0, completed_tasks: 0, agreed_cost: [], amount_paid: [], amount_payable: [] }; const assignmentStatus = allAssignments.find((assignment) => assignment.id === row.assignment_id)?.status; writer.assigned_tasks += 1; if (isCompletedWriterAllocation(row.status, assignmentStatus)) writer.completed_tasks += 1; writer.agreed_cost = addToArray(writer.agreed_cost, row.currency, row.agreed_cost); writerMap.set(row.worker_id, writer); }
  for (const writer of writerMap.values()) { const payments = payableWorkerPayments.filter((row) => row.worker_id === writer.writer_id); writer.amount_paid = groupCurrencyAmounts(payments, (row) => row.currency, (row) => row.amount); writer.amount_payable = subtractCurrencyAmounts(writer.agreed_cost, writer.amount_paid); }

  const modeMap = new Map<WorkMode, WorkModePerformance>();
  for (const assignment of assignments) { const mode = modeMap.get(assignment.work_mode) ?? { work_mode: assignment.work_mode, assignment_count: 0, work_value: [], actual_profit_inr: 0, unavailable_profit_count: 0 }; mode.assignment_count += 1; mode.work_value = addToArray(mode.work_value, assignment.currency, assignment.selling_price); const costs = assignmentWorkers.filter((row) => row.assignment_id === assignment.id); const allocationIds = new Set(costs.map((row) => row.id)); const result = calculateAssignmentInrFinancials({ workMode: assignment.work_mode, actualInrReceived: rangedClientAllocations.filter((row) => row.assignment_id === assignment.id).reduce((sum, row) => sum + numberValue(row.amount_inr), 0), workerCosts: costs, workerPayments: rangedWorkerPayments.filter((row) => allocationIds.has(row.assignment_worker_id)), expenses: rangedExpenses.filter((row) => row.assignment_id === assignment.id) }); if (result.profitStatus !== "available" && result.profitStatus !== "awaiting_payment") { mode.unavailable_profit_count += 1; mode.actual_profit_inr = null; } else if (result.actualProfitInr !== null && mode.actual_profit_inr !== null) mode.actual_profit_inr += result.actualProfitInr; modeMap.set(assignment.work_mode, mode); }
  const workModes = (["self", "outsourced", "mixed"] as WorkMode[]).map((mode) => modeMap.get(mode) ?? { work_mode: mode, assignment_count: 0, work_value: [], actual_profit_inr: 0, unavailable_profit_count: 0 });
  return { range, summary, monthly, sources: [...sourceMap.values()].sort((a, b) => b.assignment_count - a.assignment_count), clients: [...clientMap.values()].sort((a, b) => b.assignment_count - a.assignment_count), writers: [...writerMap.values()].sort((a, b) => b.assigned_tasks - a.assigned_tasks), workModes, excludedNonInrCashOut };
}
