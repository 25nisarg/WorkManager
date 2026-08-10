import type { Metadata } from "next";
import { BriefcaseBusiness } from "lucide-react";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

type Props = {
  searchParams: Promise<{ password_reset?: string; auth_error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-indigo-600" />
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <BriefcaseBusiness aria-hidden="true" className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-950">Work Manager</span>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="login-heading">
          <div className="mb-7">
            <h1 id="login-heading" className="text-2xl font-semibold tracking-tight text-slate-950">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in to manage your work, deadlines, and finances.
            </p>
          </div>
          {params.password_reset === "success" && (
            <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
              Your password was reset. Sign in with your new password.
            </div>
          )}
          {params.auth_error === "invalid_link" && (
            <div role="alert" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
              That authentication link is invalid or has expired. Request a new password reset link.
            </div>
          )}
          <LoginForm />
        </section>

        <p className="mt-6 text-center text-xs text-slate-500">
          Secure access powered by Supabase authentication
        </p>
      </div>
    </main>
  );
}
