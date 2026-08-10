"use client";

import { useActionState } from "react";
import { CheckCircle2, LoaderCircle, Mail } from "lucide-react";
import { requestPasswordReset } from "./actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, {});
  return <form action={formAction} className="space-y-5">
    {state.success ? <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm leading-6 text-emerald-700"><CheckCircle2 aria-hidden="true" className="mt-1 size-4 shrink-0" />{state.success}</div> : <div className="space-y-2"><label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label><div className="relative"><Mail aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email ?? ""} placeholder="you@example.com" aria-invalid={Boolean(state.fieldErrors?.email)} className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-950 caret-indigo-600 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 aria-[invalid=true]:border-red-400" /></div>{state.fieldErrors?.email?.[0] && <p className="text-xs text-red-600">{state.fieldErrors.email[0]}</p>}</div>}
    {state.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{state.error}</div>}
    {!state.success && <button type="submit" disabled={pending} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}{pending ? "Sending…" : "Send reset link"}</button>}
  </form>;
}
