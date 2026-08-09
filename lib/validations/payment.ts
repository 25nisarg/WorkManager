import { z } from "zod";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid payment date.")
  .refine(
    (value) => !Number.isNaN(Date.parse(value + "T00:00:00Z")),
    "Enter a valid payment date."
  );

const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Use a valid three-letter currency code.");

const optionalUuid = z.union([z.literal(""), z.uuid("Select a valid account.")]);

const commonPaymentFields = {
  payment_date: dateSchema,
  payment_method: z
    .string()
    .trim()
    .min(1, "Payment method is required.")
    .max(80, "Payment method is too long."),
  payment_account_id: optionalUuid,
  transaction_reference: z
    .string()
    .trim()
    .max(200, "Transaction reference is too long."),
  notes: z.string().trim().max(4000, "Notes must be 4000 characters or fewer."),
};

export const clientPaymentSchema = z.object({
  assignment_id: z.uuid("Select a valid assignment."),
  payer_id: z.uuid("Select a valid payer."),
  amount_original: z.coerce
    .number()
    .finite()
    .positive("Original amount must be greater than zero."),
  currency_original: currencySchema,
  exchange_rate: z.union([
    z.literal(""),
    z.coerce.number().finite().positive("Exchange rate must be greater than zero."),
  ]),
  amount_inr: z.coerce
    .number()
    .finite()
    .positive("Actual INR received must be greater than zero."),
  ...commonPaymentFields,
});

export const workerPaymentSchema = z.object({
  assignment_worker_id: z.uuid("Select a valid writer allocation."),
  amount: z.coerce
    .number()
    .finite()
    .positive("Payment amount must be greater than zero."),
  currency: currencySchema,
  ...commonPaymentFields,
});

export const paymentIdSchema = z.uuid();

export type ClientPaymentInput = z.infer<typeof clientPaymentSchema>;
export type WorkerPaymentInput = z.infer<typeof workerPaymentSchema>;
