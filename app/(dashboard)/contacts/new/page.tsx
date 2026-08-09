import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ContactForm } from "@/components/contacts/contact-form";
import { PageHeader } from "@/components/layout/page-header";
import { createContact } from "@/lib/actions/contacts";

export const metadata: Metadata = { title: "New contact" };

export default function NewContactPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/contacts" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to contacts
      </Link>
      <PageHeader title="Add contact" description="Create one contact record and assign every role that applies." />
      <ContactForm action={createContact} submitLabel="Create contact" cancelHref="/contacts" />
    </div>
  );
}
