import { CONTACT_ROLES } from "@/lib/constants/contacts";
import type { ContactRole } from "@/types/contact";

const styles: Record<ContactRole, string> = {
  student: "border-blue-200 bg-blue-50 text-blue-700",
  vendor: "border-violet-200 bg-violet-50 text-violet-700",
  writer: "border-emerald-200 bg-emerald-50 text-emerald-700",
  freelancer: "border-amber-200 bg-amber-50 text-amber-700",
  other: "border-slate-200 bg-slate-50 text-slate-600",
};

const labels = new Map(CONTACT_ROLES.map((role) => [role.value, role.label]));

export function ContactRoleBadges({ roles }: { roles: ContactRole[] }) {
  if (roles.length === 0) {
    return <span className="text-xs text-slate-400">No roles</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => (
        <span
          key={role}
          className={"inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium " + styles[role]}
        >
          {labels.get(role) ?? role}
        </span>
      ))}
    </div>
  );
}
