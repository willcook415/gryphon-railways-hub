export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-8 w-56 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="h-40 animate-pulse rounded-lg bg-white" />
        <div className="h-40 animate-pulse rounded-lg bg-white" />
        <div className="h-40 animate-pulse rounded-lg bg-white" />
        <div className="h-40 animate-pulse rounded-lg bg-white" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-lg bg-white" />
        <div className="h-64 animate-pulse rounded-lg bg-white" />
      </div>
    </div>
  );
}
