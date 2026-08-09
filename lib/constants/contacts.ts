export const CONTACT_ROLES = [
  { value: "student", label: "Student" },
  { value: "vendor", label: "Vendor" },
  { value: "writer", label: "Writer" },
  { value: "freelancer", label: "Freelancer" },
  { value: "other", label: "Other" },
] as const;

export const CONTACT_ROLE_VALUES = CONTACT_ROLES.map((role) => role.value);

export const COMMON_CURRENCIES = [
  "INR",
  "AUD",
  "USD",
  "GBP",
  "EUR",
  "CAD",
  "NZD",
  "AED",
  "SGD",
] as const;
