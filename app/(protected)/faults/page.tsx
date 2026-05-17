import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ClipboardCheck,
  Filter,
  Search,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  Constants,
  type Database,
  type Enums,
} from "@/lib/supabase/database.types";
import { ALL_SUBTEAM_OPTIONS, getSubteamLabel } from "@/lib/team-options";
import {
  FaultCard,
  ReportFaultDialog,
  type FaultCommentView,
  type FaultPersonOption,
  type FaultTestRunOption,
  type FaultView,
} from "./faults-workflow";

type AppSubteam = Enums<"app_subteam">;
type FaultStatus = Enums<"fault_status">;
type PriorityLevel = Enums<"priority_level">;

type FaultRow = Pick<
  Database["public"]["Tables"]["faults"]["Row"],
  | "id"
  | "title"
  | "description"
  | "subsystem"
  | "severity"
  | "status"
  | "blocks_testing"
  | "safety_critical"
  | "reported_by"
  | "assigned_to"
  | "due_at"
  | "created_at"
  | "linked_test_run_id"
>;

type FaultCommentRow = Pick<
  Database["public"]["Tables"]["fault_comments"]["Row"],
  "id" | "fault_id" | "author_id" | "body" | "created_at"
>;

type FaultsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "fixed", label: "Fixed" },
  { value: "verified_closed", label: "Verified closed" },
  { value: "rejected", label: "Rejected" },
] as const satisfies ReadonlyArray<{ value: FaultStatus; label: string }>;

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const satisfies ReadonlyArray<{ value: PriorityLevel; label: string }>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getFilterParams(params: Record<string, string | string[] | undefined>) {
  const q = firstParam(params.q)?.trim() ?? "";
  const status = firstParam(params.status)?.trim() ?? "";
  const severity = firstParam(params.severity)?.trim() ?? "";
  const subsystem = firstParam(params.subsystem)?.trim() ?? "";

  return {
    q,
    status: Constants.public.Enums.fault_status.includes(status as FaultStatus)
      ? (status as FaultStatus)
      : null,
    severity: Constants.public.Enums.priority_level.includes(
      severity as PriorityLevel
    )
      ? (severity as PriorityLevel)
      : null,
    subsystem: Constants.public.Enums.app_subteam.includes(
      subsystem as AppSubteam
    )
      ? (subsystem as AppSubteam)
      : null,
    safety: firstParam(params.safety) === "1",
    blocking: firstParam(params.blocking) === "1",
    mine: firstParam(params.mine) === "1",
  };
}

function cleanSearchPattern(value: string) {
  return value.replace(/[%,]/g, " ").replace(/\s+/g, " ").trim();
}

function hasActiveFilters(filters: ReturnType<typeof getFilterParams>) {
  return Boolean(
    filters.q ||
      filters.status ||
      filters.severity ||
      filters.subsystem ||
      filters.safety ||
      filters.blocking ||
      filters.mine
  );
}

function summaryNumber(value: number | null) {
  return value ?? 0;
}

export default async function FaultsPage({ searchParams }: FaultsPageProps) {
  const params = await searchParams;
  const filters = getFilterParams(params);
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const [
    { count: openCount },
    { count: criticalCount },
    { count: blockingCount },
    { count: verificationCount },
    { data: profileRows },
    { data: testRunRows },
  ] = await Promise.all([
    supabase
      .from("faults")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(verified_closed,rejected)"),
    supabase
      .from("faults")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(verified_closed,rejected)")
      .or("severity.eq.critical,safety_critical.eq.true"),
    supabase
      .from("faults")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(verified_closed,rejected)")
      .eq("blocks_testing", true),
    supabase
      .from("faults")
      .select("id", { count: "exact", head: true })
      .eq("status", "fixed"),
    supabase
      .from("profiles")
      .select(
        "id, email, full_name, preferred_name, role, subteam, team_title"
      )
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("test_runs")
      .select("id, title, scheduled_start")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  let faultsQuery = supabase
    .from("faults")
    .select(
      "id, title, description, subsystem, severity, status, blocks_testing, safety_critical, reported_by, assigned_to, due_at, created_at, linked_test_run_id"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters.q) {
    const pattern = cleanSearchPattern(filters.q);
    if (pattern) {
      faultsQuery = faultsQuery.or(
        `title.ilike.%${pattern}%,description.ilike.%${pattern}%`
      );
    }
  }

  if (filters.status) {
    faultsQuery = faultsQuery.eq("status", filters.status);
  }

  if (filters.severity) {
    faultsQuery = faultsQuery.eq("severity", filters.severity);
  }

  if (filters.subsystem) {
    faultsQuery = faultsQuery.eq("subsystem", filters.subsystem);
  }

  if (filters.safety) {
    faultsQuery = faultsQuery.eq("safety_critical", true);
  }

  if (filters.blocking) {
    faultsQuery = faultsQuery.eq("blocks_testing", true);
  }

  if (filters.mine) {
    faultsQuery = faultsQuery.eq("assigned_to", user.id);
  }

  const { data: faultRowsData, error: faultsError } = await faultsQuery;
  const faultRows = (faultRowsData as FaultRow[] | null | undefined) ?? [];
  const faultIds = faultRows.map((fault) => fault.id);
  const { data: commentRowsData } =
    faultIds.length > 0
      ? await supabase
          .from("fault_comments")
          .select("id, fault_id, author_id, body, created_at")
          .in("fault_id", faultIds)
          .order("created_at", { ascending: true })
      : { data: [] };

  const commentRows =
    (commentRowsData as FaultCommentRow[] | null | undefined) ?? [];
  const profileIds = new Set<string>();
  faultRows.forEach((fault) => {
    profileIds.add(fault.reported_by);
    if (fault.assigned_to) {
      profileIds.add(fault.assigned_to);
    }
  });
  commentRows.forEach((comment) => profileIds.add(comment.author_id));

  const { data: displayProfileRowsData } =
    profileIds.size > 0
      ? await supabase
          .from("profiles")
          .select(
            "id, email, full_name, preferred_name, role, subteam, team_title"
          )
          .in("id", Array.from(profileIds))
      : { data: [] };

  const activeProfiles =
    (profileRows as FaultPersonOption[] | null | undefined) ?? [];
  const displayProfiles =
    (displayProfileRowsData as FaultPersonOption[] | null | undefined) ?? [];
  const profilesById = new Map(
    [...activeProfiles, ...displayProfiles].map((profile) => [
      profile.id,
      profile,
    ])
  );
  const testRuns = (testRunRows as FaultTestRunOption[] | null | undefined) ?? [];
  const testRunsById = new Map(testRuns.map((testRun) => [testRun.id, testRun]));
  const commentsByFault = new Map<string, FaultCommentView[]>();

  commentRows.forEach((comment) => {
    const list = commentsByFault.get(comment.fault_id) ?? [];
    list.push({
      id: comment.id,
      body: comment.body,
      created_at: comment.created_at,
      author: profilesById.get(comment.author_id) ?? null,
    });
    commentsByFault.set(comment.fault_id, list);
  });

  const faults: FaultView[] = faultRows.map((fault) => ({
    ...fault,
    reporter: profilesById.get(fault.reported_by) ?? null,
    assignee: fault.assigned_to
      ? profilesById.get(fault.assigned_to) ?? null
      : null,
    linkedTestRunTitle: fault.linked_test_run_id
      ? testRunsById.get(fault.linked_test_run_id)?.title ?? null
      : null,
    comments: commentsByFault.get(fault.id) ?? [],
  }));

  const summaryCards = [
    {
      title: "Open faults",
      value: summaryNumber(openCount),
      description: "Not yet closed or rejected.",
      icon: AlertTriangle,
      tone: "text-primary bg-accent border-ring/15",
    },
    {
      title: "Critical faults",
      value: summaryNumber(criticalCount),
      description: "Critical severity or safety critical.",
      icon: ShieldAlert,
      tone: "text-red-700 bg-red-50 border-red-100",
    },
    {
      title: "Blocking testing",
      value: summaryNumber(blockingCount),
      description: "Currently preventing testing work.",
      icon: Filter,
      tone: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      title: "Awaiting verification",
      value: summaryNumber(verificationCount),
      description: "Fixed and ready for closure.",
      icon: ClipboardCheck,
      tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Issue control</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Faults
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Track reported faults, blockers, corrective actions, and
              verification status across the GR-1 DREADNOUGHT programme.
            </p>
          </div>
          <ReportFaultDialog profiles={activeProfiles} testRuns={testRuns} />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
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

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className="rounded-md bg-primary p-2 text-primary-foreground">
            <Search className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Fault filters
            </h2>
            <p className="text-sm text-muted-foreground">
              Search the register by state, severity, subsystem, and ownership.
            </p>
          </div>
        </div>

        <form action="/faults" className="grid gap-4" method="get">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
            <label className="space-y-2 text-sm font-medium text-foreground">
              Search text
              <input
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                defaultValue={filters.q}
                name="q"
                placeholder="Search title or description"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-foreground">
              Status
              <select
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                defaultValue={filters.status ?? ""}
                name="status"
              >
                <option value="">All statuses</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-foreground">
              Severity
              <select
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                defaultValue={filters.severity ?? ""}
                name="severity"
              >
                <option value="">All severities</option>
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-foreground">
              Subsystem
              <select
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                defaultValue={filters.subsystem ?? ""}
                name="subsystem"
              >
                <option value="">All subsystems</option>
                {ALL_SUBTEAM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex min-h-10 items-center gap-3 rounded-md border border-border bg-muted/35 px-3 text-sm font-medium text-foreground">
                <input
                  className="size-4 rounded border-input accent-primary"
                  defaultChecked={filters.safety}
                  name="safety"
                  type="checkbox"
                  value="1"
                />
                Safety critical only
              </label>
              <label className="flex min-h-10 items-center gap-3 rounded-md border border-border bg-muted/35 px-3 text-sm font-medium text-foreground">
                <input
                  className="size-4 rounded border-input accent-primary"
                  defaultChecked={filters.blocking}
                  name="blocking"
                  type="checkbox"
                  value="1"
                />
                Blocks testing only
              </label>
              <label className="flex min-h-10 items-center gap-3 rounded-md border border-border bg-muted/35 px-3 text-sm font-medium text-foreground">
                <input
                  className="size-4 rounded border-input accent-primary"
                  defaultChecked={filters.mine}
                  name="mine"
                  type="checkbox"
                  value="1"
                />
                Assigned to me
              </label>
            </div>

            <div className="flex gap-2 md:justify-end">
              {hasActiveFilters(filters) ? (
                <Button asChild variant="outline">
                  <a href="/faults">Reset</a>
                </Button>
              ) : null}
              <Button type="submit">
                <Search className="size-4" aria-hidden="true" />
                Apply filters
              </Button>
            </div>
          </div>
        </form>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Fault register
            </h2>
            <p className="text-sm text-muted-foreground">
              {faults.length} visible fault{faults.length === 1 ? "" : "s"},
              newest first.
            </p>
          </div>
          {filters.subsystem ? (
            <p className="text-sm text-muted-foreground">
              Subsystem: {getSubteamLabel(filters.subsystem)}
            </p>
          ) : null}
        </div>

        {faultsError ? (
          <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive">
            {faultsError.message}
          </p>
        ) : null}

        {faults.length > 0 ? (
          faults.map((fault) => (
            <FaultCard
              fault={fault}
              key={fault.id}
              profiles={activeProfiles}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-6 text-sm leading-6 text-muted-foreground">
            No faults match the current filters.{" "}
            {hasActiveFilters(filters)
              ? "Try broadening the filters or reset the register."
              : "Reported faults will appear here as the team logs them."}
          </div>
        )}
      </section>
    </div>
  );
}
