import Link from "next/link";
import { Search } from "lucide-react";
import type { WriterFilters as WriterFilterValues } from "@/types/writer";

export function WriterFilters({ search, role, status, workload }: WriterFilterValues) {
  const hasFilters = Boolean(search || role || status || workload);
  const selectClass = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";
  return <form action="/writers" className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[minmax(14rem,1fr)_10rem_10rem_12rem_auto]">
    <div className="relative"><label htmlFor="writer-search" className="sr-only">Search writers</label><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input id="writer-search" name="q" type="search" defaultValue={search} placeholder="Search name or company" className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" /></div>
    <div><label htmlFor="writer-role" className="sr-only">Filter by writer role</label><select id="writer-role" name="role" defaultValue={role ?? ""} className={selectClass}><option value="">All roles</option><option value="writer">Writer</option><option value="freelancer">Freelancer</option></select></div>
    <div><label htmlFor="writer-status" className="sr-only">Filter by contact status</label><select id="writer-status" name="status" defaultValue={status ?? ""} className={selectClass}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
    <div><label htmlFor="writer-workload" className="sr-only">Filter by workload</label><select id="writer-workload" name="workload" defaultValue={workload ?? ""} className={selectClass}><option value="">Any workload</option><option value="assigned">Currently assigned</option><option value="available">No active work</option></select></div>
    <div className="flex gap-2"><button type="submit" className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700">Apply</button>{hasFilters && <Link href="/writers" className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">Clear</Link>}</div>
  </form>;
}
