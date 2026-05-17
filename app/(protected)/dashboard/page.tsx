import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  Pin,
  RadioTower,
  ShieldCheck,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Database, Enums } from "@/lib/supabase/database.types";
import { getSubteamLabel } from "@/lib/team-options";
import {
  getMemberDisplayName,
  getMemberDisplayTitle,
  getMemberFirstName,
} from "@/lib/member-display";
import { AddAnnouncementDialog } from "./add-announcement-dialog";

type AppRole = Enums<"app_role">;
type PriorityLevel = Enums<"priority_level">;

type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "email"
  | "full_name"
  | "preferred_name"
  | "role"
  | "subteam"
  | "team_title"
  | "is_active"
>;

type Announcement = Pick<
  Database["public"]["Tables"]["announcements"]["Row"],
  | "id"
  | "title"
  | "body"
  | "priority"
  | "target_subteam"
  | "pinned"
  | "expires_at"
  | "created_by"
  | "created_at"
>;

type AnnouncementAuthor = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "email" | "full_name" | "preferred_name" | "role" | "subteam" | "team_title"
>;

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    warning?: string;
  }>;
};

const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const priorityBadgeStyles: Record<PriorityLevel, string> = {
  low: "border-border bg-muted text-muted-foreground",
  medium: "border-ring/15 bg-accent text-primary",
  high: "border-orange-200 bg-orange-50 text-orange-800",
  critical: "border-red-200 bg-red-50 text-red-800",
};

const baseQuickActions = [
  {
    label: "Report a fault",
    description: "Capture an issue for triage.",
    href: "/faults",
    icon: AlertTriangle,
  },
  {
    label: "Schedule testing",
    description: "Plan track, bench, or systems work.",
    href: "/testing",
    icon: CalendarDays,
  },
  {
    label: "Review documents",
    description: "Open safety and operating files.",
    href: "/documents",
    icon: FileCheck2,
  },
  {
    label: "Open checklists",
    description: "Check readiness and setup tasks.",
    href: "/checklists",
    icon: ClipboardCheck,
  },
  {
    label: "View telemetry",
    description: "Inspect vehicle data surfaces.",
    href: "/telemetry",
    icon: RadioTower,
  },
];

function isAdminRole(role: AppRole | null | undefined) {
  return role === "admin" || role === "exec";
}

function canManageAnnouncements(role: AppRole | null | undefined) {
  return role === "admin" || role === "exec" || role === "team_lead";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function truncateBody(value: string) {
  return value.length > 150 ? `${value.slice(0, 147).trim()}...` : value;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "email, full_name, preferred_name, role, subteam, team_title, is_active"
    )
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const isAdmin = isAdminRole(profile?.role);
  const canCreateAnnouncements = canManageAnnouncements(profile?.role);
  const firstName = getMemberFirstName(profile, user.email ?? null);
  const displayTitle = getMemberDisplayTitle(profile);
  const now = new Date().toISOString();

  const { data: announcements, error: announcementsError } = await supabase
    .from("announcements")
    .select(
      "id, title, body, priority, target_subteam, pinned, expires_at, created_by, created_at"
    )
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12);

  const announcementRows =
    (announcements as Announcement[] | null | undefined) ?? [];
  const authorIds = Array.from(
    new Set(
      announcementRows
        .map((announcement) => announcement.created_by)
        .filter((id): id is string => Boolean(id))
    )
  );
  const { data: authors } =
    authorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, email, full_name, preferred_name, role, subteam, team_title")
          .in("id", authorIds)
      : { data: [] };
  const authorById = new Map(
    ((authors as AnnouncementAuthor[] | null | undefined) ?? []).map(
      (author) => [author.id, author]
    )
  );

  const { count: openCriticalFaultsCount } = await supabase
    .from("faults")
    .select("id", { count: "exact", head: true })
    .not("status", "in", "(verified_closed,rejected)")
    .or("severity.eq.critical,safety_critical.eq.true");

  const visibleAnnouncements = announcementRows
    .filter((announcement) => {
      if (isAdmin) {
        return true;
      }

      return (
        announcement.target_subteam === null ||
        announcement.target_subteam === profile?.subteam
      );
    })
    .slice(0, 5);

  const quickActions = [
    ...baseQuickActions,
    ...(isAdmin
      ? [
          {
            label: "Manage members",
            description: "Create accounts and adjust access.",
            href: "/admin/members",
            icon: Users,
          },
        ]
      : []),
  ];

  const metricCards = [
    {
      title: "Open critical faults",
      value: String(openCriticalFaultsCount ?? 0),
      description: "Critical or safety-critical issues still needing closure.",
      icon: AlertTriangle,
      tone: "text-red-700 bg-red-50 border-red-100",
    },
    {
      title: "Upcoming tests",
      value: "0",
      description: "Scheduled track, bench, and systems tests.",
      icon: CalendarDays,
      tone: "text-primary bg-accent border-ring/15",
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="animate-card-in relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div
          className="pointer-events-none absolute inset-y-6 right-6 hidden w-56 opacity-40 lg:block"
          aria-hidden="true"
        >
          <div className="absolute left-0 top-3 h-px w-full bg-border" />
          <div className="absolute left-8 top-9 h-px w-44 bg-border" />
          <div className="absolute left-2 top-15 h-px w-52 bg-border" />
          <div className="absolute bottom-8 left-12 h-px w-40 bg-primary/20" />
          <div className="absolute bottom-3 left-0 h-px w-full bg-primary/20" />
        </div>

        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)] lg:items-center">
          <div className="min-w-0 lg:pl-2 xl:pl-4">
            <p className="text-sm font-medium text-primary">
              Gryphon Railways operations
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Here&apos;s what needs attention across the team as GR-1 moves
              through the 2026-2027 development cycle.
            </p>

            <div className="mt-6 max-w-xl border-t border-border pt-4">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Your team position
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {displayTitle}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Programme status
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    Foundation Phase
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-xl border border-primary/15 bg-accent/55 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Current programme
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
              GR-1 DREADNOUGHT
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Prototype locomotive for the 2026-2027 IMechE Railway Challenge cycle.
            </p>

            <dl className="mt-5 grid gap-3 border-t border-primary/15 pt-4 text-sm">
              <div className="grid grid-cols-[7rem_1fr] gap-3">
                <dt className="text-muted-foreground">Phase</dt>
                <dd className="font-medium text-foreground">
                  Foundation Phase
                </dd>
              </div>
              <div className="grid grid-cols-[7rem_1fr] gap-3">
                <dt className="text-muted-foreground">Cycle</dt>
                <dd className="font-medium text-foreground">2026-2027</dd>
              </div>
              <div className="grid grid-cols-[7rem_1fr] gap-3">
                <dt className="text-muted-foreground">Target</dt>
                <dd className="font-medium text-foreground">
                  IMechE Railway Challenge 2027
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      {params.error ? (
        <p className="animate-card-in rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {params.error}
        </p>
      ) : null}

      {params.message ? (
        <p className="animate-card-in rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {params.message}
        </p>
      ) : null}

      {params.warning ? (
        <p className="animate-card-in rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {params.warning}
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              className="animate-card-in rounded-xl border border-border bg-card p-5 shadow-sm"
              key={card.title}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                    {card.value}
                  </p>
                </div>
                <span className={`rounded-md border p-2 ${card.tone}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {card.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="animate-card-in rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-primary p-2 text-primary-foreground">
                <Bell className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Latest announcements
                </h2>
                <p className="text-sm text-muted-foreground">
                  Team-wide notices, safety updates, and test changes.
                </p>
              </div>
            </div>
            {canCreateAnnouncements ? (
              <AddAnnouncementDialog />
            ) : null}
          </div>

          {announcementsError ? (
            <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {announcementsError.message}
            </p>
          ) : null}

          <div className="mt-5 grid gap-3">
            {visibleAnnouncements.length > 0 ? (
              visibleAnnouncements.map((announcement) => {
                const author = announcement.created_by
                  ? authorById.get(announcement.created_by)
                  : null;

                return (
                  <article
                    className={`rounded-lg border bg-muted/35 p-4 ${
                      announcement.priority === "critical"
                        ? "border-red-200 bg-red-50/60"
                        : "border-border"
                    }`}
                    key={announcement.id}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {announcement.pinned ? (
                            <Pin
                              className="size-4 shrink-0 text-primary"
                              aria-hidden="true"
                            />
                          ) : null}
                          <h3 className="truncate text-sm font-semibold text-foreground">
                            {announcement.title}
                          </h3>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {truncateBody(announcement.body)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 rounded-md border px-2 py-1 text-xs font-medium ${
                          priorityBadgeStyles[announcement.priority]
                        }`}
                      >
                        {PRIORITY_LABELS[announcement.priority]}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{formatDate(announcement.created_at)}</span>
                      <span>
                        {announcement.target_subteam
                          ? getSubteamLabel(announcement.target_subteam)
                          : "All teams"}
                      </span>
                      {author ? (
                        <span>By {getMemberDisplayName(author)}</span>
                      ) : null}
                      {announcement.pinned ? <span>Pinned</span> : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-md border border-dashed border-border p-4 text-sm leading-6 text-muted-foreground">
                No announcements yet. Team-wide updates, safety notices, and
                test changes will appear here.
              </div>
            )}
          </div>
        </article>

        <article className="animate-card-in rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-primary p-2 text-primary-foreground">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Quick actions
              </h2>
              <p className="text-sm text-muted-foreground">
                Common workflows, ready for the next phase.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  className="group flex min-h-16 items-center gap-3 rounded-lg border border-border bg-muted/35 p-3 transition hover:-translate-y-0.5 hover:bg-card hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 motion-reduce:hover:translate-y-0"
                  href={action.href}
                  key={action.href}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-card text-primary ring-1 ring-border transition group-hover:bg-accent">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      {action.label}
                    </span>
                    <span className="block text-xs leading-5 text-muted-foreground">
                      {action.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}
