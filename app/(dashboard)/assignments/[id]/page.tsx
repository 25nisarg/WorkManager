import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import {
  AssignmentPriorityBadge,
  AssignmentStatusBadge,
  WorkModeBadge,
} from "@/components/assignments/assignment-badges";
import { AssignmentDetails } from "@/components/assignments/assignment-details";
import { AssignmentWriterSection } from "@/components/assignments/assignment-writer-section";
import { DeleteAssignmentDialog } from "@/components/assignments/delete-assignment-dialog";
import { DataError } from "@/components/ui/data-error";
import { getAssignment } from "@/lib/queries/assignments";
import { getAssignmentWorkers } from "@/lib/queries/assignment-workers";
import { requireAuthenticatedOwnerId } from "@/lib/supabase/auth";
import { assignmentIdSchema } from "@/lib/validations/assignment";

export const metadata: Metadata = { title: "Assignment details" };

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!assignmentIdSchema.safeParse(id).success) notFound();

  const ownerId = await requireAuthenticatedOwnerId();
  const [result, workerResult] = await Promise.all([
    getAssignment(ownerId, id),
    getAssignmentWorkers(ownerId, id),
  ]);
  if (!result.error && !result.assignment) notFound();

  return (
    <div className="space-y-6">
      <Link href="/assignments" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700">
        <ArrowLeft aria-hidden="true" className="size-4" /> Back to assignments
      </Link>

      {result.error || !result.assignment ? (
        <DataError message={result.error ?? "We could not load this assignment."} />
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-xs font-semibold tracking-wide text-indigo-700">{result.assignment.task_code}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{result.assignment.title}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <AssignmentStatusBadge status={result.assignment.status} />
                <AssignmentPriorityBadge priority={result.assignment.priority} />
                <WorkModeBadge workMode={result.assignment.work_mode} />
              </div>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link href={"/assignments/" + id + "/edit"} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <Pencil aria-hidden="true" className="size-4" /> Edit
              </Link>
              <DeleteAssignmentDialog assignmentId={id} taskCode={result.assignment.task_code} />
            </div>
          </div>
          <AssignmentWriterSection
            assignment={result.assignment}
            allocations={workerResult.data.allocations}
            eligibleWriters={workerResult.data.eligibleWriters}
            financialSummary={result.financialSummary}
            error={workerResult.error}
          />
          <AssignmentDetails
            assignment={result.assignment}
            financialSummary={result.financialSummary}
            financialError={result.financialError}
          />
        </>
      )}
    </div>
  );
}
