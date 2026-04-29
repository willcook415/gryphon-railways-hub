import type { ReactNode } from "react";

type FeatureCard = {
  title: string;
  description: string;
  meta?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-sm font-medium text-cyan-700">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
      {actions}
    </header>
  );
}

export function FeaturePlaceholder({
  eyebrow,
  title,
  description,
  cards,
}: {
  eyebrow: string;
  title: string;
  description: string;
  cards: FeatureCard[];
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            key={card.title}
          >
            <p className="text-sm font-semibold text-slate-950">
              {card.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {card.description}
            </p>
            {card.meta ? (
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-cyan-700">
                {card.meta}
              </p>
            ) : null}
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Module skeleton
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This page is ready for the production workflows, tables, filters, and
          forms that will be added in the next build phase.
        </p>
      </section>
    </div>
  );
}
