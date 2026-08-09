import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Plus } from "lucide-react";
import { AssignmentFilters } from "@/components/assignments/assignment-filters";
import { AssignmentList } from "@/components/assignments/assignment-list";
import { PageHeader } from "@/components/layout/page-header";
import { DataError } from "@/components/ui/data-error";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ASSIGNMENT_PRIORITY_VALUES,
  ASSIGNMENT_SORTS,
  ASSIGNMENT_STATUS_VALUES,
  WORK_MODE_VALUES,
} from "@/lib/constants/assignments";
import {
  getAssignmentContacts,
  getAssignments,
} from "@/lib/queries/assignments";
import { requireAuthenticatedOwnerId } from "@/lib/supabase/auth";
import { assignmentIdSchema } from "@/lib/validations/assignment";

export const metadata: Metadata = { title: "Assignments" };

type QueryValue = string | string[] | undefined;
type AssignmentsPageProps = {
  searchParams: Promise<{
    q?: QueryValue;
    status?: QueryValue;
    priority?: QueryValue;
    received_from?: QueryValue;
    work_mode?: QueryValue;
    sort?: QueryValue;
  }>;
};

function first(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value;
}

function allowed<T extends string>(value: string | undefined, values: T[]) {
  return values.includes(value as T) ? value : undefined;
}

export default async function AssignmentsPage({
  searchParams,
}: AssignmentsPageProps) {
  const ownerId = await requireAuthenticatedOwnerId();
  const params = await searchParams;
  const search = first(params.q)?.trim();
  const status = allowed(first(params.status), ASSIGNMENT_STATUS_VALUES);
  const priority = allowed(first(params.priority), ASSIGNMENT_PRIORITY_VALUES);
  const workMode = allowed(first(params.work_mode), WORK_MODE_VALUES);
  const requestedContact = first(params.received_from);
  const receivedFrom = assignmentIdSchema.safeParse(requestedContact).success
    ? requestedContact
    : undefined;
  const requestedSort = first(params.sort);
  const sort =
    ASSIGNMENT_SORTS.some((item) => item.value === requestedSort)
      ? requestedSort
      : "newest";

  const [assignmentResult, contactResult] = await Promise.all([
    getAssignments(ownerId, {
      search,
      status,
      priority,
      receivedFrom,
      workMode,
      sort,
    }),
    getAssignmentContacts(ownerId),
  ]);
  const hasFilters = Boolean(
    search ||
      status ||
      priority ||
      receivedFrom ||
      workMode ||
      (sort && sort !== "newest")
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          eyebrow="Work management"
          title="Assignments"
          description="Track work from initial receipt through delivery and completion."
        />
        <Link href="/assignments/new" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
          <Plus aria-hidden="true" className="size-4" /> Add assignment
        </Link>
      </div>

      <AssignmentFilters
        search={search}
        status={status}
        priority={priority}
        receivedFrom={receivedFrom}
        workMode={workMode}
        sort={sort}
        contacts={contactResult.data}
      />

      {assignmentResult.error ? (
        <DataError message={assignmentResult.error} />
      ) : assignmentResult.data.length === 0 ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title={hasFilters ? "No matching assignments" : "No assignments yet"}
          description={
            hasFilters
              ? "Try changing or clearing your filters."
              : "Add your first assignment to begin tracking your work."
          }
          action={
            hasFilters
              ? { label: "Clear filters", href: "/assignments" }
              : { label: "Add your first assignment", href: "/assignments/new" }
          }
        />
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {assignmentResult.data.length}{" "}
            {assignmentResult.data.length === 1 ? "assignment" : "assignments"}
          </p>
          <AssignmentList assignments={assignmentResult.data} />
        </>
      )}
    </div>
  );
}
