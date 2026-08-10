import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  icon: LucideIcon;
  value: ReactNode;
  hint: string;
  tone?: "default" | "positive" | "warning";
};

export function MetricCard({ label, icon: Icon, value, hint, tone = "default" }: MetricCardProps) {
  const toneClasses = tone === "positive" ? "bg-emerald-50 text-emerald-700" : tone === "warning" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500";
  return <Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-sm font-medium text-slate-500">{label}</p><div className="mt-3 text-xl font-semibold tracking-tight text-slate-900">{value}</div></div><span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${toneClasses}`}><Icon aria-hidden="true" className="size-4.5" /></span></div><p className="mt-3 text-xs text-slate-500">{hint}</p></Card>;
}
