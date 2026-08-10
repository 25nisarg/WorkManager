import type { Metadata } from "next";
import { DeadlineFilters } from "@/components/deadlines/deadline-filters";
import { DeadlineList } from "@/components/deadlines/deadline-list";
import { DeadlineSummary } from "@/components/deadlines/deadline-summary";
import { PageHeader } from "@/components/layout/page-header";
import { DataError } from "@/components/ui/data-error";
import { ASSIGNMENT_PRIORITY_VALUES, ASSIGNMENT_STATUS_VALUES } from "@/lib/constants/assignments";
import { getDeadlines } from "@/lib/queries/deadlines";
import { requireAuthenticatedOwnerId } from "@/lib/supabase/auth";
import { expenseIdSchema } from "@/lib/validations/expense";

export const metadata: Metadata = { title: "Deadlines" };
type QueryValue = string | string[] | undefined;
type Props = { searchParams: Promise<{ timing?: QueryValue; status?: QueryValue; priority?: QueryValue; writer?: QueryValue }> };
const first = (value: QueryValue) => Array.isArray(value) ? value[0] : value;

export default async function DeadlinesPage({ searchParams }: Props) {
  const ownerId = await requireAuthenticatedOwnerId();
  const params = await searchParams;
  const timingValue = first(params.timing);
  const statusValue = first(params.status);
  const priorityValue = first(params.priority);
  const writerValue = first(params.writer);
  const filters = {
    timing: (["overdue", "today", "upcoming"] as const).find((value) => value === timingValue),
    status: ASSIGNMENT_STATUS_VALUES.includes(statusValue as (typeof ASSIGNMENT_STATUS_VALUES)[number]) ? statusValue : undefined,
    priority: ASSIGNMENT_PRIORITY_VALUES.includes(priorityValue as (typeof ASSIGNMENT_PRIORITY_VALUES)[number]) ? priorityValue : undefined,
    writerId: expenseIdSchema.safeParse(writerValue).success ? writerValue : undefined,
  };
  const data = await getDeadlines(ownerId, filters);
  return <div className="space-y-6"><PageHeader eyebrow="Delivery planning" title="Deadlines" description="Track client and writer commitments together, ordered by urgency." />{data.error ? <DataError message={data.error} /> : <><DeadlineSummary items={data.items} /><DeadlineFilters {...filters} writers={data.writers} /><DeadlineList items={data.items} /></>}</div>;
}
