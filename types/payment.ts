export type PaymentAccount = {
  id: string;
  name: string;
  is_active: boolean;
};

export type PaymentContact = {
  id: string;
  name: string;
  company_name: string | null;
};

export type PaymentAssignment = {
  id: string;
  task_code: string;
  title: string;
  received_from_id: string;
};

export type PaymentAllocation = {
  id: string;
  assignment_id: string;
  worker_id: string;
  work_description: string;
  currency: string;
  assignment: PaymentAssignment | null;
  writer: PaymentContact | null;
};

export type ClientPayment = {
  id: string;
  owner_id: string;
  assignment_id: string;
  payer_id: string;
  payment_date: string;
  amount_original: number;
  currency_original: string;
  exchange_rate: number | null;
  amount_inr: number;
  payment_method: string;
  payment_account_id: string | null;
  transaction_reference: string | null;
  notes: string | null;
  created_at: string;
  assignment: PaymentAssignment | null;
  payer: PaymentContact | null;
  account: PaymentAccount | null;
};

export type WorkerPayment = {
  id: string;
  owner_id: string;
  assignment_worker_id: string;
  worker_id: string;
  payment_date: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_account_id: string | null;
  transaction_reference: string | null;
  notes: string | null;
  created_at: string;
  allocation: PaymentAllocation | null;
  writer: PaymentContact | null;
  account: PaymentAccount | null;
};

export type ClientPaymentFormValues = Pick<
  ClientPayment,
  | "assignment_id"
  | "payer_id"
  | "payment_date"
  | "amount_original"
  | "currency_original"
  | "exchange_rate"
  | "amount_inr"
  | "payment_method"
  | "payment_account_id"
  | "transaction_reference"
  | "notes"
>;

export type WorkerPaymentFormValues = Pick<
  WorkerPayment,
  | "assignment_worker_id"
  | "payment_date"
  | "amount"
  | "currency"
  | "payment_method"
  | "payment_account_id"
  | "transaction_reference"
  | "notes"
>;

export type PaymentActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};
