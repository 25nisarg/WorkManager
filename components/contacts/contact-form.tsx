"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { COMMON_CURRENCIES, CONTACT_ROLES } from "@/lib/constants/contacts";
import type { ContactActionState, ContactFormValues } from "@/types/contact";

type ContactFormProps = {
  action: (
    state: ContactActionState,
    formData: FormData
  ) => Promise<ContactActionState>;
  initialValues?: ContactFormValues;
  submitLabel: string;
  cancelHref: string;
};

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string[];
};

function Field({ label, name, type = "text", autoComplete, placeholder, defaultValue, error }: FieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? name + "-error" : undefined}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:ring-red-500/10"
      />
      {error && <p id={name + "-error"} className="text-xs text-red-600">{error[0]}</p>}
    </div>
  );
}

function asText(value: string | string[] | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function ContactForm({ action, initialValues, submitLabel, cancelHref }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const submitted = state.values;
  const selectedRoles = Array.isArray(submitted?.roles)
    ? submitted.roles
    : initialValues?.roles ?? [];
  const currentCurrency = asText(
    submitted?.preferred_currency,
    initialValues?.preferred_currency ?? "INR"
  );
  const currencyOptions = COMMON_CURRENCIES.includes(
    currentCurrency as (typeof COMMON_CURRENCIES)[number]
  )
    ? COMMON_CURRENCIES
    : [currentCurrency, ...COMMON_CURRENCIES];

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="contact-basics">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 id="contact-basics" className="font-semibold text-slate-900">Contact details</h2>
          <p className="mt-1 text-sm text-slate-500">Basic identity and communication information.</p>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <Field
            label="Name *"
            name="name"
            autoComplete="name"
            placeholder="Full name"
            defaultValue={asText(submitted?.name, initialValues?.name)}
            error={state.fieldErrors?.name}
          />
          <Field
            label="Company name"
            name="company_name"
            autoComplete="organization"
            placeholder="Company or institution"
            defaultValue={asText(submitted?.company_name, initialValues?.company_name ?? "")}
            error={state.fieldErrors?.company_name}
          />
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            defaultValue={asText(submitted?.email, initialValues?.email ?? "")}
            error={state.fieldErrors?.email}
          />
          <Field
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            defaultValue={asText(submitted?.phone, initialValues?.phone ?? "")}
            error={state.fieldErrors?.phone}
          />
          <Field
            label="WhatsApp"
            name="whatsapp"
            type="tel"
            placeholder="+91 98765 43210"
            defaultValue={asText(submitted?.whatsapp, initialValues?.whatsapp ?? "")}
            error={state.fieldErrors?.whatsapp}
          />
          <Field
            label="Country"
            name="country"
            autoComplete="country-name"
            placeholder="India"
            defaultValue={asText(submitted?.country, initialValues?.country ?? "")}
            error={state.fieldErrors?.country}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="contact-settings">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 id="contact-settings" className="font-semibold text-slate-900">Roles and preferences</h2>
          <p className="mt-1 text-sm text-slate-500">A contact can hold more than one role.</p>
        </div>
        <div className="space-y-6 p-5">
          <fieldset>
            <legend className="text-sm font-medium text-slate-700">Roles *</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CONTACT_ROLES.map((role) => (
                <label key={role.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50/40">
                  <input
                    type="checkbox"
                    name="roles"
                    value={role.value}
                    defaultChecked={selectedRoles.includes(role.value)}
                    className="size-4 rounded border-slate-300 accent-indigo-600"
                  />
                  {role.label}
                </label>
              ))}
            </div>
            {state.fieldErrors?.roles && <p className="mt-2 text-xs text-red-600">{state.fieldErrors.roles[0]}</p>}
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="preferred_currency" className="block text-sm font-medium text-slate-700">Preferred currency</label>
              <select
                id="preferred_currency"
                name="preferred_currency"
                defaultValue={currentCurrency}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                {currencyOptions.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
              {state.fieldErrors?.preferred_currency && <p className="text-xs text-red-600">{state.fieldErrors.preferred_currency[0]}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="is_active" className="block text-sm font-medium text-slate-700">Status</label>
              <select
                id="is_active"
                name="is_active"
                defaultValue={asText(submitted?.is_active, initialValues?.is_active === false ? "inactive" : "active")}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={5}
              placeholder="Add useful context about this contact…"
              defaultValue={asText(submitted?.notes, initialValues?.notes ?? "")}
              aria-invalid={Boolean(state.fieldErrors?.notes)}
              className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 aria-[invalid=true]:border-red-400"
            />
            {state.fieldErrors?.notes && <p className="text-xs text-red-600">{state.fieldErrors.notes[0]}</p>}
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
