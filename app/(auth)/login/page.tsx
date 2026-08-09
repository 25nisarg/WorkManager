import type { Metadata } from "next";
import { BriefcaseBusiness } from "lucide-react";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-indigo-600" />
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <BriefcaseBusiness aria-hidden="true" className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-950">Freelance Manager</span>
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
          <LoginForm />
        </section>

        <p className="mt-6 text-center text-xs text-slate-500">
          Secure access powered by Supabase authentication
        </p>
      </div>
    </main>
  );
}
