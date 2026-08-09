import { BriefcaseBusiness, ReceiptText, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";
import type { Expense } from "@/types/expense";

function groupedTotals(expenses: Expense[]) {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    totals.set(expense.currency, (totals.get(expense.currency) ?? 0) + expense.amount);
  }
  return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function ExpenseSummary({ expenses }: { expenses: Expense[] }) {
  const groups = [
    { label: "Total expenses", expenses, icon: ReceiptText },
    { label: "Assignment expenses", expenses: expenses.filter((expense) => expense.assignment_id), icon: BriefcaseBusiness },
    { label: "General business expenses", expenses: expenses.filter((expense) => !expense.assignment_id), icon: WalletCards },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {groups.map((group) => {
        const totals = groupedTotals(group.expenses);
        return <Card key={group.label} className="flex items-start justify-between gap-4 p-5"><div><p className="text-sm font-medium text-slate-500">{group.label}</p><div className="mt-2 space-y-1">{totals.length ? totals.map(([currency, amount]) => <p key={currency} className="text-xl font-semibold tracking-tight text-slate-900">{formatCurrency(amount, currency)}</p>) : <p className="text-xl font-semibold text-slate-400">₹0</p>}</div><p className="mt-2 text-xs text-slate-400">{group.expenses.length} transaction{group.expenses.length === 1 ? "" : "s"}</p></div><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><group.icon aria-hidden="true" className="size-4.5" /></span></Card>;
      })}
    </div>
  );
}
