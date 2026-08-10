import type { Metadata } from "next";
import Link from "next/link";
import { Plus, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataError } from "@/components/ui/data-error";
import { EmptyState } from "@/components/ui/empty-state";
import { WriterFilters } from "@/components/writers/writer-filters";
import { WriterList } from "@/components/writers/writer-list";
import { WriterSummary } from "@/components/writers/writer-summary";
import { getWriters } from "@/lib/queries/writers";
import { requireAuthenticatedOwnerId } from "@/lib/supabase/auth";
import type { WriterFilters as WriterFilterValues, WriterRole } from "@/types/writer";

export const metadata: Metadata = { title: "Writers" };
type QueryValue = string | string[] | undefined;
type Props = { searchParams: Promise<{ q?: QueryValue; role?: QueryValue; status?: QueryValue; workload?: QueryValue }> };
const first = (value: QueryValue) => Array.isArray(value) ? value[0] : value;

export default async function WritersPage({ searchParams }: Props) {
  const ownerId = await requireAuthenticatedOwnerId();
  const params = await searchParams;
  const requestedRole = first(params.role);
  const requestedStatus = first(params.status);
  const requestedWorkload = first(params.workload);
  const filters: WriterFilterValues = {
    search: first(params.q)?.trim() || undefined,
    role: requestedRole === "writer" || requestedRole === "freelancer" ? requestedRole as WriterRole : undefined,
    status: requestedStatus === "active" || requestedStatus === "inactive" ? requestedStatus : undefined,
    workload: requestedWorkload === "assigned" || requestedWorkload === "available" ? requestedWorkload : undefined,
  };
  const result = await getWriters(ownerId, filters);
  const hasFilters = Boolean(filters.search || filters.role || filters.status || filters.workload);
  return <div className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><PageHeader eyebrow="Workforce" title="Writers" description="Monitor writer workload, delivery history, costs, and outstanding payables." /><Link href="/contacts/new" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"><Plus aria-hidden="true" className="size-4" />Add writer</Link></div><WriterFilters {...filters} />{result.error ? <DataError message={result.error} /> : result.data.length === 0 ? <EmptyState icon={UsersRound} title={hasFilters ? "No matching writers" : "No writers yet"} description={hasFilters ? "Try changing or clearing your writer filters." : "Add a contact with the Writer or Freelancer role to start assigning work."} action={hasFilters ? { label: "Clear filters", href: "/writers" } : { label: "Add writer contact", href: "/contacts/new" }} /> : <><WriterSummary writers={result.data} /><p className="text-sm text-slate-500">{result.data.length} {result.data.length === 1 ? "writer" : "writers"}</p><WriterList writers={result.data} /></>}</div>;
}
