export default function AdminMembersLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="rounded-lg border bg-background p-5 shadow-sm">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-8 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="rounded-lg border bg-background p-5 shadow-sm">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="rounded-lg border bg-background p-5 shadow-sm">
          <div className="h-5 w-36 animate-pulse rounded bg-muted" />
          <div className="mt-4 grid gap-3">
            <div className="h-24 animate-pulse rounded bg-muted" />
            <div className="h-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
    </div>
  );
}
