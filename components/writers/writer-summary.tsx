import { Banknote, BriefcaseBusiness, CircleCheckBig, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { MoneyAmount, WriterListItem } from "@/types/writer";
import { WriterMoney } from "./writer-money";

function totalPayable(writers: WriterListItem[]) {
  const totals = new Map<string, number>();
  for (const writer of writers) for (const value of writer.total_payable) totals.set(value.currency, (totals.get(value.currency) ?? 0) + value.amount);
  return [...totals].map(([currency, amount]): MoneyAmount => ({ currency, amount })).sort((a, b) => a.currency.localeCompare(b.currency));
}

export function WriterSummary({ writers }: { writers: WriterListItem[] }) {
  const cards = [
    { label: "Writers", value: String(writers.length), hint: "Matching directory contacts", icon: UsersRound },
    { label: "Currently assigned", value: String(writers.filter((writer) => writer.active_assignments > 0).length), hint: "Writers with active work", icon: BriefcaseBusiness },
    { label: "Completed allocations", value: String(writers.reduce((sum, writer) => sum + writer.completed_assignments, 0)), hint: "Writer or assignment delivered", icon: CircleCheckBig },
  ];
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <Card key={card.label} className="p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-slate-500">{card.label}</p><p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{card.value}</p></div><span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><card.icon aria-hidden="true" className="size-4.5" /></span></div><p className="mt-3 text-xs text-slate-500">{card.hint}</p></Card>)}<Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-slate-500">Total payable</p><div className="mt-3 text-lg"><WriterMoney values={totalPayable(writers)} emphasize /></div></div><span className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Banknote aria-hidden="true" className="size-4.5" /></span></div><p className="mt-3 text-xs text-slate-500">Across matching writers, by currency</p></Card></div>;
}
