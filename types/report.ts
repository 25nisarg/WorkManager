import type { WorkMode } from "@/types/assignment";
import type { CurrencyAmount } from "@/types/financial";

export type ReportPreset = "this_month" | "last_month" | "this_year" | "custom";
export type ReportRange = { preset: ReportPreset; start: string; end: string; label: string };
export type ReportSummary = {
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
};
export type MonthlyPerformance = { key: string; label: string; work_value: CurrencyAmount[]; client_received_inr: number; worker_paid_inr: number; expenses_inr: number; actual_profit_inr: number | null; current_cash_position_inr: number | null; has_unconverted_cost: boolean };
export type SourcePerformance = { source: "Student" | "Vendor" | "Freelancer" | "Other"; assignment_count: number; work_value: CurrencyAmount[] };
export type ClientPerformance = { contact_id: string; name: string; assignment_count: number; work_value: CurrencyAmount[]; payments_received: CurrencyAmount[]; client_outstanding: CurrencyAmount[] };
export type WriterPerformance = { writer_id: string; name: string; assigned_tasks: number; completed_tasks: number; agreed_cost: CurrencyAmount[]; amount_paid: CurrencyAmount[]; amount_payable: CurrencyAmount[] };
export type WorkModePerformance = { work_mode: WorkMode; assignment_count: number; work_value: CurrencyAmount[]; actual_profit_inr: number | null; unavailable_profit_count: number };
export type ReportData = { range: ReportRange; summary: ReportSummary; monthly: MonthlyPerformance[]; sources: SourcePerformance[]; clients: ClientPerformance[]; writers: WriterPerformance[]; workModes: WorkModePerformance[]; excludedNonInrCashOut: number; error?: string };
