import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/feature-page";

const metricCards = [
  {
    title: "Open critical faults",
    value: "0",
    description: "High-priority issues blocking operations will appear here.",
    icon: AlertTriangle,
    tone: "text-red-700 bg-red-50 border-red-200",
  },
  {
    title: "Upcoming tests",
    value: "0",
    description: "Scheduled track, bench, and systems tests.",
    icon: CalendarDays,
    tone: "text-cyan-700 bg-cyan-50 border-cyan-200",
  },
  {
    title: "Safety acknowledgements",
    value: "0",
    description: "Documents requiring member confirmation.",
    icon: FileCheck2,
    tone: "text-amber-700 bg-amber-50 border-amber-200",
  },
  {
    title: "Competition readiness",
    value: "Setup",
    description: "Readiness checklist status will be tracked here.",
    icon: Gauge,
    tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
];

const quickActions = [
  { label: "Report a fault", href: "/faults" },
  { label: "Schedule testing", href: "/testing" },
  { label: "Review documents", href: "/documents" },
  { label: "Open checklists", href: "/checklists" },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow="Operations overview"
        title="Dashboard"
        description="A mobile-first command surface for Gryphon Railways engineering, safety, testing, and competition readiness."
        actions={
          <Button asChild>
            <Link href="/faults">
              <Plus aria-hidden="true" />
              New fault
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              key={card.title}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {card.title}
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                    {card.value}
                  </p>
                </div>
                <span className={`rounded-md border p-2 ${card.tone}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {card.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-slate-950 p-2 text-cyan-300">
              <Bell className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Latest announcements
              </h2>
              <p className="text-sm text-slate-600">
                Team-wide notices will be surfaced here.
              </p>
            </div>
          </div>
          <div className="mt-5 rounded-md border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-600">
            No announcements yet. Competition updates, safety notices, and test
            changes will appear in this feed.
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-slate-950 p-2 text-cyan-300">
              <ClipboardCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Quick actions
              </h2>
              <p className="text-sm text-slate-600">
                Common workflows, ready for the next phase.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            {quickActions.map((action) => (
              <Button
                asChild
                className="h-11 justify-start"
                key={action.href}
                variant="outline"
              >
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
