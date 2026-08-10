import { AlertTriangle, CalendarDays, CalendarPlus, Clock3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DeadlineItem } from "@/types/deadline";

export function DeadlineSummary({ items }: { items: DeadlineItem[] }) {
  const cards = [
    { label: "Overdue", value: items.filter((item) => item.urgency === "overdue").length, icon: AlertTriangle, tone: "text-red-600 bg-red-50" },
    { label: "Due today", value: items.filter((item) => item.urgency === "today").length, icon: Clock3, tone: "text-amber-600 bg-amber-50" },
    { label: "Due tomorrow", value: items.filter((item) => item.urgency === "tomorrow").length, icon: CalendarDays, tone: "text-orange-600 bg-orange-50" },
    { label: "Within 3 days", value: items.filter((item) => item.urgency === "three_days").length, icon: CalendarPlus, tone: "text-blue-600 bg-blue-50" },
  ];
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <Card key={card.label} className="flex items-center justify-between gap-4 p-4"><div><p className="text-sm font-medium text-slate-500">{card.label}</p><p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p></div><span className={"flex size-9 items-center justify-center rounded-lg " + card.tone}><card.icon aria-hidden="true" className="size-4.5" /></span></Card>)}</div>;
}
