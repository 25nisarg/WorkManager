import { z } from "zod";
import { CONTACT_ROLE_VALUES } from "@/lib/constants/contacts";

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum, "This value is too long.");

export const contactRoleSchema = z.enum(CONTACT_ROLE_VALUES);

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(160, "Name must be 160 characters or fewer."),
  company_name: optionalText(160),
  email: optionalText(254).refine(
    (value) => !value || z.email().safeParse(value).success,
    "Enter a valid email address."
  ),
  phone: optionalText(40),
  whatsapp: optionalText(40),
  country: optionalText(100),
  preferred_currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Use a valid three-letter currency code."),
  roles: z.array(contactRoleSchema).min(1, "Select at least one role."),
  notes: optionalText(4000),
  is_active: z.enum(["active", "inactive"]).transform((value) => value === "active"),
});

export const contactIdSchema = z.uuid();

export type ContactInput = z.infer<typeof contactSchema>;
