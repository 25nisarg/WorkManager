"use client";

import { useActionState } from "react";
import { CheckCircle2, LoaderCircle, UserRound } from "lucide-react";
import { updateProfile } from "@/lib/actions/settings";
import { COMMON_CURRENCIES } from "@/lib/constants/contacts";
import type { Profile } from "@/types/settings";
import { Card } from "@/components/ui/card";

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 aria-[invalid=true]:border-red-400";
const timezones = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <p className="text-xs text-red-600">{errors[0]}</p> : null;
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfile, {});
  const currency = state.values?.default_currency ?? profile.default_currency;
  const currencyOptions = COMMON_CURRENCIES.includes(
    currency as (typeof COMMON_CURRENCIES)[number]
  )
    ? COMMON_CURRENCIES
    : [currency, ...COMMON_CURRENCIES];
  const timezone = state.values?.timezone ?? profile.timezone;
  const timezoneOptions = timezones.includes(timezone)
    ? timezones
    : [timezone, ...timezones];

  return (
    <section aria-labelledby="profile-heading" className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Personalization</p>
        <h2 id="profile-heading" className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Profile</h2>
        <p className="mt-1 text-sm text-slate-500">Keep your personal and business defaults up to date.</p>
      </div>
      <Card className="overflow-hidden">
        <form action={formAction}>
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <UserRound aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h3 className="font-semibold text-slate-900">Profile details</h3>
              <p className="text-sm text-slate-500">These settings apply only to your account.</p>
            </div>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            {state.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 sm:col-span-2">{state.error}</div>}
            {state.success && <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700 sm:col-span-2"><CheckCircle2 aria-hidden="true" className="size-4" />{state.success}</div>}
            <div className="space-y-2">
              <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">Full name</label>
              <input id="full_name" name="full_name" autoComplete="name" defaultValue={state.values?.full_name ?? profile.full_name ?? ""} aria-invalid={Boolean(state.fieldErrors?.full_name)} className={fieldClass} />
              <FieldError errors={state.fieldErrors?.full_name} />
            </div>
            <div className="space-y-2">
              <label htmlFor="business_name" className="block text-sm font-medium text-slate-700">Business name</label>
              <input id="business_name" name="business_name" autoComplete="organization" defaultValue={state.values?.business_name ?? profile.business_name ?? ""} aria-invalid={Boolean(state.fieldErrors?.business_name)} className={fieldClass} />
              <FieldError errors={state.fieldErrors?.business_name} />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={state.values?.phone ?? profile.phone ?? ""} aria-invalid={Boolean(state.fieldErrors?.phone)} className={fieldClass} />
              <FieldError errors={state.fieldErrors?.phone} />
            </div>
            <div className="space-y-2">
              <label htmlFor="default_currency" className="block text-sm font-medium text-slate-700">Default currency</label>
              <select id="default_currency" name="default_currency" defaultValue={currency} aria-invalid={Boolean(state.fieldErrors?.default_currency)} className={fieldClass}>{currencyOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              <FieldError errors={state.fieldErrors?.default_currency} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="timezone" className="block text-sm font-medium text-slate-700">Timezone</label>
              <select id="timezone" name="timezone" defaultValue={timezone} aria-invalid={Boolean(state.fieldErrors?.timezone)} className={fieldClass}>{timezoneOptions.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select>
              <FieldError errors={state.fieldErrors?.timezone} />
            </div>
          </div>
          <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
            <button type="submit" disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}{pending ? "Saving…" : "Save profile"}</button>
          </div>
        </form>
      </Card>
    </section>
  );
}
