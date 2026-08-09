import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { ContactDetails } from "@/components/contacts/contact-details";
import { ContactRoleBadges } from "@/components/contacts/contact-role-badges";
import { DeleteContactDialog } from "@/components/contacts/delete-contact-dialog";
import { DataError } from "@/components/ui/data-error";
import { getContact } from "@/lib/queries/contacts";
import { requireAuthenticatedOwnerId } from "@/lib/supabase/auth";
import { contactIdSchema } from "@/lib/validations/contact";

export const metadata: Metadata = { title: "Contact details" };

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!contactIdSchema.safeParse(id).success) notFound();

  const ownerId = await requireAuthenticatedOwnerId();
  const result = await getContact(ownerId, id);
  if (!result.error && !result.data) notFound();

  return (
    <div className="space-y-6">
      <Link href="/contacts" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to contacts
      </Link>

      {result.error || !result.data ? (
        <DataError message={result.error ?? "We could not load this contact."} />
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{result.data.name}</h1>
                <span className={"rounded-md border px-2 py-0.5 text-xs font-medium " + (result.data.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600")}>
                  {result.data.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{result.data.company_name || "Independent contact"}</p>
              <div className="mt-3"><ContactRoleBadges roles={result.data.roles} /></div>
            </div>
            <div className="flex gap-3">
              <Link href={"/contacts/" + result.data.id + "/edit"} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <Pencil aria-hidden="true" className="size-4" />
                Edit
              </Link>
              <DeleteContactDialog contactId={result.data.id} contactName={result.data.name} />
            </div>
          </div>
          <ContactDetails contact={result.data} />
        </>
      )}
    </div>
  );
}
