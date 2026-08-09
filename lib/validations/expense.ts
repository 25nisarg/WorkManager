import { z } from "zod";
import { PAYMENT_ACCOUNT_TYPE_VALUES } from "@/lib/constants/expenses";

const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Use a valid three-letter currency code.");

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid expense date.")
  .refine(
    (value) => !Number.isNaN(Date.parse(value + "T00:00:00Z")),
    "Enter a valid expense date."
  );

const optionalUuid = (message: string) =>
  z.union([z.literal(""), z.uuid(message)]);

export const expenseSchema = z.object({
  assignment_id: optionalUuid("Select a valid assignment."),
  payment_account_id: optionalUuid("Select a valid payment account."),
  category: z
    .string()
    .trim()
    .min(1, "Category is required.")
    .max(100, "Category must be 100 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(500, "Description must be 500 characters or fewer."),
  amount: z.coerce
    .number()
    .finite()
    .positive("Amount must be greater than zero."),
  currency: currencySchema,
  expense_date: dateSchema,
  payment_method: z
    .string()
    .trim()
    .min(1, "Payment method is required.")
    .max(80, "Payment method is too long."),
  transaction_reference: z
    .string()
    .trim()
    .max(200, "Transaction reference is too long."),
  notes: z.string().trim().max(4000, "Notes must be 4000 characters or fewer."),
});

export const paymentAccountSchema = z.object({
  account_name: z
    .string()
    .trim()
    .min(1, "Account name is required.")
    .max(120, "Account name must be 120 characters or fewer."),
  account_type: z.enum(PAYMENT_ACCOUNT_TYPE_VALUES, {
    error: "Select a valid account type.",
  }),
  currency: currencySchema,
  notes: z.string().trim().max(2000, "Notes must be 2000 characters or fewer."),
  is_active: z.enum(["active", "inactive"]),
});

export const expenseIdSchema = z.uuid();

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type PaymentAccountInput = z.infer<typeof paymentAccountSchema>;
