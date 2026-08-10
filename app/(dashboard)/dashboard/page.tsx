import type { Metadata } from "next";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { MonthlyFinancialCharts } from "@/components/dashboard/monthly-financial-charts";
import { OutstandingClientPayments } from "@/components/dashboard/outstanding-client-payments";
import { RecentAssignments } from "@/components/dashboard/recent-assignments";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import { WriterPayables } from "@/components/dashboard/writer-payables";
import { PageHeader } from "@/components/layout/page-header";
import { getDashboardData } from "@/lib/queries/dashboard";
import { requireAuthenticatedOwnerId } from "@/lib/supabase/auth";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ownerId = await requireAuthenticatedOwnerId();
  const data = await getDashboardData(ownerId);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Workspace overview" title="Dashboard" description="A current view of assignment value, cash movement, balances, and delivery priorities." />
      <DashboardMetrics summary={data.summary} error={data.errors.summary} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.85fr)]">
        <RecentAssignments assignments={data.recentAssignments} error={data.errors.assignments} />
        <UpcomingDeadlines deadlines={data.deadlines} error={data.errors.assignments} />
      </div>
      <MonthlyFinancialCharts months={data.monthlyCash} excludedNonInrCashOut={data.excludedNonInrCashOut} error={data.errors.charts} />
      <div className="grid gap-6 xl:grid-cols-2">
        <OutstandingClientPayments items={data.outstandingClients} error={data.errors.balances} />
        <WriterPayables items={data.writerPayables} error={data.errors.balances} />
      </div>
    </div>
  );
}
