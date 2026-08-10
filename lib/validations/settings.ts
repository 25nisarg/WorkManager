import { z } from "zod";

const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Use a valid three-letter currency code.");

const passwordFields = z.object({
  new_password: z
    .string()
    .min(10, "Use at least 10 characters.")
    .max(72, "Password must be 72 characters or fewer.")
    .regex(/[a-z]/, "Include a lowercase letter.")
    .regex(/[A-Z]/, "Include an uppercase letter.")
    .regex(/[0-9]/, "Include a number."),
  confirm_password: z.string(),
});

export const passwordSchema = passwordFields.refine(
  (value) => value.new_password === value.confirm_password,
  { path: ["confirm_password"], message: "Passwords do not match." }
);

export const emailSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
});

export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .max(120, "Full name must be 120 characters or fewer."),
  business_name: z
    .string()
    .trim()
    .max(160, "Business name must be 160 characters or fewer."),
  phone: z
    .string()
    .trim()
    .max(40, "Phone number must be 40 characters or fewer."),
  default_currency: currencySchema,
  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required.")
    .max(100, "Timezone is too long.")
    .refine((value) => {
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
        return true;
      } catch {
        return false;
      }
    }, "Select a valid timezone."),
});

export type ProfileInput = z.infer<typeof profileSchema>;
