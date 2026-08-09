export function ExpensesLoading() {
  return <div className="animate-pulse space-y-6" aria-label="Loading expenses"><div><div className="h-3 w-24 rounded bg-slate-200" /><div className="mt-3 h-8 w-44 rounded bg-slate-200" /><div className="mt-3 h-4 w-80 max-w-full rounded bg-slate-200" /></div><div className="grid gap-3 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-32 rounded-xl border border-slate-200 bg-white" />)}</div><div className="h-32 rounded-xl border border-slate-200 bg-white" /><div className="h-80 rounded-xl border border-slate-200 bg-white" /></div>;
}
