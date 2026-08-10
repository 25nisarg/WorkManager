import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import {
  AssignmentPriorityBadge,
  AssignmentStatusBadge,
  WorkModeBadge,
} from "@/components/assignments/assignment-badges";
import { AssignmentFinancialSummary, AssignmentNotes, AssignmentOverview } from "@/components/assignments/assignment-workflow-details";
import { AssignmentWriterSection } from "@/components/assignments/assignment-writer-section";
import { AssignmentClientPaymentsSection, AssignmentWriterPaymentsSection } from "@/components/payments/assignment-payments-section";
import { AssignmentExpensesSection } from "@/components/expenses/assignment-expenses-section";
import { DeleteAssignmentDialog } from "@/components/assignments/delete-assignment-dialog";
import { DataError } from "@/components/ui/data-error";
import { getAssignment } from "@/lib/queries/assignments";
import { getAssignmentWorkers } from "@/lib/queries/assignment-workers";
import { getPaymentsData } from "@/lib/queries/payments";
import { getExpensesData } from "@/lib/queries/expenses";
import { requireAuthenticatedOwnerId } from "@/lib/supabase/auth";
import { assignmentIdSchema } from "@/lib/validations/assignment";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Assignment details" };

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!assignmentIdSchema.safeParse(id).success) notFound();

  const ownerId = await requireAuthenticatedOwnerId();
  const [result, workerResult, paymentResult, expenseResult] = await Promise.all([
    getAssignment(ownerId, id),
    getAssignmentWorkers(ownerId, id),
    getPaymentsData(ownerId, { assignmentId: id }),
    getExpensesData(ownerId, { assignmentId: id }),
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
              <p className="mt-3 text-sm text-slate-500">
                {result.assignment.received_from?.name ?? "Unavailable source"} <span aria-hidden="true">·</span> {formatCurrency(result.assignment.selling_price, result.assignment.currency)} <span aria-hidden="true">·</span> Due {formatDateTime(result.assignment.client_deadline)} <span aria-hidden="true">·</span> {result.assignment.work_mode === "self" ? "Self" : result.assignment.work_mode === "outsourced" ? "Outsourced" : "Mixed"}
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link href={"/assignments/" + id + "/edit"} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <Pencil aria-hidden="true" className="size-4" /> Edit
              </Link>
              <DeleteAssignmentDialog assignmentId={id} taskCode={result.assignment.task_code} />
            </div>
          </div>
          <AssignmentOverview assignment={result.assignment} />
          <AssignmentWriterSection
            assignment={result.assignment}
            allocations={workerResult.data.allocations}
            eligibleWriters={workerResult.data.eligibleWriters}
            payments={paymentResult}
            error={workerResult.error}
          />
          <AssignmentClientPaymentsSection
            assignment={result.assignment}
            payments={paymentResult}
          />
          <AssignmentFinancialSummary assignment={result.assignment} allocations={workerResult.data.allocations} payments={paymentResult} expenses={expenseResult} />
          <AssignmentWriterPaymentsSection assignment={result.assignment} payments={paymentResult} />
          <AssignmentExpensesSection
            assignmentId={id}
            currency={result.assignment.currency}
            data={expenseResult}
          />
          <AssignmentNotes assignment={result.assignment} />
        </>
      )}
    </div>
  );
}
