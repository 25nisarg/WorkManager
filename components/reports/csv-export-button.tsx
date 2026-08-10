"use client";

import { Download } from "lucide-react";
import type { CurrencyAmount } from "@/types/financial";
import type { ReportData } from "@/types/report";

function escape(value: string | number) { const text = String(value); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
function amounts(values: CurrencyAmount[]) { return values.map((value) => `${value.currency} ${value.amount}`).join(" | "); }

export function CsvExportButton({ data }: { data: ReportData }) {
  function download() {
    const rows: Array<Array<string | number>> = [["Section", "Name", "Metric 1", "Value 1", "Metric 2", "Value 2", "Metric 3", "Value 3"]];
    data.sources.forEach((row) => rows.push(["Work by Source", row.source, "Assignments", row.assignment_count, "Work Value by Currency", amounts(row.work_value), "", ""]));
    data.clients.forEach((row) => rows.push(["Top Clients", row.name, "Assignments", row.assignment_count, "Work Value by Currency", amounts(row.work_value), "Outstanding by Currency", amounts(row.client_outstanding)]));
    data.writers.forEach((row) => rows.push(["Writer Performance", row.name, "Assigned", row.assigned_tasks, "Agreed Cost by Currency", amounts(row.agreed_cost), "Payable by Currency", amounts(row.amount_payable)]));
    data.workModes.forEach((row) => rows.push(["Work Mode", row.work_mode, "Assignments", row.assignment_count, "Quoted Value by Currency", amounts(row.work_value), "Actual Profit INR", row.actual_profit_inr ?? "Unavailable"]));
    const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `work-manager-report-${data.range.start}-${data.range.end}.csv`; link.click(); URL.revokeObjectURL(url);
  }
  return <button type="button" onClick={download} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"><Download aria-hidden="true" className="size-4" />Export CSV</button>;
}
