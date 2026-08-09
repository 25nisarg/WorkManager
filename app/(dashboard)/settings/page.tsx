import type { Metadata } from "next";
import { CreditCard, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PaymentAccountsSection } from "@/components/settings/payment-accounts-section";
import { DataError } from "@/components/ui/data-error";
import { getPaymentAccounts } from "@/lib/queries/expenses";
import { requireAuthenticatedOwnerId } from "@/lib/supabase/auth";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ownerId = await requireAuthenticatedOwnerId();
  const result = await getPaymentAccounts(ownerId);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Workspace" title="Settings" description="Configure transaction accounts while profile and security settings remain unchanged." />
      <nav className="flex overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="Settings sections">
        <span aria-current="page" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-indigo-50 px-4 text-sm font-semibold text-indigo-700"><CreditCard aria-hidden="true" className="size-4" />Payment accounts</span>
        <span aria-disabled="true" className="inline-flex h-10 shrink-0 items-center gap-2 px-4 text-sm font-medium text-slate-400"><UserRound aria-hidden="true" className="size-4" />Profile</span>
        <span aria-disabled="true" className="inline-flex h-10 shrink-0 items-center gap-2 px-4 text-sm font-medium text-slate-400"><ShieldCheck aria-hidden="true" className="size-4" />Security</span>
      </nav>
      {result.error ? <DataError message={result.error} /> : <PaymentAccountsSection accounts={result.accounts} />}
    </div>
  );
}
