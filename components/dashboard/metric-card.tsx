import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  icon: LucideIcon;
};

export function MetricCard({ label, icon: Icon }: MetricCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-400" aria-label={label + " data not available yet"}>—</p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon aria-hidden="true" className="size-4.5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-400">Awaiting data integration</p>
    </Card>
  );
}
