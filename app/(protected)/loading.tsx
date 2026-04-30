function SkeletonBlock({ className }: { className: string }) {
  return <div className={`skeleton-surface rounded-md ${className}`} />;
}

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <SkeletonBlock className="h-4 w-36" />
        <SkeletonBlock className="mt-4 h-8 w-64 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-80 max-w-full" />
        <div className="mt-4 flex flex-wrap gap-2">
          <SkeletonBlock className="h-7 w-20" />
          <SkeletonBlock className="h-7 w-32" />
          <SkeletonBlock className="h-7 w-28" />
          <SkeletonBlock className="h-7 w-14" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <article
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            key={index}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="mt-4 h-8 w-16" />
              </div>
              <SkeletonBlock className="size-10" />
            </div>
            <SkeletonBlock className="mt-5 h-4 w-full" />
            <SkeletonBlock className="mt-2 h-4 w-4/5" />
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <SkeletonBlock className="h-6 w-48" />
          <div className="mt-5 grid gap-3">
            <SkeletonBlock className="h-24 w-full" />
            <SkeletonBlock className="h-24 w-full" />
          </div>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <SkeletonBlock className="h-6 w-36" />
          <div className="mt-5 grid gap-2">
            <SkeletonBlock className="h-16 w-full" />
            <SkeletonBlock className="h-16 w-full" />
            <SkeletonBlock className="h-16 w-full" />
          </div>
        </article>
      </section>
    </div>
  );
}
