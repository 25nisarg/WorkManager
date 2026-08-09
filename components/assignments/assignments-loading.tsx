export function AssignmentsLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading assignments">
      <div>
        <div className="h-3 w-28 rounded bg-slate-200" />
        <div className="mt-3 h-8 w-52 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-200" />
      </div>
      <div className="h-32 rounded-xl border border-slate-200 bg-white" />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="h-11 border-b border-slate-100 bg-slate-50" />
        {[1, 2, 3, 4].map((row) => (
          <div key={row} className="flex h-24 items-center gap-6 border-b border-slate-100 px-5 last:border-0">
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="h-4 w-48 rounded bg-slate-200" />
            <div className="ml-auto h-5 w-24 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
