import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Set new password" };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6"><div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-indigo-600" /><div className="w-full max-w-md"><div className="mb-8 flex items-center justify-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm"><BriefcaseBusiness aria-hidden="true" className="size-5" /></span><span className="text-lg font-semibold tracking-tight text-slate-950">Work Manager</span></div><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="reset-heading"><div className="mb-7"><h1 id="reset-heading" className="text-2xl font-semibold tracking-tight text-slate-950">Choose a new password</h1><p className="mt-2 text-sm leading-6 text-slate-500">Set a strong, unique password for your account.</p></div>{data.user ? <ResetPasswordForm /> : <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">This reset link is invalid or has expired. <Link href="/forgot-password" className="font-semibold underline">Request a new link</Link>.</div>}</section></div></main>;
}
