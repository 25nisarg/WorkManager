"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  ChartNoAxesCombined,
  CircleGauge,
  ContactRound,
  ReceiptText,
  Settings,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  available?: boolean;
};

const navigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: CircleGauge, available: true },
  { label: "Assignments", href: "/assignments", icon: BriefcaseBusiness },
  { label: "Contacts", href: "/contacts", icon: ContactRound, available: true },
  { label: "Writers", href: "/writers", icon: UsersRound },
  { label: "Payments", href: "/payments", icon: Banknote },
  { label: "Expenses", href: "/expenses", icon: ReceiptText },
  { label: "Deadlines", href: "/deadlines", icon: CalendarClock },
  { label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
];

type AppSidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
};

export function AppSidebar({ collapsed, mobileOpen, onCloseMobile, onToggleCollapsed }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-200 " +
          (collapsed ? "w-20 " : "w-64 ") +
          (mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
        }
        aria-label="Primary navigation"
      >
        <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-4">
          <Link href="/dashboard" onClick={onCloseMobile} className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BriefcaseBusiness aria-hidden="true" className="size-4.5" />
            </span>
            {!collapsed && <span className="truncate text-sm font-semibold tracking-tight text-slate-950">Freelance Manager</span>}
          </Link>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onCloseMobile}
            className="ml-auto rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = item.available && (pathname === item.href || pathname.startsWith(item.href + "/"));
            const sharedClass =
              "group flex h-10 w-full items-center rounded-lg text-sm font-medium transition " +
              (collapsed ? "justify-center px-2" : "gap-3 px-3");

            if (!item.available) {
              return (
                <div
                  key={item.href}
                  aria-disabled="true"
                  title={collapsed ? item.label + " — coming soon" : undefined}
                  className={sharedClass + " cursor-not-allowed text-slate-400"}
                >
                  <Icon aria-hidden="true" className="size-4.5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span>{item.label}</span>
                      <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Soon</span>
                    </>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={sharedClass + " " + (active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}
              >
                <Icon aria-hidden="true" className="size-4.5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div
            aria-disabled="true"
            className={"flex h-10 cursor-not-allowed items-center rounded-lg text-sm font-medium text-slate-400 " + (collapsed ? "justify-center px-2" : "gap-3 px-3")}
            title={collapsed ? "Settings — coming soon" : undefined}
          >
            <Settings aria-hidden="true" className="size-4.5 shrink-0" />
            {!collapsed && (
              <>
                <span>Settings</span>
                <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Soon</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="mt-1 hidden h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ArrowRightToLine aria-hidden="true" className="size-4.5" /> : <ArrowLeftToLine aria-hidden="true" className="size-4.5" />}
            {!collapsed && <span>Collapse sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
