export type Profile = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  phone: string | null;
  default_currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type SettingsActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};
