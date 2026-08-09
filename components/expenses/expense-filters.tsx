import Link from "next/link";
import { Search } from "lucide-react";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expenses";
import type { ExpenseAssignment, ExpensePaymentAccount } from "@/types/expense";

type Props = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  assignmentId?: string;
  accountId?: string;
  assignments: ExpenseAssignment[];
  accounts: ExpensePaymentAccount[];
};

const fieldClass = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export function ExpenseFilters(props: Props) {
  const hasFilters = Boolean(props.search || props.dateFrom || props.dateTo || props.category || props.assignmentId || props.accountId);
  return (
    <form action="/expenses" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <div className="relative lg:col-span-2 xl:col-span-2">
          <label htmlFor="expense-search" className="sr-only">Search expenses</label>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input id="expense-search" name="q" type="search" defaultValue={props.search} placeholder="Description, category, task, reference" className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
        </div>
        <div><label htmlFor="expense-date-from" className="sr-only">From date</label><input id="expense-date-from" name="date_from" type="date" defaultValue={props.dateFrom} className={fieldClass} /></div>
        <div><label htmlFor="expense-date-to" className="sr-only">To date</label><input id="expense-date-to" name="date_to" type="date" defaultValue={props.dateTo} className={fieldClass} /></div>
        <div><label htmlFor="expense-category-filter" className="sr-only">Category</label><select id="expense-category-filter" name="category" defaultValue={props.category ?? ""} className={fieldClass}><option value="">All categories</option>{EXPENSE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}{props.category && !EXPENSE_CATEGORIES.includes(props.category as (typeof EXPENSE_CATEGORIES)[number]) && <option value={props.category}>{props.category}</option>}</select></div>
        <div><label htmlFor="expense-account-filter" className="sr-only">Payment account</label><select id="expense-account-filter" name="account" defaultValue={props.accountId ?? ""} className={fieldClass}><option value="">All accounts</option>{props.accounts.map((account) => <option key={account.id} value={account.id}>{account.account_name}</option>)}</select></div>
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-md"><label htmlFor="expense-assignment-filter" className="sr-only">Assignment</label><select id="expense-assignment-filter" name="assignment" defaultValue={props.assignmentId ?? ""} className={fieldClass}><option value="">All assignments</option>{props.assignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.task_code} — {assignment.title}</option>)}</select></div>
        <div className="flex gap-2 sm:ml-auto"><button type="submit" className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700">Apply</button>{hasFilters && <Link href="/expenses" className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">Clear</Link>}</div>
      </div>
    </form>
  );
}
