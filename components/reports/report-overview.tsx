import { BanknoteArrowDown, BanknoteArrowUp, BriefcaseBusiness, Clock3, HandCoins, Landmark, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { CurrencyValues } from "@/components/ui/currency-values";
import { formatCurrency } from "@/lib/utils/format";
import type { ReportSummary } from "@/types/report";

export function ReportOverview({ summary }: { summary: ReportSummary }) {
  const metrics = [
    { label: "Quoted Work Value", value: <CurrencyValues values={summary.total_work_value} />, hint: "Assignments received, by currency", icon: BriefcaseBusiness },
    { label: "Original Client Payments", value: <CurrencyValues values={summary.original_client_received} />, hint: "Original payment values in range", icon: BanknoteArrowDown, tone: "positive" as const },
    { label: "Actual INR Received", value: formatCurrency(summary.actual_inr_received, "INR"), hint: "Actual INR credited in range", icon: BanknoteArrowDown, tone: "positive" as const },
    { label: "Client Outstanding", value: <CurrencyValues values={summary.client_outstanding} />, hint: summary.unmatched_client_payments ? `${summary.unmatched_client_payments} mismatched payment(s) excluded` : "Matching-currency assignment balances", icon: Clock3, tone: "warning" as const },
    { label: "Writer Agreed Cost", value: <CurrencyValues values={summary.worker_cost} />, hint: "Agreed allocation liability by currency", icon: HandCoins },
    { label: "Writer Paid", value: <CurrencyValues values={summary.worker_paid} />, hint: "Paid through period end, by currency", icon: BanknoteArrowUp },
    { label: "Writer Payable", value: <CurrencyValues values={summary.worker_payable} />, hint: "Cost less paid within each currency", icon: WalletCards, tone: "warning" as const },
    { label: "Expenses", value: <CurrencyValues values={summary.expenses} />, hint: "Expenses in range by currency", icon: ReceiptText },
    { label: "Actual Profit", value: summary.actual_profit_inr === null ? "Unavailable" : formatCurrency(summary.actual_profit_inr, "INR"), hint: summary.profit_unavailable_assignments ? `Unavailable for ${summary.profit_unavailable_assignments} assignment(s) without a complete INR cost model` : "Actual INR received less agreed writer cost and expenses", icon: TrendingUp, tone: "positive" as const },
    { label: "Current Cash Position", value: summary.current_cash_position_inr === null ? "Unavailable" : formatCurrency(summary.current_cash_position_inr, "INR"), hint: "Actual INR received less writer payments and expenses paid", icon: Landmark, tone: summary.current_cash_position_inr !== null && summary.current_cash_position_inr >= 0 ? "positive" as const : "warning" as const },
  ];
  return <section className="space-y-3" aria-labelledby="financial-overview-heading"><h2 id="financial-overview-heading" className="text-lg font-semibold text-slate-950">Financial overview</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div></section>;
}
