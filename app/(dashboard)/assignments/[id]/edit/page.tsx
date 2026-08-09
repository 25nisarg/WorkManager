import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { PageHeader } from "@/components/layout/page-header";
import { DataError } from "@/components/ui/data-error";
import { updateAssignment } from "@/lib/actions/assignments";
import {
  getAssignment,
  getAssignmentContacts,
} from "@/lib/queries/assignments";
import { requireAuthenticatedOwnerId } from "@/lib/supabase/auth";
import { assignmentIdSchema } from "@/lib/validations/assignment";

export const metadata: Metadata = { title: "Edit assignment" };

export default async function EditAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!assignmentIdSchema.safeParse(id).success) notFound();

  const ownerId = await requireAuthenticatedOwnerId();
  const [assignmentResult, contactResult] = await Promise.all([
    getAssignment(ownerId, id),
    getAssignmentContacts(ownerId),
  ]);
  if (!assignmentResult.error && !assignmentResult.assignment) notFound();

  const action = updateAssignment.bind(null, id);
  const error = assignmentResult.error || contactResult.error;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href={"/assignments/" + id} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700">
        <ArrowLeft aria-hidden="true" className="size-4" /> Back to assignment
      </Link>
      {error || !assignmentResult.assignment ? (
        <DataError message={error ?? "We could not load this assignment."} />
      ) : (
        <>
          <PageHeader
            title="Edit assignment"
            description={"Update " + assignmentResult.assignment.task_code + " without changing its generated task ID."}
          />
          <AssignmentForm
            action={action}
            contacts={contactResult.data}
            initialValues={assignmentResult.assignment}
            submitLabel="Save changes"
            cancelHref={"/assignments/" + id}
          />
        </>
      )}
    </div>
  );
}
