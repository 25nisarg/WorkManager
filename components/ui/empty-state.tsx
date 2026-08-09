import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "./card";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {action.label}
        </Link>
      )}
    </Card>
  );
}
