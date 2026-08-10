"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, KeyRound, LoaderCircle, LogOut, Mail, ShieldCheck } from "lucide-react";
import { logout } from "@/app/(dashboard)/actions";
import { changePassword } from "@/lib/actions/settings";
import { Card } from "@/components/ui/card";

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 aria-[invalid=true]:border-red-400";

export function SecuritySection({ email }: { email: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(changePassword, {});
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <section aria-labelledby="security-heading" className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Account protection</p>
        <h2 id="security-heading" className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Security</h2>
        <p className="mt-1 text-sm text-slate-500">Manage credentials and access to your current session.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Mail aria-hidden="true" className="size-5" /></span>
            <div><h3 className="font-semibold text-slate-900">Account email</h3><p className="text-sm text-slate-500">Your authenticated Supabase account.</p></div>
          </div>
          <div className="p-5"><label htmlFor="account-email" className="block text-sm font-medium text-slate-700">Email address</label><input id="account-email" value={email} readOnly className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none" /></div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><KeyRound aria-hidden="true" className="size-5" /></span>
            <div><h3 className="font-semibold text-slate-900">Change password</h3><p className="text-sm text-slate-500">Use a unique password you do not reuse elsewhere.</p></div>
          </div>
          <form ref={formRef} action={formAction} className="space-y-4 p-5">
            {state.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>}
            {state.success && <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"><CheckCircle2 aria-hidden="true" className="size-4" />{state.success}</div>}
            <div className="space-y-2"><label htmlFor="new_password" className="block text-sm font-medium text-slate-700">New password</label><input id="new_password" name="new_password" type="password" autoComplete="new-password" required aria-invalid={Boolean(state.fieldErrors?.new_password)} className={fieldClass} />{state.fieldErrors?.new_password?.[0] && <p className="text-xs text-red-600">{state.fieldErrors.new_password[0]}</p>}</div>
            <div className="space-y-2"><label htmlFor="confirm_password" className="block text-sm font-medium text-slate-700">Confirm password</label><input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" required aria-invalid={Boolean(state.fieldErrors?.confirm_password)} className={fieldClass} />{state.fieldErrors?.confirm_password?.[0] && <p className="text-xs text-red-600">{state.fieldErrors.confirm_password[0]}</p>}</div>
            <p className="text-xs leading-5 text-slate-500">At least 10 characters with uppercase, lowercase, and a number.</p>
            <button type="submit" disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}{pending ? "Updating…" : "Update password"}</button>
          </form>
        </Card>
      </div>

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><ShieldCheck aria-hidden="true" className="size-5" /></span><div><h3 className="font-semibold text-slate-900">Current session</h3><p className="mt-1 text-sm leading-6 text-slate-500">Sign out on this browser when you have finished working.</p></div></div>
        <form action={logout}><button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"><LogOut aria-hidden="true" className="size-4" />Sign out</button></form>
      </Card>
    </section>
  );
}
