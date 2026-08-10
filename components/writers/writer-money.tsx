import { formatCurrency } from "@/lib/utils/format";
import type { MoneyAmount } from "@/types/writer";

export function WriterMoney({ values, emphasize = false }: { values: MoneyAmount[]; emphasize?: boolean }) {
  if (values.length === 0) return <span className="text-slate-400">—</span>;
  return <span className={`flex flex-col gap-0.5 ${emphasize ? "font-semibold text-amber-700" : "text-slate-700"}`}>{values.map((value) => <span key={value.currency}>{formatCurrency(value.amount, value.currency)}</span>)}</span>;
}
