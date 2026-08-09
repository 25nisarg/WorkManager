import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ContactForm } from "@/components/contacts/contact-form";
import { PageHeader } from "@/components/layout/page-header";
import { DataError } from "@/components/ui/data-error";
import { updateContact } from "@/lib/actions/contacts";
import { getContact } from "@/lib/queries/contacts";
import { requireAuthenticatedOwnerId } from "@/lib/supabase/auth";
import { contactIdSchema } from "@/lib/validations/contact";

export const metadata: Metadata = { title: "Edit contact" };

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!contactIdSchema.safeParse(id).success) notFound();

  const ownerId = await requireAuthenticatedOwnerId();
  const result = await getContact(ownerId, id);
  if (!result.error && !result.data) notFound();

  const action = updateContact.bind(null, id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href={"/contacts/" + id} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to contact
      </Link>
      {result.error || !result.data ? (
        <DataError message={result.error ?? "We could not load this contact."} />
      ) : (
        <>
          <PageHeader title="Edit contact" description="Update contact information, roles, preferences, and status." />
          <ContactForm action={action} initialValues={result.data} submitLabel="Save changes" cancelHref={"/contacts/" + id} />
        </>
      )}
    </div>
  );
}
