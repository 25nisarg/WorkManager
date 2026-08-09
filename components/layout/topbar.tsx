"use client";

import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { logout } from "@/app/(dashboard)/actions";

type TopbarProps = {
  userEmail: string;
  onOpenMobile: () => void;
};

function initialsFromEmail(email: string) {
  const name = email.split("@")[0] || "A";
  return name.slice(0, 2).toUpperCase();
}

export function Topbar({ userEmail, onOpenMobile }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenMobile}
        className="-ml-2 rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-950 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>

      <div className="relative hidden w-full max-w-sm sm:block">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          aria-label="Search"
          disabled
          placeholder="Search will be available soon"
          className="h-9 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-500 outline-none placeholder:text-slate-400 disabled:opacity-100"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button type="button" disabled aria-label="Notifications are not yet available" className="rounded-lg p-2 text-slate-400 disabled:cursor-not-allowed">
          <Bell aria-hidden="true" className="size-5" />
        </button>
        <div className="mx-1 h-6 w-px bg-slate-200" />

        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
            {initialsFromEmail(userEmail)}
          </span>
          <div className="hidden min-w-0 md:block">
            <p className="max-w-44 truncate text-sm font-medium text-slate-800">{userEmail}</p>
            <p className="text-xs text-slate-500">Owner</p>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            aria-label="Sign out"
          >
            <span className="hidden sm:inline">Sign out</span>
            <ChevronDown aria-hidden="true" className="size-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
