import Link from "next/link";
import { ChevronRight, Mail, Phone } from "lucide-react";
import { ContactRoleBadges } from "./contact-role-badges";
import type { Contact } from "@/types/contact";

export function ContactList({ contacts }: { contacts: Contact[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Contact</th>
              <th className="px-5 py-3">Roles</th>
              <th className="px-5 py-3">Contact details</th>
              <th className="px-5 py-3">Status</th>
              <th className="w-12 px-5 py-3"><span className="sr-only">View</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contacts.map((contact) => (
              <tr key={contact.id} className="transition hover:bg-slate-50">
                <td className="px-5 py-4">
                  <Link href={"/contacts/" + contact.id} className="font-medium text-slate-900 hover:text-indigo-700">
                    {contact.name}
                  </Link>
                  <p className="mt-0.5 text-sm text-slate-500">{contact.company_name || "Independent"}</p>
                </td>
                <td className="px-5 py-4"><ContactRoleBadges roles={contact.roles} /></td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  <p>{contact.email || "No email"}</p>
                  <p className="mt-0.5 text-slate-500">{contact.phone || "No phone"}</p>
                </td>
                <td className="px-5 py-4">
                  <span className={"inline-flex rounded-md border px-2 py-0.5 text-xs font-medium " + (contact.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600")}>
                    {contact.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <Link href={"/contacts/" + contact.id} aria-label={"View " + contact.name} className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-700">
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {contacts.map((contact) => (
          <Link key={contact.id} href={"/contacts/" + contact.id} className="block p-4 transition hover:bg-slate-50">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{contact.name}</p>
                <p className="mt-0.5 truncate text-sm text-slate-500">{contact.company_name || "Independent"}</p>
              </div>
              <span className={"shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium " + (contact.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600")}>
                {contact.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-3"><ContactRoleBadges roles={contact.roles} /></div>
            <div className="mt-3 space-y-1 text-sm text-slate-500">
              {contact.email && <p className="flex items-center gap-2"><Mail aria-hidden="true" className="size-3.5" />{contact.email}</p>}
              {contact.phone && <p className="flex items-center gap-2"><Phone aria-hidden="true" className="size-3.5" />{contact.phone}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
