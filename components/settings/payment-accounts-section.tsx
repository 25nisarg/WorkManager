import { Building2, CircleDollarSign, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PAYMENT_ACCOUNT_TYPES } from "@/lib/constants/expenses";
import type { ExpensePaymentAccount } from "@/types/expense";
import { DeletePaymentAccountDialog } from "./delete-payment-account-dialog";
import { PaymentAccountDialog } from "./payment-account-dialog";

const typeLabels = new Map<string, string>(PAYMENT_ACCOUNT_TYPES.map((type) => [type.value, type.label]));

export function PaymentAccountsSection({ accounts }: { accounts: ExpensePaymentAccount[] }) {
  return (
    <section className="space-y-4" aria-labelledby="payment-accounts-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Transaction destinations</p><h2 id="payment-accounts-heading" className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Payment accounts</h2><p className="mt-1 text-sm text-slate-500">Manage the accounts available when recording payments and expenses.</p></div><PaymentAccountDialog /></div>
      {accounts.length === 0 ? (
        <Card className="flex min-h-52 flex-col items-center justify-center px-6 py-8 text-center"><span className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><WalletCards aria-hidden="true" className="size-5" /></span><h3 className="mt-4 font-semibold text-slate-900">No payment accounts yet</h3><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Add an account such as a bank, UPI ID, wallet, or cash account. Payment forms remain usable without one.</p></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {accounts.map((account) => (
            <Card key={account.id} className="overflow-hidden">
              <div className="flex items-start justify-between gap-3 p-5"><div className="flex min-w-0 items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">{account.account_type === "bank" ? <Building2 aria-hidden="true" className="size-5" /> : <CircleDollarSign aria-hidden="true" className="size-5" />}</span><div className="min-w-0"><h3 className="truncate font-semibold text-slate-900">{account.account_name}</h3><p className="mt-1 text-sm text-slate-500">{typeLabels.get(account.account_type) ?? account.account_type} · {account.currency}</p></div></div><span className={"inline-flex rounded-md px-2 py-1 text-xs font-semibold " + (account.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{account.is_active ? "Active" : "Inactive"}</span></div>
              {account.notes && <p className="border-t border-slate-100 px-5 py-3 text-sm leading-6 text-slate-500">{account.notes}</p>}
              <div className="flex justify-end gap-1 border-t border-slate-100 bg-slate-50/60 px-3 py-2"><PaymentAccountDialog accountId={account.id} initialValues={account} /><DeletePaymentAccountDialog accountId={account.id} accountName={account.account_name} /></div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
