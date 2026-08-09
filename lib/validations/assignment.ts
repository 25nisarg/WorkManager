import { z } from "zod";
import {
  ASSIGNMENT_PRIORITY_VALUES,
  ASSIGNMENT_STATUS_VALUES,
  WORK_MODE_VALUES,
} from "@/lib/constants/assignments";

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum, "This value is too long.");

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
  .refine((value) => !Number.isNaN(Date.parse(value + "T00:00:00Z")), "Enter a valid date.");

const localDateTimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    "Enter a valid deadline date and time."
  )
  .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid deadline.");

export const assignmentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(240, "Title must be 240 characters or fewer."),
  subject: optionalText(160),
  assessment_name: optionalText(200),
  received_from_id: z.uuid("Select a valid contact."),
  received_date: dateSchema,
  client_deadline: localDateTimeSchema,
  timezone_offset: z.coerce
    .number()
    .int()
    .min(-840)
    .max(840)
    .default(0),
  number_of_copies: z.coerce
    .number()
    .int("Number of copies must be a whole number.")
    .min(1, "Number of copies must be at least 1."),
  pricing_type: z.enum(["total", "per_copy"]),
  price_per_copy: z.coerce
    .number()
    .finite()
    .min(0, "Price per copy cannot be negative."),
  selling_price: z.coerce
    .number()
    .finite()
    .min(0, "Selling price cannot be negative."),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Use a valid three-letter currency code."),
  status: z.enum(ASSIGNMENT_STATUS_VALUES),
  priority: z.enum(ASSIGNMENT_PRIORITY_VALUES),
  work_mode: z.enum(WORK_MODE_VALUES),
  description: optionalText(10000),
  notes: optionalText(10000),
}).superRefine((value, context) => {
  if (value.client_deadline.slice(0, 10) < value.received_date) {
    context.addIssue({
      code: "custom",
      path: ["client_deadline"],
      message: "Client deadline cannot be before the received date.",
    });
  }

  if (value.pricing_type === "per_copy") {
    const calculatedTotal =
      Math.round(
        (value.number_of_copies * value.price_per_copy + Number.EPSILON) * 100
      ) / 100;

    if (Math.abs(calculatedTotal - value.selling_price) > 0.009) {
      context.addIssue({
        code: "custom",
        path: ["selling_price"],
        message: "Selling price must match copies multiplied by price per copy.",
      });
    }
  }
});

export const assignmentIdSchema = z.uuid();

export type AssignmentInput = z.infer<typeof assignmentSchema>;
