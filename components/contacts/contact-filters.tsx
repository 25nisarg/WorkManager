import Link from "next/link";
import { Search } from "lucide-react";
import { CONTACT_ROLES } from "@/lib/constants/contacts";

type ContactFiltersProps = {
  search?: string;
  role?: string;
  status?: string;
};

export function ContactFilters({ search, role, status }: ContactFiltersProps) {
  const hasFilters = Boolean(search || role || status);

  return (
    <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(16rem,1fr)_11rem_11rem_auto]" action="/contacts">
      <div className="relative">
        <label htmlFor="contact-search" className="sr-only">Search contacts</label>
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          id="contact-search"
          name="q"
          type="search"
          defaultValue={search}
          placeholder="Search name, company, or email"
          className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
        />
      </div>

      <div>
        <label htmlFor="role-filter" className="sr-only">Filter by role</label>
        <select
          id="role-filter"
          name="role"
          defaultValue={role ?? ""}
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
        >
          <option value="">All roles</option>
          {CONTACT_ROLES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="status-filter" className="sr-only">Filter by status</label>
        <select
          id="status-filter"
          name="status"
          defaultValue={status ?? ""}
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700">
          Apply
        </button>
        {hasFilters && (
          <Link href="/contacts" className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
