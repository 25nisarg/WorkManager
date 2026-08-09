import type { CONTACT_ROLE_VALUES } from "@/lib/constants/contacts";

export type ContactRole = (typeof CONTACT_ROLE_VALUES)[number];

export type Contact = {
  id: string;
  owner_id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  country: string | null;
  preferred_currency: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles: ContactRole[];
};

export type ContactFormValues = Pick<
  Contact,
  | "name"
  | "company_name"
  | "email"
  | "phone"
  | "whatsapp"
  | "country"
  | "preferred_currency"
  | "notes"
  | "is_active"
  | "roles"
>;

export type ContactActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string | string[]>;
};
