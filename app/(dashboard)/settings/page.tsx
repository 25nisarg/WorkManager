import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PaymentAccountsSection } from "@/components/settings/payment-accounts-section";
import { ProfileForm } from "@/components/settings/profile-form";
import { SecuritySection } from "@/components/settings/security-section";
import { DataError } from "@/components/ui/data-error";
import { getPaymentAccounts } from "@/lib/queries/expenses";
import { getProfile } from "@/lib/queries/settings";
import { requireAuthenticatedOwnerId } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

type QueryValue = string | string[] | undefined;
type Props = { searchParams: Promise<{ section?: QueryValue }> };
type Section = "profile" | "accounts" | "security";

const sections = [
  { value: "profile", label: "Profile", icon: UserRound },
  { value: "accounts", label: "Payment accounts", icon: CreditCard },
  { value: "security", label: "Security", icon: ShieldCheck },
] as const;

export default async function SettingsPage({ searchParams }: Props) {
  const ownerId = await requireAuthenticatedOwnerId();
  const rawSection = (await searchParams).section;
  const requested = Array.isArray(rawSection) ? rawSection[0] : rawSection;
  const section: Section = sections.some((item) => item.value === requested)
    ? (requested as Section)
    : "profile";

  const profileResult = section === "profile" ? await getProfile(ownerId) : null;
  const accountsResult = section === "accounts" ? await getPaymentAccounts(ownerId) : null;
  let email = "Account";
  if (section === "security") {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? "Email unavailable";
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Workspace" title="Settings" description="Manage your profile, transaction accounts, and account security." />
      <nav className="flex overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="Settings sections">
        {sections.map((item) => {
          const Icon = item.icon;
          const active = section === item.value;
          return <Link key={item.value} href={`/settings?section=${item.value}`} aria-current={active ? "page" : undefined} className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm transition ${active ? "bg-indigo-50 font-semibold text-indigo-700" : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><Icon aria-hidden="true" className="size-4" />{item.label}</Link>;
        })}
      </nav>
      {section === "profile" && (profileResult?.error || !profileResult?.profile ? <DataError message={profileResult?.error ?? "We could not load your profile."} /> : <ProfileForm profile={profileResult.profile} />)}
      {section === "accounts" && (accountsResult?.error ? <DataError message={accountsResult.error} /> : <PaymentAccountsSection accounts={accountsResult?.accounts ?? []} />)}
      {section === "security" && <SecuritySection email={email} />}
    </div>
  );
}
