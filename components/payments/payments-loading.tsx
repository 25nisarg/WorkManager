export function PaymentsLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading payments">
      <div><div className="h-3 w-24 rounded bg-slate-200" /><div className="mt-3 h-8 w-44 rounded bg-slate-200" /><div className="mt-3 h-4 w-80 max-w-full rounded bg-slate-200" /></div>
      <div className="h-11 w-64 rounded-lg bg-slate-200" />
      <div className="h-32 rounded-xl border border-slate-200 bg-white" />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="h-11 border-b border-slate-100 bg-slate-50" />
        {[1, 2, 3, 4].map((row) => <div key={row} className="h-20 border-b border-slate-100 px-5 last:border-0" />)}
      </div>
    </div>
  );
}
