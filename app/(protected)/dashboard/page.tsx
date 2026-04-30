import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  Megaphone,
  Pin,
  Plus,
  RadioTower,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { createClient } from "@/lib/supabase/server";
import type { Database, Enums } from "@/lib/supabase/database.types";
import {
  ACTIVE_SUBTEAM_OPTIONS,
  getSubteamLabel,
} from "@/lib/team-options";
import { createAnnouncement } from "./actions";

type AppRole = Enums<"app_role">;
type PriorityLevel = Enums<"priority_level">;

type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "email" | "full_name" | "preferred_name" | "role" | "subteam" | "is_active"
>;

type Announcement = Pick<
  Database["public"]["Tables"]["announcements"]["Row"],
  | "id"
  | "title"
  | "body"
  | "priority"
  | "target_subteam"
  | "pinned"
  | "created_at"
>;

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    warning?: string;
  }>;
};

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  exec: "Executive",
  team_lead: "Team Lead",
  member: "Member",
  viewer: "Viewer",
};

const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const priorityBadgeStyles: Record<PriorityLevel, string> = {
  low: "border-slate-200 bg-slate-50 text-slate-700",
  medium: "border-zinc-300 bg-zinc-100 text-zinc-800",
  high: "border-orange-200 bg-orange-50 text-orange-800",
  critical: "border-red-200 bg-red-50 text-red-800",
};

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
    tone: "text-slate-700 bg-slate-50 border-slate-200",
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

function looksLikeIdentifier(value: string, email: string | null | undefined) {
  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase();
  const emailPrefix = email?.split("@")[0]?.toLowerCase();

  return (
    normalized.includes("@") ||
    normalized === emailPrefix ||
    /^\d+$/.test(normalized) ||
    /^[a-z]{2,}\d{3,}$/i.test(trimmed)
  );
}

function getFirstName(profile: Profile | null, fallbackEmail: string | null) {
  const email = profile?.email ?? fallbackEmail;
  const preferredName = profile?.preferred_name?.trim();

  if (preferredName && !looksLikeIdentifier(preferredName, email)) {
    return preferredName.split(/\s+/)[0];
  }

  const fullName = profile?.full_name?.trim();
  if (fullName) {
    return fullName.split(/\s+/)[0];
  }

  const emailPrefix = email?.split("@")[0]?.trim();
  return emailPrefix || "there";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
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
    .select("email, full_name, preferred_name, role, subteam, is_active")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const isAdmin = isAdminRole(profile?.role);
  const firstName = getFirstName(profile, user.email ?? null);
  const teamLabel = getSubteamLabel(profile?.subteam);
  const roleLabel = profile?.role ? ROLE_LABELS[profile.role] : "Member";

  const { data: announcements, error: announcementsError } = await supabase
    .from("announcements")
    .select("id, title, body, priority, target_subteam, pinned, created_at")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12);

  const visibleAnnouncements = (
    (announcements as Announcement[] | null | undefined) ?? []
  )
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
          {
            label: "Add announcement",
            description: "Post a team update.",
            href: "#add-announcement",
            icon: Megaphone,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="animate-card-in rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">
              Operations overview
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Here&apos;s what needs attention across Gryphon Railways.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            {[roleLabel, teamLabel, "Foundation phase", "GR-1"].map((item) => (
              <span
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-700"
                key={item}
              >
                {item}
              </span>
            ))}
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
              className="animate-card-in rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
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
        <article className="animate-card-in rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-slate-950 p-2 text-white">
                <Bell className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Latest announcements
                </h2>
                <p className="text-sm text-slate-600">
                  Team-wide notices, safety updates, and test changes.
                </p>
              </div>
            </div>
            {isAdmin ? (
              <a
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
                href="#add-announcement"
              >
                <Plus className="size-4" aria-hidden="true" />
                Add announcement
              </a>
            ) : null}
          </div>

          {announcementsError ? (
            <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {announcementsError.message}
            </p>
          ) : null}

          <div className="mt-5 grid gap-3">
            {visibleAnnouncements.length > 0 ? (
              visibleAnnouncements.map((announcement) => (
                <article
                  className="rounded-md border border-slate-200 bg-slate-50/60 p-4"
                  key={announcement.id}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {announcement.pinned ? (
                          <Pin
                            className="size-4 shrink-0 text-slate-500"
                            aria-hidden="true"
                          />
                        ) : null}
                        <h3 className="truncate text-sm font-semibold text-slate-950">
                          {announcement.title}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
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
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{formatDate(announcement.created_at)}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {announcement.target_subteam
                        ? getSubteamLabel(announcement.target_subteam)
                        : "All team"}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-600">
                No announcements yet. Team-wide updates, safety notices, and
                test changes will appear here.
              </div>
            )}
          </div>

          {isAdmin ? (
            <details
              className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4"
              id="add-announcement"
            >
              <summary className="cursor-pointer text-sm font-semibold text-slate-950">
                Add announcement
              </summary>
              <form action={createAnnouncement} className="mt-4 grid gap-4">
                <label className="space-y-2 text-sm font-medium text-slate-800">
                  Title
                  <input
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus-visible:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-500/20"
                    name="title"
                    placeholder="Testing plan updated"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-800">
                  Body
                  <textarea
                    className="min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus-visible:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-500/20"
                    name="body"
                    placeholder="Share the update members need to know."
                    required
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-slate-800">
                    Priority
                    <select
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-500/20"
                      defaultValue="medium"
                      name="priority"
                    >
                      {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-800">
                    Target audience
                    <select
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-500/20"
                      defaultValue="all"
                      name="target_subteam"
                    >
                      <option value="all">All team</option>
                      {ACTIVE_SUBTEAM_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <input
                      className="size-4 rounded border-slate-300"
                      name="pinned"
                      type="checkbox"
                    />
                    Pinned
                  </label>
                  <PendingSubmitButton pendingText="Posting...">
                    <Megaphone className="size-4" aria-hidden="true" />
                    Post announcement
                  </PendingSubmitButton>
                </div>
              </form>
            </details>
          ) : null}
        </article>

        <article className="animate-card-in rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-slate-950 p-2 text-white">
              <ShieldCheck className="size-5" aria-hidden="true" />
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
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  className="group flex min-h-16 items-center gap-3 rounded-md border border-slate-200 bg-slate-50/60 p-3 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 motion-reduce:hover:translate-y-0"
                  href={action.href}
                  key={action.href}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-slate-700 ring-1 ring-slate-200 transition group-hover:text-slate-950">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-950">
                      {action.label}
                    </span>
                    <span className="block text-xs leading-5 text-slate-500">
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
