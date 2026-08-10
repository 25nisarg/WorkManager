import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ContactRoleBadges } from "@/components/contacts/contact-role-badges";
import { formatDateTime } from "@/lib/utils/format";
import type { WriterListItem } from "@/types/writer";
import { WriterMoney } from "./writer-money";

function Deadline({ value }: { value: string | null }) {
  if (!value) return <span className="text-slate-400">No deadline</span>;
  return <span className="text-slate-600">{formatDateTime(value)}</span>;
}

function Status({ active }: { active: boolean }) {
  return <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{active ? "Active" : "Inactive"}</span>;
}

export function WriterList({ writers }: { writers: WriterListItem[] }) {
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="hidden overflow-x-auto lg:block"><table className="min-w-[1180px] w-full text-left"><thead className="border-b border-slate-200 bg-slate-50"><tr className="text-xs font-semibold uppercase tracking-wide text-slate-500"><th className="px-4 py-3">Writer</th><th className="px-4 py-3">Roles</th><th className="px-4 py-3 text-center">Active</th><th className="px-4 py-3 text-center">Total</th><th className="px-4 py-3 text-center">Completed</th><th className="px-4 py-3">Agreed cost</th><th className="px-4 py-3">Paid</th><th className="px-4 py-3">Payable</th><th className="px-4 py-3">Next deadline</th><th className="px-4 py-3">Status</th><th className="w-10 px-3 py-3"><span className="sr-only">View</span></th></tr></thead><tbody className="divide-y divide-slate-100">{writers.map((writer) => <tr key={writer.id} className="hover:bg-slate-50"><td className="px-4 py-4"><Link href={`/writers/${writer.id}`} className="font-semibold text-slate-900 hover:text-indigo-700">{writer.name}</Link><p className="mt-0.5 text-sm text-slate-500">{writer.company_name || "Independent"}</p></td><td className="px-4 py-4"><ContactRoleBadges roles={writer.roles} /></td><td className="px-4 py-4 text-center text-sm font-semibold text-slate-800">{writer.active_assignments}</td><td className="px-4 py-4 text-center text-sm text-slate-600">{writer.total_assignments}</td><td className="px-4 py-4 text-center text-sm text-slate-600">{writer.completed_assignments}</td><td className="px-4 py-4 text-sm"><WriterMoney values={writer.total_agreed_cost} /></td><td className="px-4 py-4 text-sm"><WriterMoney values={writer.total_paid} /></td><td className="px-4 py-4 text-sm"><WriterMoney values={writer.total_payable} emphasize /></td><td className="px-4 py-4 text-sm"><Deadline value={writer.upcoming_deadline} /></td><td className="px-4 py-4"><Status active={writer.is_active} /></td><td className="px-3 py-4"><Link href={`/writers/${writer.id}`} aria-label={`View ${writer.name}`} className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-700"><ChevronRight aria-hidden="true" className="size-4" /></Link></td></tr>)}</tbody></table></div>
    <div className="divide-y divide-slate-100 lg:hidden">{writers.map((writer) => <Link key={writer.id} href={`/writers/${writer.id}`} className="block p-4 hover:bg-slate-50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{writer.name}</p><p className="mt-0.5 truncate text-sm text-slate-500">{writer.company_name || "Independent"}</p></div><Status active={writer.is_active} /></div><div className="mt-3"><ContactRoleBadges roles={writer.roles} /></div><dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm"><div><dt className="text-xs text-slate-500">Active / total</dt><dd className="mt-1 font-medium text-slate-800">{writer.active_assignments} / {writer.total_assignments}</dd></div><div><dt className="text-xs text-slate-500">Completed</dt><dd className="mt-1 font-medium text-slate-800">{writer.completed_assignments}</dd></div><div><dt className="text-xs text-slate-500">Payable</dt><dd className="mt-1"><WriterMoney values={writer.total_payable} emphasize /></dd></div><div><dt className="text-xs text-slate-500">Next deadline</dt><dd className="mt-1"><Deadline value={writer.upcoming_deadline} /></dd></div></dl></Link>)}</div>
  </div>;
}
