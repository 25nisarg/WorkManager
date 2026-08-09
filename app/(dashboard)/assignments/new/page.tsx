import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ContactRound } from "lucide-react";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { PageHeader } from "@/components/layout/page-header";
import { DataError } from "@/components/ui/data-error";
import { EmptyState } from "@/components/ui/empty-state";
import { createAssignment } from "@/lib/actions/assignments";
import { getAssignmentContacts } from "@/lib/queries/assignments";
import { requireAuthenticatedOwnerId } from "@/lib/supabase/auth";

export const metadata: Metadata = { title: "New assignment" };

export default async function NewAssignmentPage() {
  const ownerId = await requireAuthenticatedOwnerId();
  const contactResult = await getAssignmentContacts(ownerId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/assignments" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700">
        <ArrowLeft aria-hidden="true" className="size-4" /> Back to assignments
      </Link>
      <PageHeader
        title="Add assignment"
        description="Record assignment details, schedule, value, and workflow. The task ID is generated automatically."
      />
      {contactResult.error ? (
        <DataError message={contactResult.error} />
      ) : contactResult.data.length === 0 ? (
        <EmptyState
          icon={ContactRound}
          title="Add a contact first"
          description="An assignment must be linked to one of your contacts."
          action={{ label: "Add contact", href: "/contacts/new" }}
        />
      ) : (
        <AssignmentForm
          action={createAssignment}
          contacts={contactResult.data}
          submitLabel="Create assignment"
          cancelHref="/assignments"
        />
      )}
    </div>
  );
}
