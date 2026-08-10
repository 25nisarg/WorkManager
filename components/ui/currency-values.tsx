import { formatCurrency } from "@/lib/utils/format";
import type { CurrencyAmount } from "@/types/financial";

export function CurrencyValues({ values, empty = "—", className = "" }: { values: CurrencyAmount[]; empty?: string; className?: string }) {
  if (!values.length) return <span className={`text-slate-400 ${className}`}>{empty}</span>;
  return <span className={`flex flex-col gap-0.5 ${className}`}>{values.map((value) => <span key={value.currency}><span className="mr-1 text-xs font-medium text-slate-400">{value.currency}</span>{formatCurrency(value.amount, value.currency)}</span>)}</span>;
}
