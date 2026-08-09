import type { PAYMENT_ACCOUNT_TYPE_VALUES } from "@/lib/constants/expenses";

export type PaymentAccountType =
  (typeof PAYMENT_ACCOUNT_TYPE_VALUES)[number];

export type ExpenseAssignment = {
  id: string;
  task_code: string;
  title: string;
};

export type ExpensePaymentAccount = {
  id: string;
  owner_id: string;
  account_name: string;
  account_type: PaymentAccountType;
  currency: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

export type Expense = {
  id: string;
  owner_id: string;
  assignment_id: string | null;
  payment_account_id: string | null;
  category: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  payment_method: string;
  transaction_reference: string | null;
  notes: string | null;
  created_at: string;
  assignment: ExpenseAssignment | null;
  payment_account: ExpensePaymentAccount | null;
};

export type ExpenseFormValues = Pick<
  Expense,
  | "assignment_id"
  | "payment_account_id"
  | "category"
  | "description"
  | "amount"
  | "currency"
  | "expense_date"
  | "payment_method"
  | "transaction_reference"
  | "notes"
>;

export type PaymentAccountFormValues = Pick<
  ExpensePaymentAccount,
  "account_name" | "account_type" | "currency" | "notes" | "is_active"
>;

export type ExpenseActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};
