"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import {
  ASSIGNMENT_PRIORITIES,
  ASSIGNMENT_STATUSES,
  PRICING_TYPES,
  WORK_MODES,
} from "@/lib/constants/assignments";
import { COMMON_CURRENCIES } from "@/lib/constants/contacts";
import type {
  AssignmentActionState,
  AssignmentContact,
  AssignmentFormValues,
} from "@/types/assignment";

type AssignmentFormProps = {
  action: (
    state: AssignmentActionState,
    formData: FormData
  ) => Promise<AssignmentActionState>;
  contacts: AssignmentContact[];
  initialValues?: AssignmentFormValues;
  submitLabel: string;
  cancelHref: string;
};

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  min?: string;
  step?: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string[];
};

const inputClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:ring-red-500/10";

function Field({
  label,
  name,
  type = "text",
  min,
  step,
  placeholder,
  defaultValue,
  error,
}: FieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        min={min}
        step={step}
        placeholder={placeholder}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? name + "-error" : undefined}
        className={inputClass}
      />
      {error && <p id={name + "-error"} className="text-xs text-red-600">{error[0]}</p>}
    </div>
  );
}

function asText(value: string | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toLocalDeadlineInput(value: string) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localTime = date.getTime() - date.getTimezoneOffset() * 60 * 1000;
  return new Date(localTime).toISOString().slice(0, 16);
}

function todayInputValue() {
  const now = new Date();
  const localTime = now.getTime() - now.getTimezoneOffset() * 60 * 1000;
  return new Date(localTime).toISOString().slice(0, 10);
}

function inferPricingType(initialValues?: AssignmentFormValues) {
  if (!initialValues || initialValues.price_per_copy <= 0) return "total";

  const calculated =
    Math.round(
      (initialValues.number_of_copies * initialValues.price_per_copy +
        Number.EPSILON) *
        100
    ) / 100;

  return Math.abs(calculated - initialValues.selling_price) <= 0.009
    ? "per_copy"
    : "total";
}

export function AssignmentForm({
  action,
  contacts,
  initialValues,
  submitLabel,
  cancelHref,
}: AssignmentFormProps) {
  const actionWithTimezone = (
    state: AssignmentActionState,
    formData: FormData
  ) => {
    formData.set("timezone_offset", String(new Date().getTimezoneOffset()));
    return action(state, formData);
  };
  const [state, formAction, pending] = useActionState(actionWithTimezone, {});
  const submitted = state.values;
  const [pricingType, setPricingType] = useState<"total" | "per_copy">(
    submitted?.pricing_type === "per_copy"
      ? "per_copy"
      : inferPricingType(initialValues)
  );
  const [numberOfCopies, setNumberOfCopies] = useState(
    asText(
      submitted?.number_of_copies,
      String(initialValues?.number_of_copies ?? 1)
    )
  );
  const [pricePerCopy, setPricePerCopy] = useState(
    asText(
      submitted?.price_per_copy,
      String(initialValues?.price_per_copy ?? 0)
    )
  );
  const [totalSellingPrice, setTotalSellingPrice] = useState(
    asText(
      submitted?.selling_price,
      String(initialValues?.selling_price ?? 0)
    )
  );
  const calculatedSellingPrice =
    Math.round(
      ((Number(numberOfCopies) || 0) * (Number(pricePerCopy) || 0) +
        Number.EPSILON) *
        100
    ) / 100;
  const currentCurrency = asText(
    submitted?.currency,
    initialValues?.currency ?? "INR"
  );
  const [currency, setCurrency] = useState(currentCurrency);
  const currencyOptions = COMMON_CURRENCIES.includes(
    currentCurrency as (typeof COMMON_CURRENCIES)[number]
  )
    ? COMMON_CURRENCIES
    : [currentCurrency, ...COMMON_CURRENCIES];
  const selectClass =
    "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="assignment-details">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 id="assignment-details" className="font-semibold text-slate-900">Assignment details</h2>
          <p className="mt-1 text-sm text-slate-500">Core information about the work received.</p>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Title *" name="title" placeholder="Assignment title" defaultValue={asText(submitted?.title, initialValues?.title)} error={state.fieldErrors?.title} />
          </div>
          <Field label="Subject" name="subject" placeholder="Subject or discipline" defaultValue={asText(submitted?.subject, initialValues?.subject ?? "")} error={state.fieldErrors?.subject} />
          <Field label="Assessment name" name="assessment_name" placeholder="Report, dissertation, presentation…" defaultValue={asText(submitted?.assessment_name, initialValues?.assessment_name ?? "")} error={state.fieldErrors?.assessment_name} />
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="received_from_id" className="block text-sm font-medium text-slate-700">Received from *</label>
            <select
              id="received_from_id"
              name="received_from_id"
              defaultValue={asText(submitted?.received_from_id, initialValues?.received_from_id)}
              aria-invalid={Boolean(state.fieldErrors?.received_from_id)}
              className={selectClass}
            >
              <option value="" disabled>Select a contact</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}{contact.company_name ? " — " + contact.company_name : ""}{!contact.is_active ? " (Inactive)" : ""}
                </option>
              ))}
            </select>
            {state.fieldErrors?.received_from_id && <p className="text-xs text-red-600">{state.fieldErrors.received_from_id[0]}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="assignment-schedule">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 id="assignment-schedule" className="font-semibold text-slate-900">Schedule</h2>
          <p className="mt-1 text-sm text-slate-500">When the work was received and when it is due.</p>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-3">
          <Field label="Received date *" name="received_date" type="date" defaultValue={asText(submitted?.received_date, initialValues?.received_date ?? todayInputValue())} error={state.fieldErrors?.received_date} />
          <div className="sm:col-span-2">
            <Field
              label="Client deadline *"
              name="client_deadline"
              type="datetime-local"
              defaultValue={toLocalDeadlineInput(asText(submitted?.client_deadline, initialValues?.client_deadline))}
              error={state.fieldErrors?.client_deadline}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="assignment-financial">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 id="assignment-financial" className="font-semibold text-slate-900">Financial</h2>
          <p className="mt-1 text-sm text-slate-500">Agreed assignment value and copy pricing.</p>
        </div>
        <div className="space-y-5 p-5">
          <fieldset>
            <legend className="text-sm font-medium text-slate-700">Pricing type</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {PRICING_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition " +
                    (pricingType === type.value
                      ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                      : "border-slate-200 text-slate-700 hover:border-slate-300")
                  }
                >
                  <input
                    type="radio"
                    name="pricing_type"
                    value={type.value}
                    checked={pricingType === type.value}
                    onChange={() => setPricingType(type.value)}
                    className="size-4 accent-indigo-600"
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </fieldset>

          {pricingType === "total" ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="selling_price" className="block text-sm font-medium text-slate-700">Selling price *</label>
                <input
                  id="selling_price"
                  name="selling_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalSellingPrice}
                  onChange={(event) => setTotalSellingPrice(event.target.value)}
                  aria-invalid={Boolean(state.fieldErrors?.selling_price)}
                  className={inputClass}
                />
                {state.fieldErrors?.selling_price && <p className="text-xs text-red-600">{state.fieldErrors.selling_price[0]}</p>}
              </div>
              <input type="hidden" name="number_of_copies" value="1" />
              <input type="hidden" name="price_per_copy" value="0" />
              <div className="space-y-2">
                <label htmlFor="currency" className="block text-sm font-medium text-slate-700">Currency</label>
                <select id="currency" name="currency" value={currency} onChange={(event) => setCurrency(event.target.value)} className={selectClass}>
                  {currencyOptions.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                </select>
                {state.fieldErrors?.currency && <p className="text-xs text-red-600">{state.fieldErrors.currency[0]}</p>}
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label htmlFor="number_of_copies" className="block text-sm font-medium text-slate-700">Number of copies *</label>
                <input
                  id="number_of_copies"
                  name="number_of_copies"
                  type="number"
                  min="1"
                  step="1"
                  value={numberOfCopies}
                  onChange={(event) => setNumberOfCopies(event.target.value)}
                  aria-invalid={Boolean(state.fieldErrors?.number_of_copies)}
                  className={inputClass}
                />
                {state.fieldErrors?.number_of_copies && <p className="text-xs text-red-600">{state.fieldErrors.number_of_copies[0]}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="price_per_copy" className="block text-sm font-medium text-slate-700">Price per copy *</label>
                <input
                  id="price_per_copy"
                  name="price_per_copy"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricePerCopy}
                  onChange={(event) => setPricePerCopy(event.target.value)}
                  aria-invalid={Boolean(state.fieldErrors?.price_per_copy)}
                  className={inputClass}
                />
                {state.fieldErrors?.price_per_copy && <p className="text-xs text-red-600">{state.fieldErrors.price_per_copy[0]}</p>}
              </div>
              <div className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">Total selling price</span>
                <output className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900">
                  {currency} {calculatedSellingPrice.toFixed(2)}
                </output>
                <input
                  type="hidden"
                  name="selling_price"
                  value={calculatedSellingPrice.toFixed(2)}
                />
                {state.fieldErrors?.selling_price && <p className="text-xs text-red-600">{state.fieldErrors.selling_price[0]}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="currency" className="block text-sm font-medium text-slate-700">Currency</label>
                <select id="currency" name="currency" value={currency} onChange={(event) => setCurrency(event.target.value)} className={selectClass}>
                  {currencyOptions.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                </select>
                {state.fieldErrors?.currency && <p className="text-xs text-red-600">{state.fieldErrors.currency[0]}</p>}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="assignment-workflow">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 id="assignment-workflow" className="font-semibold text-slate-900">Workflow</h2>
          <p className="mt-1 text-sm text-slate-500">Current status, priority, and delivery approach.</p>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="status" className="block text-sm font-medium text-slate-700">Status</label>
            <select id="status" name="status" defaultValue={asText(submitted?.status, initialValues?.status ?? "new")} className={selectClass}>
              {ASSIGNMENT_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="priority" className="block text-sm font-medium text-slate-700">Priority</label>
            <select id="priority" name="priority" defaultValue={asText(submitted?.priority, initialValues?.priority ?? "normal")} className={selectClass}>
              {ASSIGNMENT_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="work_mode" className="block text-sm font-medium text-slate-700">Work mode</label>
            <select id="work_mode" name="work_mode" defaultValue={asText(submitted?.work_mode, initialValues?.work_mode ?? "self")} className={selectClass}>
              {WORK_MODES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="assignment-context">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 id="assignment-context" className="font-semibold text-slate-900">Description and notes</h2>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          {[
            { name: "description", label: "Description", placeholder: "Scope, deliverables, and requirements…", value: asText(submitted?.description, initialValues?.description ?? "") },
            { name: "notes", label: "Internal notes", placeholder: "Private context and reminders…", value: asText(submitted?.notes, initialValues?.notes ?? "") },
          ].map((field) => (
            <div key={field.name} className="space-y-2">
              <label htmlFor={field.name} className="block text-sm font-medium text-slate-700">{field.label}</label>
              <textarea id={field.name} name={field.name} rows={6} placeholder={field.placeholder} defaultValue={field.value} className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
              {state.fieldErrors?.[field.name] && <p className="text-xs text-red-600">{state.fieldErrors[field.name]?.[0]}</p>}
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</Link>
        <button type="submit" disabled={pending} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
          {pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
