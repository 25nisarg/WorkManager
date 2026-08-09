import { BarChart3, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";

type DashboardPanelProps = {
  title: string;
  description: string;
  chart?: boolean;
};

export function DashboardPanel({ title, description, chart = false }: DashboardPanelProps) {
  const Icon = chart ? BarChart3 : Inbox;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
        <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <p className="max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </Card>
  );
}
