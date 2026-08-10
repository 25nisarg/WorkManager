import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness } from "lucide-react";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6"><div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-indigo-600" /><div className="w-full max-w-md"><div className="mb-8 flex items-center justify-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm"><BriefcaseBusiness aria-hidden="true" className="size-5" /></span><span className="text-lg font-semibold tracking-tight text-slate-950">Work Manager</span></div><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="forgot-heading"><div className="mb-7"><h1 id="forgot-heading" className="text-2xl font-semibold tracking-tight text-slate-950">Reset your password</h1><p className="mt-2 text-sm leading-6 text-slate-500">Enter your account email and we’ll send a secure recovery link.</p></div><ForgotPasswordForm /><Link href="/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"><ArrowLeft aria-hidden="true" className="size-4" />Back to sign in</Link></section></div></main>;
}
