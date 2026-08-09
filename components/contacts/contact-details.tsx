import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CircleUserRound,
  Coins,
  Globe2,
  History,
  Mail,
  MessageCircle,
  NotebookText,
  Phone,
  ReceiptText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ContactRoleBadges } from "./contact-role-badges";
import type { Contact } from "@/types/contact";

type DetailRowProps = {
  icon: LucideIcon;
  label: string;
  value: string | null;
  href?: string;
};

function DetailRow({ icon: Icon, label, value, href }: DetailRowProps) {
  return (
    <div className="flex gap-3 py-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        {value ? (
          href ? (
            <a href={href} className="mt-1 block break-words text-sm font-medium text-indigo-700 hover:underline">{value}</a>
          ) : (
            <p className="mt-1 break-words text-sm font-medium text-slate-800">{value}</p>
          )
        ) : (
          <p className="mt-1 text-sm text-slate-400">Not provided</p>
        )}
      </div>
    </div>
  );
}

function FutureSection({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          <span className="mt-3 inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">Available in a future phase</span>
        </div>
      </div>
    </Card>
  );
}

export function ContactDetails({ contact }: { contact: Contact }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Contact information</h2>
          </div>
          <div className="grid divide-y divide-slate-100 px-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="sm:pr-5">
              <DetailRow icon={CircleUserRound} label="Name" value={contact.name} />
              <DetailRow icon={Building2} label="Company" value={contact.company_name} />
              <DetailRow icon={Globe2} label="Country" value={contact.country} />
            </div>
            <div className="sm:pl-5">
              <DetailRow icon={Mail} label="Email" value={contact.email} href={contact.email ? "mailto:" + contact.email : undefined} />
              <DetailRow icon={Phone} label="Phone" value={contact.phone} href={contact.phone ? "tel:" + contact.phone : undefined} />
              <DetailRow icon={MessageCircle} label="WhatsApp" value={contact.whatsapp} href={contact.whatsapp ? "https://wa.me/" + contact.whatsapp.replace(/\D/g, "") : undefined} />
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <FutureSection icon={NotebookText} title="Assignment history" description="Assignments received from or allocated to this contact will appear here." />
          <FutureSection icon={History} title="Transaction history" description="Client and writer payment transactions will appear here when payments are implemented." />
        </div>
      </div>

      <div className="space-y-6">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900">Roles and preferences</h2>
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Roles</p>
            <ContactRoleBadges roles={contact.roles} />
          </div>
          <div className="mt-5 border-t border-slate-100 pt-2">
            <DetailRow icon={Coins} label="Preferred currency" value={contact.preferred_currency} />
            <DetailRow icon={ReceiptText} label="Status" value={contact.is_active ? "Active" : "Inactive"} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-slate-900">Notes</h2>
          <p className={"mt-3 whitespace-pre-wrap text-sm leading-6 " + (contact.notes ? "text-slate-600" : "text-slate-400")}>
            {contact.notes || "No notes have been added."}
          </p>
        </Card>
      </div>
    </div>
  );
}
