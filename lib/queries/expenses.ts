import { createClient } from "@/lib/supabase/server";
import type {
  Expense,
  ExpenseAssignment,
  ExpensePaymentAccount,
} from "@/types/expense";

type ExpenseRow = Omit<Expense, "assignment" | "payment_account">;

export type ExpenseFilters = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  assignmentId?: string;
  accountId?: string;
};

export type ExpensesData = {
  expenses: Expense[];
  assignments: ExpenseAssignment[];
  accounts: ExpensePaymentAccount[];
  error?: string;
};

const expenseColumns =
  "id, owner_id, assignment_id, payment_account_id, category, description, amount, currency, expense_date, payment_method, transaction_reference, notes, created_at";
const assignmentColumns = "id, task_code, title";
const accountColumns =
  "id, owner_id, account_name, account_type, currency, notes, is_active, created_at";

export async function getExpensesData(
  ownerId: string,
  filters: ExpenseFilters = {}
): Promise<ExpensesData> {
  const supabase = await createClient();
  const [expenseResult, assignmentResult, accountResult] = await Promise.all([
    supabase.from("expenses").select(expenseColumns).eq("owner_id", ownerId),
    supabase
      .from("assignments")
      .select(assignmentColumns)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false }),
    supabase
      .from("payment_accounts")
      .select(accountColumns)
      .eq("owner_id", ownerId)
      .order("account_name", { ascending: true }),
  ]);

  const error =
    expenseResult.error ?? assignmentResult.error ?? accountResult.error;
  if (error) {
    console.error("[expenses query failed]", {
      errorCode: error.code,
      errorMessage: error.message,
    });
    return {
      expenses: [],
      assignments: [],
      accounts: [],
      error: "We could not load expenses. Please refresh and try again.",
    };
  }

  const assignments = (assignmentResult.data ?? []) as ExpenseAssignment[];
  const accounts = (accountResult.data ?? []) as ExpensePaymentAccount[];
  const assignmentsById = new Map(
    assignments.map((assignment) => [assignment.id, assignment])
  );
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  let expenses = ((expenseResult.data ?? []) as ExpenseRow[]).map((expense) => ({
    ...expense,
    amount: Number(expense.amount),
    assignment: expense.assignment_id
      ? assignmentsById.get(expense.assignment_id) ?? null
      : null,
    payment_account: expense.payment_account_id
      ? accountsById.get(expense.payment_account_id) ?? null
      : null,
  }));

  const search = filters.search?.trim().toLocaleLowerCase();
  if (search) {
    expenses = expenses.filter((expense) =>
      [
        expense.category,
        expense.description,
        expense.transaction_reference,
        expense.assignment?.task_code,
        expense.assignment?.title,
      ].some((value) => value?.toLocaleLowerCase().includes(search))
    );
  }
  if (filters.dateFrom) {
    expenses = expenses.filter(
      (expense) => expense.expense_date >= filters.dateFrom!
    );
  }
  if (filters.dateTo) {
    expenses = expenses.filter(
      (expense) => expense.expense_date <= filters.dateTo!
    );
  }
  if (filters.category) {
    expenses = expenses.filter(
      (expense) => expense.category === filters.category
    );
  }
  if (filters.assignmentId) {
    expenses = expenses.filter(
      (expense) => expense.assignment_id === filters.assignmentId
    );
  }
  if (filters.accountId) {
    expenses = expenses.filter(
      (expense) => expense.payment_account_id === filters.accountId
    );
  }

  expenses.sort((a, b) => b.expense_date.localeCompare(a.expense_date));
  return { expenses, assignments, accounts };
}

export async function getPaymentAccounts(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_accounts")
    .select(accountColumns)
    .eq("owner_id", ownerId)
    .order("account_name", { ascending: true });

  if (error) {
    console.error("[payment accounts query failed]", {
      errorCode: error.code,
      errorMessage: error.message,
    });
    return {
      accounts: [] as ExpensePaymentAccount[],
      error: "We could not load payment accounts. Please refresh and try again.",
    };
  }
  return { accounts: (data ?? []) as ExpensePaymentAccount[] };
}
