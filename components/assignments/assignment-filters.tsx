import Link from "next/link";
import { Search } from "lucide-react";
import {
  ASSIGNMENT_PRIORITIES,
  ASSIGNMENT_SORTS,
  ASSIGNMENT_STATUSES,
  WORK_MODES,
} from "@/lib/constants/assignments";
import type { AssignmentContact } from "@/types/assignment";

type AssignmentFiltersProps = {
  search?: string;
  status?: string;
  priority?: string;
  receivedFrom?: string;
  workMode?: string;
  sort?: string;
  contacts: AssignmentContact[];
};

export function AssignmentFilters({
  search,
  status,
  priority,
  receivedFrom,
  workMode,
  sort,
  contacts,
}: AssignmentFiltersProps) {
  const hasFilters = Boolean(
    search || status || priority || receivedFrom || workMode || (sort && sort !== "newest")
  );
  const selectClass =
    "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

  return (
    <form action="/assignments" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <div className="relative lg:col-span-2 xl:col-span-2">
          <label htmlFor="assignment-search" className="sr-only">Search assignments</label>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="assignment-search"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Task ID, title, or subject"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>
        <label className="sr-only" htmlFor="assignment-status">Status</label>
        <select id="assignment-status" name="status" defaultValue={status ?? ""} className={selectClass}>
          <option value="">All statuses</option>
          {ASSIGNMENT_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <label className="sr-only" htmlFor="assignment-priority">Priority</label>
        <select id="assignment-priority" name="priority" defaultValue={priority ?? ""} className={selectClass}>
          <option value="">All priorities</option>
          {ASSIGNMENT_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <label className="sr-only" htmlFor="assignment-work-mode">Work mode</label>
        <select id="assignment-work-mode" name="work_mode" defaultValue={workMode ?? ""} className={selectClass}>
          <option value="">All work modes</option>
          {WORK_MODES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <label className="sr-only" htmlFor="assignment-sort">Sort assignments</label>
        <select id="assignment-sort" name="sort" defaultValue={sort ?? "newest"} className={selectClass}>
          {ASSIGNMENT_SORTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-xs">
          <label className="sr-only" htmlFor="assignment-contact">Received from</label>
          <select id="assignment-contact" name="received_from" defaultValue={receivedFrom ?? ""} className={selectClass}>
            <option value="">All contacts</option>
            {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <button type="submit" className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700">Apply</button>
          {hasFilters && <Link href="/assignments" className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">Clear</Link>}
        </div>
      </div>
    </form>
  );
}
