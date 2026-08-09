import type { Metadata } from "next";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseSummary } from "@/components/expenses/expense-summary";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataError } from "@/components/ui/data-error";
import { getExpensesData } from "@/lib/queries/expenses";
import { requireAuthenticatedOwnerId } from "@/lib/supabase/auth";
import { expenseIdSchema } from "@/lib/validations/expense";

export const metadata: Metadata = { title: "Expenses" };
type QueryValue = string | string[] | undefined;
type Props = {
  searchParams: Promise<{
    q?: QueryValue;
    date_from?: QueryValue;
    date_to?: QueryValue;
    category?: QueryValue;
    assignment?: QueryValue;
    account?: QueryValue;
  }>;
};

function first(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value;
}
function validDate(value?: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}
function validUuid(value?: string) {
  return expenseIdSchema.safeParse(value).success ? value : undefined;
}

export default async function ExpensesPage({ searchParams }: Props) {
  const ownerId = await requireAuthenticatedOwnerId();
  const params = await searchParams;
  const filters = {
    search: first(params.q)?.trim(),
    dateFrom: validDate(first(params.date_from)),
    dateTo: validDate(first(params.date_to)),
    category: first(params.category)?.trim() || undefined,
    assignmentId: validUuid(first(params.assignment)),
    accountId: validUuid(first(params.account)),
  };
  const data = await getExpensesData(ownerId, filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader eyebrow="Business costs" title="Expenses" description="Track general operating costs and assignment-specific expenses without mixing currencies." />
        <ExpenseDialog assignments={data.assignments} accounts={data.accounts} />
      </div>
      <ExpenseSummary expenses={data.expenses} />
      <ExpenseFilters {...filters} assignments={data.assignments} accounts={data.accounts} />
      {data.error ? <DataError message={data.error} /> : <ExpenseTable expenses={data.expenses} assignments={data.assignments} accounts={data.accounts} />}
    </div>
  );
}
