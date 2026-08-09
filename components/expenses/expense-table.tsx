import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PAYMENT_METHODS } from "@/lib/constants/payments";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type {
  Expense,
  ExpenseAssignment,
  ExpensePaymentAccount,
} from "@/types/expense";
import { DeleteExpenseDialog } from "./delete-expense-dialog";
import { ExpenseDialog } from "./expense-dialog";

const methodLabels = new Map<string, string>(
  PAYMENT_METHODS.map((method) => [method.value, method.label])
);

type Props = {
  expenses: Expense[];
  assignments: ExpenseAssignment[];
  accounts: ExpensePaymentAccount[];
  assignmentContext?: boolean;
};

function Actions({ expense, assignments, accounts, assignmentContext }: Props & { expense: Expense }) {
  return (
    <div className="flex justify-end gap-1">
      <ExpenseDialog
        expenseId={expense.id}
        assignments={assignments}
        accounts={accounts}
        initialValues={expense}
        defaultAssignmentId={expense.assignment_id ?? undefined}
        returnToAssignment={assignmentContext}
      />
      <DeleteExpenseDialog
        expenseId={expense.id}
        description={expense.description}
        returnAssignmentId={
          assignmentContext ? expense.assignment_id ?? undefined : undefined
        }
      />
    </div>
  );
}

export function ExpenseTable({
  expenses,
  assignments,
  accounts,
  assignmentContext = false,
}: Props) {
  if (!expenses.length) {
    return (
      <Card className="flex min-h-48 flex-col items-center justify-center px-6 py-8 text-center">
        <span className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <ReceiptText aria-hidden="true" className="size-5" />
        </span>
        <h3 className="mt-4 font-semibold text-slate-900">
          {assignmentContext ? "No expenses for this assignment" : "No expenses recorded"}
        </h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          {assignmentContext
            ? "Add an assignment-specific expense to include it in expected net profit."
            : "Add your first business expense to begin tracking operating costs."}
        </p>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1050px] text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Date</th><th className="px-4 py-3">Expense</th><th className="px-4 py-3">Assignment</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Method / Account</th><th className="px-4 py-3">Reference</th><th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((expense) => (
              <tr key={expense.id} className="align-top hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{formatDate(expense.expense_date)}</td>
                <td className="max-w-64 px-4 py-4"><p className="font-medium text-slate-800">{expense.description}</p><span className="mt-1 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{expense.category}</span>{expense.notes && <p className="mt-1 line-clamp-2 text-xs text-slate-400">{expense.notes}</p>}</td>
                <td className="max-w-52 px-4 py-4">{expense.assignment ? <Link href={"/assignments/" + expense.assignment.id} className="group"><p className="font-mono text-xs font-semibold text-indigo-700">{expense.assignment.task_code}</p><p className="mt-1 truncate text-sm text-slate-500 group-hover:text-indigo-700">{expense.assignment.title}</p></Link> : <span className="text-sm text-slate-400">General business</span>}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-900">{formatCurrency(expense.amount, expense.currency)}</td>
                <td className="px-4 py-4 text-sm text-slate-600"><p>{methodLabels.get(expense.payment_method) ?? expense.payment_method}</p><p className="mt-1 text-xs text-slate-400">{expense.payment_account?.account_name ?? "No account"}</p></td>
                <td className="max-w-40 px-4 py-4 text-sm text-slate-500"><p className="truncate">{expense.transaction_reference || "—"}</p></td>
                <td className="px-4 py-4"><Actions expense={expense} expenses={expenses} assignments={assignments} accounts={accounts} assignmentContext={assignmentContext} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-slate-100 lg:hidden">
        {expenses.map((expense) => (
          <article key={expense.id} className="p-4">
            <div className="flex items-start justify-between gap-3"><div><span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{expense.category}</span><h3 className="mt-2 font-medium text-slate-900">{expense.description}</h3></div><p className="shrink-0 font-semibold text-slate-900">{formatCurrency(expense.amount, expense.currency)}</p></div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-slate-400">Date</dt><dd className="mt-1 text-slate-700">{formatDate(expense.expense_date)}</dd></div><div><dt className="text-xs text-slate-400">Assignment</dt><dd className="mt-1 text-slate-700">{expense.assignment?.task_code ?? "General business"}</dd></div><div><dt className="text-xs text-slate-400">Method</dt><dd className="mt-1 text-slate-700">{methodLabels.get(expense.payment_method) ?? expense.payment_method}</dd></div><div><dt className="text-xs text-slate-400">Account</dt><dd className="mt-1 text-slate-700">{expense.payment_account?.account_name ?? "No account"}</dd></div></dl>
            <div className="mt-3 border-t border-slate-100 pt-2"><Actions expense={expense} expenses={expenses} assignments={assignments} accounts={accounts} assignmentContext={assignmentContext} /></div>
          </article>
        ))}
      </div>
    </div>
  );
}
