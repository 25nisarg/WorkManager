import type { Metadata } from "next";
import { CsvExportButton } from "@/components/reports/csv-export-button";
import { ClientPerformanceTable, WorkBreakdowns, WriterPerformanceTable } from "@/components/reports/report-breakdowns";
import { ReportFilters } from "@/components/reports/report-filters";
import { MonthlyPerformanceChart } from "@/components/reports/monthly-performance-chart";
import { ReportOverview } from "@/components/reports/report-overview";
import { PageHeader } from "@/components/layout/page-header";
import { DataError } from "@/components/ui/data-error";
import { getReportData, resolveReportRange } from "@/lib/queries/reports";
import { requireAuthenticatedOwnerId } from "@/lib/supabase/auth";

export const metadata: Metadata = { title: "Reports" };
type QueryValue = string | string[] | undefined;
type Props = { searchParams: Promise<{ range?: QueryValue; start?: QueryValue; end?: QueryValue }> };
const first = (value: QueryValue) => Array.isArray(value) ? value[0] : value;

export default async function ReportsPage({ searchParams }: Props) {
  const ownerId = await requireAuthenticatedOwnerId();
  const params = await searchParams;
  const range = resolveReportRange(first(params.range), first(params.start), first(params.end));
  const data = await getReportData(ownerId, range);
  return <div className="space-y-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><PageHeader eyebrow="Business intelligence" title="Reports" description={`Financial and operational performance for ${range.label.toLowerCase()}.`} />{!data.error && <CsvExportButton data={data} />}</div><ReportFilters range={range} />{data.error ? <DataError message={data.error} /> : <><ReportOverview summary={data.summary} /><MonthlyPerformanceChart months={data.monthly} />{data.excludedNonInrCashOut > 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{data.excludedNonInrCashOut} non-INR writer payment or expense transaction{data.excludedNonInrCashOut === 1 ? " was" : "s were"} excluded from INR cash totals because no historical conversion is stored.</p>}<WorkBreakdowns sources={data.sources} modes={data.workModes} /><ClientPerformanceTable clients={data.clients} /><WriterPerformanceTable writers={data.writers} /></>}</div>;
}
