import Link from "next/link";
import { Search } from "lucide-react";
import { PAYMENT_METHODS } from "@/lib/constants/payments";
import type {
  PaymentAssignment,
  PaymentContact,
} from "@/types/payment";

type PaymentFiltersProps = {
  view: "received" | "paid";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  contactId?: string;
  assignmentId?: string;
  method?: string;
  contacts: PaymentContact[];
  assignments: PaymentAssignment[];
};

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export function PaymentFilters({
  view,
  search,
  dateFrom,
  dateTo,
  contactId,
  assignmentId,
  method,
  contacts,
  assignments,
}: PaymentFiltersProps) {
  const hasFilters = Boolean(
    search || dateFrom || dateTo || contactId || assignmentId || method
  );

  return (
    <form action="/payments" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <input type="hidden" name="view" value={view} />
      <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <div className="relative lg:col-span-2 xl:col-span-2">
          <label htmlFor="payment-search" className="sr-only">Search payments</label>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input id="payment-search" name="q" type="search" defaultValue={search} placeholder="Task, contact, or reference" className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
        </div>
        <div>
          <label htmlFor="payment-date-from" className="sr-only">From date</label>
          <input id="payment-date-from" name="date_from" type="date" defaultValue={dateFrom} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="payment-date-to" className="sr-only">To date</label>
          <input id="payment-date-to" name="date_to" type="date" defaultValue={dateTo} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="payment-contact" className="sr-only">Contact</label>
          <select id="payment-contact" name="contact" defaultValue={contactId ?? ""} className={fieldClass}>
            <option value="">All contacts</option>
            {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="payment-method" className="sr-only">Payment method</label>
          <select id="payment-method" name="method" defaultValue={method ?? ""} className={fieldClass}>
            <option value="">All methods</option>
            {PAYMENT_METHODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-sm">
          <label htmlFor="payment-assignment" className="sr-only">Assignment</label>
          <select id="payment-assignment" name="assignment" defaultValue={assignmentId ?? ""} className={fieldClass}>
            <option value="">All assignments</option>
            {assignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.task_code} — {assignment.title}</option>)}
          </select>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <button type="submit" className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700">Apply</button>
          {hasFilters && <Link href={"/payments?view=" + view} className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">Clear</Link>}
        </div>
      </div>
    </form>
  );
}
