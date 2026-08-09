import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ClientPaymentDialog } from "@/components/payments/client-payment-dialog";
import { PaymentFilters } from "@/components/payments/payment-filters";
import {
  ClientPaymentsTable,
  WorkerPaymentsTable,
} from "@/components/payments/payment-tables";
import { WorkerPaymentDialog } from "@/components/payments/worker-payment-dialog";
import { DataError } from "@/components/ui/data-error";
import { PAYMENT_METHOD_VALUES } from "@/lib/constants/payments";
import { getPaymentsData } from "@/lib/queries/payments";
import { requireAuthenticatedOwnerId } from "@/lib/supabase/auth";
import { paymentIdSchema } from "@/lib/validations/payment";

export const metadata: Metadata = { title: "Payments" };

type QueryValue = string | string[] | undefined;
type PaymentsPageProps = {
  searchParams: Promise<{
    view?: QueryValue;
    q?: QueryValue;
    date_from?: QueryValue;
    date_to?: QueryValue;
    contact?: QueryValue;
    assignment?: QueryValue;
    method?: QueryValue;
  }>;
};

function first(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value;
}

function validDate(value?: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

export default async function PaymentsPage({
  searchParams,
}: PaymentsPageProps) {
  const ownerId = await requireAuthenticatedOwnerId();
  const params = await searchParams;
  const view = first(params.view) === "paid" ? "paid" : "received";
  const search = first(params.q)?.trim();
  const dateFrom = validDate(first(params.date_from));
  const dateTo = validDate(first(params.date_to));
  const requestedContact = first(params.contact);
  const contactId = paymentIdSchema.safeParse(requestedContact).success
    ? requestedContact
    : undefined;
  const requestedAssignment = first(params.assignment);
  const assignmentId = paymentIdSchema.safeParse(requestedAssignment).success
    ? requestedAssignment
    : undefined;
  const requestedMethod = first(params.method);
  const method = PAYMENT_METHOD_VALUES.includes(
    requestedMethod as (typeof PAYMENT_METHOD_VALUES)[number]
  )
    ? requestedMethod
    : undefined;
  const payments = await getPaymentsData(ownerId, {
    search,
    dateFrom,
    dateTo,
    contactId,
    assignmentId,
    method,
  });
  const options = {
    assignments: payments.assignments,
    payers: payments.eligiblePayers,
    allocations: payments.allocations,
    accounts: payments.accounts,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader eyebrow="Cash transactions" title="Payments" description="Track every payment received from clients and paid to writers." />
        <div className="flex flex-wrap gap-3">
          <ClientPaymentDialog assignments={payments.assignments} payers={payments.eligiblePayers} accounts={payments.accounts} />
          <WorkerPaymentDialog allocations={payments.allocations} accounts={payments.accounts} />
        </div>
      </div>

      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm" aria-label="Payment direction">
        <Link href="/payments?view=received" className={"inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-semibold transition " + (view === "received" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50")}>
          <ArrowDownToLine aria-hidden="true" className="size-4" /> Received
          <span className={view === "received" ? "text-indigo-100" : "text-slate-400"}>{payments.clientPayments.length}</span>
        </Link>
        <Link href="/payments?view=paid" className={"inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-semibold transition " + (view === "paid" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50")}>
          <ArrowUpFromLine aria-hidden="true" className="size-4" /> Paid
          <span className={view === "paid" ? "text-indigo-100" : "text-slate-400"}>{payments.workerPayments.length}</span>
        </Link>
      </div>

      <PaymentFilters view={view} search={search} dateFrom={dateFrom} dateTo={dateTo} contactId={contactId} assignmentId={assignmentId} method={method} contacts={payments.contacts} assignments={payments.assignments} />

      {payments.error ? (
        <DataError message={payments.error} />
      ) : view === "received" ? (
        <ClientPaymentsTable payments={payments.clientPayments} options={options} />
      ) : (
        <WorkerPaymentsTable payments={payments.workerPayments} options={options} />
      )}
    </div>
  );
}
