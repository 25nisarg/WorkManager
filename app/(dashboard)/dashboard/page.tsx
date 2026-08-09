import type { Metadata } from "next";
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  BriefcaseBusiness,
  CircleDollarSign,
  Clock3,
  HandCoins,
  Landmark,
  TrendingUp,
} from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Dashboard" };

const metrics = [
  { label: "Total Work Value", icon: BriefcaseBusiness },
  { label: "Amount Received", icon: BanknoteArrowDown },
  { label: "Client Outstanding", icon: Clock3 },
  { label: "Writer Cost", icon: HandCoins },
  { label: "Writer Payable", icon: BanknoteArrowUp },
  { label: "Expected Net Profit", icon: TrendingUp },
  { label: "Current Cash Flow", icon: Landmark },
  { label: "Active Assignments", icon: CircleDollarSign },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace overview"
        title="Dashboard"
        description="A clear view of your assignments, finances, and upcoming work."
      />

      <section aria-labelledby="key-metrics-heading">
        <h2 id="key-metrics-heading" className="sr-only">Key metrics</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]">
        <DashboardPanel title="Recent assignments" description="Your latest work will appear here once assignment management is added." />
        <DashboardPanel title="Upcoming deadlines" description="Upcoming and overdue work will appear here when deadlines are connected." />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardPanel title="Revenue and profit" description="Monthly financial trends will be connected to your reporting data in a later phase." chart />
        <DashboardPanel title="Outstanding payments" description="Client receivables and writer payables will appear here after payment workflows are implemented." />
      </div>
    </div>
  );
}
