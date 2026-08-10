import { BanknoteArrowDown, BanknoteArrowUp, BriefcaseBusiness, CircleDollarSign, Clock3, HandCoins, Landmark, ReceiptText, TrendingUp } from "lucide-react";
import { CurrencyValues } from "@/components/ui/currency-values";
import { DataError } from "@/components/ui/data-error";
import { formatCurrency } from "@/lib/utils/format";
import type { DashboardSummary } from "@/types/dashboard";
import { MetricCard } from "./metric-card";

export function DashboardMetrics({ summary, error }: { summary: DashboardSummary | null; error?: string }) {
  if (error || !summary) return <DataError message={error ?? "Dashboard totals are temporarily unavailable."} />;
  const metrics = [
    { label: "Quoted Work Value", value: <CurrencyValues values={summary.total_work_value} />, hint: "Assignment quoted value by currency", icon: BriefcaseBusiness },
    { label: "Original Client Payments", value: <CurrencyValues values={summary.original_client_received} />, hint: "Original payment values by currency", icon: BanknoteArrowDown, tone: "positive" as const },
    { label: "Actual INR Received", value: formatCurrency(summary.actual_inr_received, "INR"), hint: "Actual INR credited", icon: BanknoteArrowDown, tone: "positive" as const },
    { label: "Client Outstanding", value: <CurrencyValues values={summary.client_outstanding} />, hint: summary.unmatched_client_payments ? `${summary.unmatched_client_payments} mismatched-currency payment(s) excluded` : "Selling value less matching original payments", icon: Clock3, tone: "warning" as const },
    { label: "Writer Agreed Cost", value: <CurrencyValues values={summary.worker_cost} />, hint: "Agreed allocation liability by currency", icon: HandCoins },
    { label: "Worker Payable", value: <CurrencyValues values={summary.worker_payable} />, hint: "Agreed cost less payments by currency", icon: BanknoteArrowUp, tone: "warning" as const },
    { label: "Total Expenses", value: <CurrencyValues values={summary.expenses} />, hint: "Recorded expenses by currency", icon: ReceiptText },
    { label: "Actual Profit to Date", value: summary.actual_profit_inr === null ? "Unavailable" : formatCurrency(summary.actual_profit_inr, "INR"), hint: summary.profit_unavailable_assignments ? `Unavailable: ${summary.profit_unavailable_assignments} received assignment(s) need an INR-complete cost model` : "Actual INR received to date less agreed writer cost and expenses", icon: TrendingUp, tone: "positive" as const },
    { label: "Current Cash Position", value: summary.current_cash_position_inr === null ? "Unavailable" : formatCurrency(summary.current_cash_position_inr, "INR"), hint: summary.excluded_non_inr_cash_out ? `${summary.excluded_non_inr_cash_out} non-INR cash-out transaction(s) prevent consolidation` : "Actual INR received less payments and expenses paid", icon: Landmark, tone: summary.current_cash_position_inr !== null && summary.current_cash_position_inr >= 0 ? "positive" as const : "warning" as const },
    { label: "Active Assignments", value: String(summary.active_assignments), hint: `${summary.total_assignments} assignments total`, icon: CircleDollarSign },
  ];
  return <section aria-labelledby="key-metrics-heading"><h2 id="key-metrics-heading" className="sr-only">Key metrics</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div></section>;
}
