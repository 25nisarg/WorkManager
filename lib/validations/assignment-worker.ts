import { z } from "zod";
import { ASSIGNMENT_WORKER_STATUS_VALUES } from "@/lib/constants/assignment-workers";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid assigned date.")
  .refine(
    (value) => !Number.isNaN(Date.parse(value + "T00:00:00Z")),
    "Enter a valid assigned date."
  );

const dateTimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    "Enter a valid date and time."
  )
  .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date and time.");

export const assignmentWorkerSchema = z
  .object({
    worker_id: z.uuid("Select a valid writer."),
    work_description: z
      .string()
      .trim()
      .min(1, "Work description is required.")
      .max(2000, "Work description must be 2000 characters or fewer."),
    assigned_date: dateSchema,
    worker_deadline: dateTimeSchema,
    agreed_cost: z.coerce
      .number()
      .finite()
      .min(0, "Agreed cost cannot be negative."),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "Use a valid three-letter currency code."),
    status: z.enum(ASSIGNMENT_WORKER_STATUS_VALUES),
    delivered_at: z.union([z.literal(""), dateTimeSchema]),
    timezone_offset: z.coerce
      .number()
      .int()
      .min(-840)
      .max(840)
      .default(0),
    notes: z
      .string()
      .trim()
      .max(4000, "Notes must be 4000 characters or fewer."),
  })
  .superRefine((value, context) => {
    if (value.worker_deadline.slice(0, 10) < value.assigned_date) {
      context.addIssue({
        code: "custom",
        path: ["worker_deadline"],
        message: "Writer deadline cannot be before the assigned date.",
      });
    }
  });

export const assignmentWorkerIdSchema = z.uuid();

export type AssignmentWorkerInput = z.infer<typeof assignmentWorkerSchema>;
