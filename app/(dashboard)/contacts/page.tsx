import type { Metadata } from "next";
import Link from "next/link";
import { ContactRound, Plus } from "lucide-react";
import { ContactFilters } from "@/components/contacts/contact-filters";
import { ContactList } from "@/components/contacts/contact-list";
import { PageHeader } from "@/components/layout/page-header";
import { DataError } from "@/components/ui/data-error";
import { EmptyState } from "@/components/ui/empty-state";
import { CONTACT_ROLE_VALUES } from "@/lib/constants/contacts";
import { getContacts } from "@/lib/queries/contacts";
import { requireAuthenticatedOwnerId } from "@/lib/supabase/auth";

export const metadata: Metadata = { title: "Contacts" };

type QueryValue = string | string[] | undefined;
type ContactsPageProps = {
  searchParams: Promise<{ q?: QueryValue; role?: QueryValue; status?: QueryValue }>;
};

function first(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const ownerId = await requireAuthenticatedOwnerId();
  const params = await searchParams;
  const search = first(params.q)?.trim();
  const requestedRole = first(params.role);
  const role = CONTACT_ROLE_VALUES.includes(requestedRole as (typeof CONTACT_ROLE_VALUES)[number])
    ? requestedRole
    : undefined;
  const requestedStatus = first(params.status);
  const status = requestedStatus === "active" || requestedStatus === "inactive"
    ? requestedStatus
    : undefined;
  const result = await getContacts(ownerId, { search, role, status });
  const hasFilters = Boolean(search || role || status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader eyebrow="Directory" title="Contacts" description="Manage clients, vendors, writers, and freelancers in one place." />
        <Link href="/contacts/new" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
          <Plus aria-hidden="true" className="size-4" />
          Add contact
        </Link>
      </div>

      <ContactFilters search={search} role={role} status={status} />

      {result.error ? (
        <DataError message={result.error} />
      ) : result.data.length === 0 ? (
        <EmptyState
          icon={ContactRound}
          title={hasFilters ? "No matching contacts" : "No contacts yet"}
          description={hasFilters ? "Try changing or clearing your filters." : "Add your first contact to start organizing clients, vendors, writers, and freelancers."}
          action={hasFilters ? { label: "Clear filters", href: "/contacts" } : { label: "Add your first contact", href: "/contacts/new" }}
        />
      ) : (
        <>
          <p className="text-sm text-slate-500">{result.data.length} {result.data.length === 1 ? "contact" : "contacts"}</p>
          <ContactList contacts={result.data} />
        </>
      )}
    </div>
  );
}
