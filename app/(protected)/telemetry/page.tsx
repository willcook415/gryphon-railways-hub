import type { ReactNode } from "react";
import {
  Activity,
  BatteryCharging,
  CircleAlert,
  Clock3,
  Database,
  Gauge,
  MapPin,
  RadioTower,
  Route,
  ShieldAlert,
  Signal,
  TableProperties,
  Thermometer,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Database as SupabaseDatabase, Enums } from "@/lib/supabase/database.types";

type SearchParams = Promise<{
  session?: string | string[] | undefined;
}>;

type TelemetrySession =
  SupabaseDatabase["public"]["Tables"]["telemetry_sessions"]["Row"];
type TelemetryPoint =
  SupabaseDatabase["public"]["Tables"]["telemetry_points"]["Row"];
type TelemetryEvent =
  SupabaseDatabase["public"]["Tables"]["telemetry_events"]["Row"];
type TelemetryEventType = Enums<"telemetry_event_type">;
type TestRun = Pick<
  SupabaseDatabase["public"]["Tables"]["test_runs"]["Row"],
  "id" | "title"
>;

type TelemetryPageProps = {
  searchParams: SearchParams;
};

type ChartSeries = {
  label: string;
  color: string;
  values: Array<{ at: string; value: number | null }>;
};

const TELEMETRY_SELECT =
  "id, session_id, recorded_at, sequence_number, speed_kmh, battery_percent, recovered_energy_wh, traction_demand, brake_demand, brakes_applied, emergency_brake_active, auto_stop_active, latitude, longitude, motor_temp_c, controller_temp_c, payload";

const EXPECTED_SIGNALS = [
  "Speed, km/h",
  "Battery / charge level, %",
  "Recovered energy, Wh",
  "Traction and brake demand",
  "Brake, emergency brake, and auto-stop states",
  "Motor and controller temperatures",
  "GPS latitude / longitude",
  "Typed telemetry events and run markers",
];

const eventStyles: Record<TelemetryEventType, string> = {
  info: "border-slate-200 bg-slate-50 text-slate-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  fault: "border-red-200 bg-red-50 text-red-800",
  safety: "border-blue-200 bg-blue-50 text-blue-800",
  run_marker: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatShortTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function formatNumber(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "No data";
  }

  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function formatNumberWithUnit(
  value: number | null | undefined,
  unit: string,
  digits = 1
) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "No data";
  }

  return `${formatNumber(value, digits)} ${unit}`;
}

function formatInteger(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "No data";
  }

  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatBoolean(
  value: boolean | null | undefined,
  activeLabel = "Active",
  inactiveLabel = "Inactive"
) {
  if (value === null || value === undefined) {
    return "No signal";
  }

  return value ? activeLabel : inactiveLabel;
}

function formatDemand(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "No signal";
  }

  const formatted = new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
  }).format(value);

  return value >= 0 && value <= 100 ? `${formatted}%` : formatted;
}

function formatLocation(point: TelemetryPoint | null) {
  if (point?.latitude === null || point?.latitude === undefined) {
    return "No GPS fix";
  }

  if (point.longitude === null || point.longitude === undefined) {
    return "No GPS fix";
  }

  return `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;
}

function formatFreshness(value: string | null | undefined) {
  if (!value) {
    return "Awaiting data";
  }

  const deltaSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000)
  );

  if (deltaSeconds < 60) {
    return `${deltaSeconds}s ago`;
  }

  const deltaMinutes = Math.floor(deltaSeconds / 60);

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.floor(deltaMinutes / 60);

  if (deltaHours < 48) {
    return `${deltaHours}h ago`;
  }

  const deltaDays = Math.floor(deltaHours / 24);

  return `${deltaDays}d ago`;
}

function formatDuration(
  start: string | null | undefined,
  end: string | null | undefined
) {
  if (!start || !end) {
    return "Not calculable";
  }

  const seconds = Math.max(
    0,
    Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000)
  );
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
}

function getSessionLabel(session: TelemetrySession | null) {
  return session?.title?.trim() || "Telemetry session";
}

function normaliseEventType(value: TelemetryEventType) {
  return value.replace("_", " ");
}

function getSelectedSessionId(
  params: Awaited<SearchParams>,
  sessions: TelemetrySession[]
) {
  const requestedSession = Array.isArray(params.session)
    ? params.session[0]
    : params.session;

  if (
    requestedSession &&
    sessions.some((session) => session.id === requestedSession)
  ) {
    return requestedSession;
  }

  return sessions[0]?.id ?? null;
}

function clampPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function getGpsPoints(points: TelemetryPoint[]) {
  return points.filter(
    (
      point
    ): point is TelemetryPoint & { latitude: number; longitude: number } =>
      point.latitude !== null &&
      point.latitude !== undefined &&
      point.longitude !== null &&
      point.longitude !== undefined
  );
}

function Panel({
  children,
  className = "",
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return (
    <section
      className={`animate-card-in rounded-xl border border-border bg-card shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function TechnicalBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-70"
      aria-hidden="true"
      style={{
        backgroundImage:
          "linear-gradient(rgba(11,42,74,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(11,42,74,0.055) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    />
  );
}

function Header({
  selectedSession,
  testRunTitle,
}: {
  selectedSession: TelemetrySession | null;
  testRunTitle: string | null;
}) {
  return (
    <header className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <TechnicalBackdrop />
      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.52fr)] lg:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Remote monitoring</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Telemetry
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Gryphon Railways Hub live and recorded vehicle data for the GR-1
            DREADNOUGHT programme.
          </p>
        </div>

        <div className="rounded-lg border border-primary/15 bg-white/85 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Programme monitor
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-primary">
            GR-1 DREADNOUGHT
          </p>
          <div className="mt-4 border-t border-border pt-3 text-sm">
            <p className="font-medium text-foreground">
              {selectedSession
                ? getSessionLabel(selectedSession)
                : "No telemetry sessions recorded yet"}
            </p>
            <p className="mt-1 text-muted-foreground">
              {selectedSession
                ? formatDateTime(selectedSession.started_at)
                : "Awaiting bench, systems, or track testing"}
            </p>
            {testRunTitle ? (
              <p className="mt-1 text-muted-foreground">
                Linked test: {testRunTitle}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function SessionSelector({
  sessions,
  selectedSession,
}: {
  sessions: TelemetrySession[];
  selectedSession: TelemetrySession | null;
}) {
  return (
    <Panel className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Session selector
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a recorded or open telemetry session for GR-1 DREADNOUGHT.
          </p>
        </div>

        <form
          className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row"
          action="/telemetry"
        >
          <label className="sr-only" htmlFor="session">
            Telemetry session
          </label>
          <select
            className="min-h-11 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/30 disabled:text-muted-foreground"
            defaultValue={selectedSession?.id ?? ""}
            disabled={sessions.length === 0}
            id="session"
            name="session"
          >
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <option value={session.id} key={session.id}>
                  {getSessionLabel(session)} | {session.vehicle_id} |{" "}
                  {formatDateTime(session.started_at)}
                </option>
              ))
            ) : (
              <option value="">No sessions recorded</option>
            )}
          </select>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            disabled={sessions.length === 0}
            type="submit"
          >
            Open session
          </button>
        </form>
      </div>
    </Panel>
  );
}

function SessionOverview({
  selectedSession,
  testRunTitle,
  pointCount,
  eventCount,
  latestPoint,
}: {
  selectedSession: TelemetrySession | null;
  testRunTitle: string | null;
  pointCount: number;
  eventCount: number;
  latestPoint: TelemetryPoint | null;
}) {
  const durationEnd =
    selectedSession?.ended_at ?? latestPoint?.recorded_at ?? null;
  const items = [
    {
      label: "Session",
      value: selectedSession
        ? getSessionLabel(selectedSession)
        : "No telemetry sessions recorded yet",
    },
    {
      label: "Vehicle",
      value: selectedSession?.vehicle_id ?? "Not recorded",
    },
    {
      label: "Test run",
      value: testRunTitle ?? "None linked",
    },
    {
      label: "Source",
      value: selectedSession?.source || "Not recorded",
    },
    {
      label: "Started",
      value: formatDateTime(selectedSession?.started_at),
    },
    {
      label: "Ended",
      value: selectedSession
        ? selectedSession.ended_at
          ? formatDateTime(selectedSession.ended_at)
          : "Live / open session"
        : "No session",
    },
    {
      label: "Telemetry points",
      value: String(pointCount),
    },
    {
      label: "Events",
      value: String(eventCount),
    },
    {
      label: "Duration",
      value: formatDuration(selectedSession?.started_at, durationEnd),
    },
  ];

  return (
    <Panel className="p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-md border border-primary/15 bg-accent text-primary">
          <Database className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Session overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Engineering context for the active telemetry surface.
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9">
        {items.map((item) => (
          <div
            className="rounded-lg border border-border bg-muted/30 p-3 xl:col-span-1"
            key={item.label}
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {item.label}
            </dt>
            <dd className="mt-1 break-words text-sm font-semibold text-foreground">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function InstrumentCluster({
  latestPoint,
  selectedSession,
}: {
  latestPoint: TelemetryPoint | null;
  selectedSession: TelemetrySession | null;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel className="relative overflow-hidden p-5">
        <TechnicalBackdrop />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center">
          <Speedometer value={latestPoint?.speed_kmh ?? null} />
          <div className="grid flex-1 gap-4 md:grid-cols-2">
            <BatteryInstrument value={latestPoint?.battery_percent ?? null} />
            <DemandInstrument
              label="Traction demand"
              value={latestPoint?.traction_demand ?? null}
              color="#0b2a4a"
            />
            <DemandInstrument
              label="Brake demand"
              value={latestPoint?.brake_demand ?? null}
              color="#b45309"
            />
            <EnergyRecovery value={latestPoint?.recovered_energy_wh ?? null} />
          </div>
        </div>
      </Panel>

      <Panel className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              System state
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time status indicators from the latest telemetry point.
            </p>
          </div>
          <Signal className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <StatusIndicator
            label="Brakes applied"
            value={formatBoolean(latestPoint?.brakes_applied, "Applied", "Released")}
            active={latestPoint?.brakes_applied === true}
            alert={latestPoint?.brakes_applied === true}
          />
          <StatusIndicator
            label="Emergency brake"
            value={formatBoolean(latestPoint?.emergency_brake_active)}
            active={latestPoint?.emergency_brake_active === true}
            alert={latestPoint?.emergency_brake_active === true}
          />
          <StatusIndicator
            label="Auto-stop"
            value={formatBoolean(latestPoint?.auto_stop_active)}
            active={latestPoint?.auto_stop_active === true}
          />
          <StatusIndicator
            label="Session"
            value={
              selectedSession
                ? selectedSession.ended_at
                  ? "Recorded"
                  : "Live / open"
                : "Awaiting session"
            }
            active={Boolean(selectedSession && !selectedSession.ended_at)}
          />
          <StatusIndicator
            label="Data freshness"
            value={formatFreshness(latestPoint?.recorded_at)}
            active={Boolean(latestPoint?.recorded_at)}
          />
          <StatusIndicator
            label="Running state"
            value={
              latestPoint?.speed_kmh === null || latestPoint?.speed_kmh === undefined
                ? "Awaiting telemetry"
                : latestPoint.speed_kmh > 0.5
                  ? "Moving"
                  : "Stationary"
            }
            active={Boolean(latestPoint?.speed_kmh && latestPoint.speed_kmh > 0.5)}
          />
        </div>
      </Panel>
    </section>
  );
}

function Speedometer({ value }: { value: number | null }) {
  const hasSignal = value !== null && value !== undefined && Number.isFinite(value);
  const boundedValue = hasSignal ? Math.max(0, value) : 0;
  const gaugeMax = Math.max(40, Math.ceil(boundedValue / 10) * 10);
  const progress = hasSignal ? Math.min(1, boundedValue / gaugeMax) : 0;
  const arcLength = 283;
  const dash = progress * arcLength;

  return (
    <div className="flex min-h-72 flex-1 flex-col items-center justify-center rounded-lg border border-primary/15 bg-white/85 p-5 shadow-sm">
      <div className="w-full max-w-sm">
        <svg
          className="h-44 w-full overflow-visible"
          role="img"
          aria-label="Speedometer"
          viewBox="0 0 240 150"
        >
          <path
            d="M 30 120 A 90 90 0 0 1 210 120"
            fill="none"
            stroke="rgba(100,116,139,0.2)"
            strokeLinecap="round"
            strokeWidth="18"
          />
          <path
            d="M 30 120 A 90 90 0 0 1 210 120"
            fill="none"
            stroke={hasSignal ? "#0b2a4a" : "rgba(100,116,139,0.28)"}
            strokeDasharray={`${dash} ${arcLength - dash}`}
            strokeLinecap="round"
            strokeWidth="18"
          />
          <line
            x1="120"
            x2="120"
            y1="120"
            y2="50"
            stroke={hasSignal ? "#0b2a4a" : "rgba(100,116,139,0.35)"}
            strokeLinecap="round"
            strokeWidth="5"
            style={{
              transform: `rotate(${-90 + progress * 180}deg)`,
              transformBox: "fill-box",
              transformOrigin: "120px 120px",
            }}
          />
          <circle cx="120" cy="120" fill="#ffffff" r="11" stroke="#0b2a4a" strokeWidth="4" />
          <text
            fill="#64748b"
            fontSize="10"
            fontWeight="600"
            textAnchor="middle"
            x="32"
            y="142"
          >
            0
          </text>
          <text
            fill="#64748b"
            fontSize="10"
            fontWeight="600"
            textAnchor="middle"
            x="208"
            y="142"
          >
            {hasSignal ? gaugeMax : "--"}
          </text>
        </svg>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        Speed
      </p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
        {hasSignal ? formatNumber(value) : "--"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasSignal ? "km/h" : "No speed data"}
      </p>
      {!hasSignal ? (
        <p className="mt-3 rounded-md border border-dashed border-border bg-muted/35 px-3 py-2 text-xs font-medium text-muted-foreground">
          Awaiting telemetry data
        </p>
      ) : null}
    </div>
  );
}

function BatteryInstrument({ value }: { value: number | null }) {
  const hasSignal = value !== null && value !== undefined && Number.isFinite(value);
  const fill = clampPercent(value);

  return (
    <div className="rounded-lg border border-border bg-white/85 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Battery
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Charge state</p>
        </div>
        <BatteryCharging className="size-5 text-primary" aria-hidden="true" />
      </div>
      <div className="mt-5 flex items-center gap-2">
        <div className="h-11 flex-1 rounded-md border-2 border-slate-300 bg-muted/40 p-1">
          <div
            className={`h-full rounded-sm ${
              hasSignal ? "bg-primary" : "bg-slate-300"
            }`}
            style={{ width: `${fill}%` }}
          />
        </div>
        <div className="h-6 w-2 rounded-r-sm bg-slate-300" />
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight text-foreground">
          {hasSignal ? `${formatInteger(value)}%` : "--"}
        </p>
        <p className="text-sm text-muted-foreground">
          {hasSignal ? "Real telemetry" : "No charge data"}
        </p>
      </div>
    </div>
  );
}

function DemandInstrument({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null;
  color: string;
}) {
  const hasSignal = value !== null && value !== undefined && Number.isFinite(value);
  const fill = clampPercent(value);
  const displayValue = formatDemand(value);

  return (
    <div className="rounded-lg border border-border bg-white/85 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {label}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Command channel</p>
        </div>
        <Activity className="size-5 text-primary" aria-hidden="true" />
      </div>
      <div className="mt-5 h-3 rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            backgroundColor: hasSignal ? color : "rgb(203 213 225)",
            width: `${fill}%`,
          }}
        />
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight text-foreground">
          {displayValue}
        </p>
        <p className="text-sm text-muted-foreground">
          {hasSignal ? "Recorded" : "Awaiting data"}
        </p>
      </div>
    </div>
  );
}

function EnergyRecovery({ value }: { value: number | null }) {
  const hasSignal = value !== null && value !== undefined && Number.isFinite(value);

  return (
    <div className="rounded-lg border border-border bg-white/85 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Recovered energy
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Regeneration tally</p>
        </div>
        <Zap className="size-5 text-primary" aria-hidden="true" />
      </div>
      <div className="mt-5 rounded-md border border-border bg-muted/30 p-4">
        <p className="text-2xl font-semibold tracking-tight text-foreground">
          {hasSignal ? formatNumberWithUnit(value, "Wh") : "--"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasSignal ? "Latest sample" : "No recovery data"}
        </p>
      </div>
    </div>
  );
}

function StatusIndicator({
  label,
  value,
  active,
  alert = false,
}: {
  label: string;
  value: string;
  active: boolean;
  alert?: boolean;
}) {
  const color = alert ? "bg-red-600" : active ? "bg-emerald-600" : "bg-slate-400";

  return (
    <div className="rounded-lg border border-border bg-muted/25 p-4">
      <div className="flex items-center gap-2">
        <span className={`size-3 rounded-full ${color}`} />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-3 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function TrackMapPanel({ points }: { points: TelemetryPoint[] }) {
  const gpsPoints = getGpsPoints(points);
  const plotted = buildRoutePlot(gpsPoints);

  return (
    <Panel className="overflow-hidden p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Route monitor
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            GPS telemetry plotted from recorded latitude and longitude samples.
          </p>
        </div>
        <Route className="size-5 text-primary" aria-hidden="true" />
      </div>

      <div className="relative mt-5 min-h-[22rem] overflow-hidden rounded-lg border border-border bg-muted/20">
        <svg
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Telemetry route monitor"
          viewBox="0 0 720 360"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              height="36"
              id="route-grid"
              patternUnits="userSpaceOnUse"
              width="36"
            >
              <path
                d="M 36 0 L 0 0 0 36"
                fill="none"
                stroke="rgba(100,116,139,0.18)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect fill="url(#route-grid)" height="360" width="720" />
          <line x1="48" x2="672" y1="306" y2="306" stroke="rgba(11,42,74,0.22)" />
          <line x1="48" x2="48" y1="44" y2="306" stroke="rgba(11,42,74,0.22)" />
          {plotted ? (
            <>
              <path
                d={plotted.path}
                fill="none"
                stroke="#0b2a4a"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
              />
              {plotted.points.map((point, index) => (
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill={index === plotted.points.length - 1 ? "#1d4ed8" : "#ffffff"}
                  key={`${point.x}-${point.y}-${index}`}
                  r={index === plotted.points.length - 1 ? "6" : "4"}
                  stroke="#0b2a4a"
                  strokeWidth="2"
                />
              ))}
            </>
          ) : null}
        </svg>

        <div className="absolute left-4 top-4 rounded-md border border-border bg-white/85 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm">
          {gpsPoints.length > 0
            ? `${gpsPoints.length} GPS point${gpsPoints.length === 1 ? "" : "s"} recorded`
            : "No GPS points recorded for this session yet."}
        </div>

        {plotted ? (
          <div className="absolute bottom-4 left-4 right-4 grid gap-2 rounded-md border border-border bg-white/85 p-3 text-xs text-muted-foreground shadow-sm sm:grid-cols-3">
            <span>Start: {formatLocation(gpsPoints[0])}</span>
            <span>Latest: {formatLocation(gpsPoints[gpsPoints.length - 1])}</span>
            <span>Samples: {gpsPoints.length}</span>
          </div>
        ) : (
          <div className="absolute inset-x-4 top-1/2 mx-auto max-w-md -translate-y-1/2 rounded-lg border border-dashed border-border bg-white/85 p-5 text-center shadow-sm">
            <MapPin className="mx-auto size-6 text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              Route playback awaiting GPS telemetry
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              No route or track path is drawn until real latitude and longitude
              samples exist in telemetry_points.
            </p>
          </div>
        )}
      </div>
    </Panel>
  );
}

function buildRoutePlot(
  gpsPoints: Array<TelemetryPoint & { latitude: number; longitude: number }>
) {
  if (gpsPoints.length === 0) {
    return null;
  }

  const latitudes = gpsPoints.map((point) => point.latitude);
  const longitudes = gpsPoints.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  const plottedPoints = gpsPoints.map((point) => ({
    x: 48 + ((point.longitude - minLng) / lngRange) * 624,
    y: 306 - ((point.latitude - minLat) / latRange) * 262,
  }));

  if (gpsPoints.length === 1) {
    plottedPoints[0] = { x: 360, y: 180 };
  }

  return {
    path: plottedPoints
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(" "),
    points: plottedPoints,
  };
}

function LatestSnapshot({ latestPoint }: { latestPoint: TelemetryPoint | null }) {
  const metrics = [
    {
      label: "Speed",
      value: formatNumberWithUnit(latestPoint?.speed_kmh, "km/h"),
      icon: Gauge,
    },
    {
      label: "Battery",
      value:
        latestPoint?.battery_percent === null ||
        latestPoint?.battery_percent === undefined
          ? "No data"
          : `${formatInteger(latestPoint.battery_percent)}%`,
      icon: BatteryCharging,
    },
    {
      label: "Recovered energy",
      value: formatNumberWithUnit(latestPoint?.recovered_energy_wh, "Wh"),
      icon: Zap,
    },
    {
      label: "Traction demand",
      value: formatDemand(latestPoint?.traction_demand),
      icon: Activity,
    },
    {
      label: "Brake demand",
      value: formatDemand(latestPoint?.brake_demand),
      icon: CircleAlert,
    },
    {
      label: "Brakes applied",
      value: formatBoolean(latestPoint?.brakes_applied, "Applied", "Released"),
      icon: ShieldAlert,
    },
    {
      label: "Emergency brake",
      value: formatBoolean(latestPoint?.emergency_brake_active),
      icon: ShieldAlert,
    },
    {
      label: "Auto-stop",
      value: formatBoolean(latestPoint?.auto_stop_active),
      icon: RadioTower,
    },
    {
      label: "Motor temperature",
      value: formatNumberWithUnit(latestPoint?.motor_temp_c, "deg C"),
      icon: Thermometer,
    },
    {
      label: "Controller temperature",
      value: formatNumberWithUnit(latestPoint?.controller_temp_c, "deg C"),
      icon: Thermometer,
    },
    {
      label: "GPS / location",
      value: formatLocation(latestPoint),
      icon: MapPin,
    },
  ];

  return (
    <Panel className="p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Latest snapshot
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Newest recorded telemetry point for the selected session.
          </p>
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {latestPoint ? formatShortTime(latestPoint.recorded_at) : "Awaiting telemetry data"}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article
              className="rounded-lg border border-border bg-muted/30 p-4"
              key={metric.label}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {metric.label}
                </p>
                <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
              </div>
              <p className="mt-3 break-words text-xl font-semibold tracking-tight text-foreground">
                {metric.value}
              </p>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}

function ChartPanel({
  title,
  description,
  series,
}: {
  title: string;
  description: string;
  series: ChartSeries[];
}) {
  const chart = buildChart(series);
  const patternId = `${title.toLowerCase().replaceAll(" ", "-")}-grid`;

  return (
    <Panel className="p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {series.map((item) => (
            <span
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              key={item.label}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mt-5 rounded-lg border border-border bg-muted/15 p-3">
        <svg
          className="h-56 w-full overflow-visible"
          role="img"
          aria-label={title}
          viewBox="0 0 720 260"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              height="52"
              id={patternId}
              patternUnits="userSpaceOnUse"
              width="80"
            >
              <path
                d="M 80 0 L 0 0 0 52"
                fill="none"
                stroke="rgba(100,116,139,0.18)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect fill={`url(#${patternId})`} height="260" width="720" />
          <line x1="34" x2="690" y1="220" y2="220" stroke="rgba(100,116,139,0.35)" />
          <line x1="34" x2="34" y1="20" y2="220" stroke="rgba(100,116,139,0.35)" />
          {chart
            ? chart.paths.map((path) => (
                <path
                  d={path.d}
                  fill="none"
                  key={path.label}
                  stroke={path.color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                />
              ))
            : null}
          {chart
            ? chart.points.map((point) => (
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill={point.color}
                  key={`${point.label}-${point.x}-${point.y}`}
                  r="2.8"
                />
              ))
            : null}
        </svg>

        {!chart ? (
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 rounded-md border border-dashed border-border bg-white/90 p-4 text-center text-sm text-muted-foreground shadow-sm">
            No data recorded for this signal
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{chart ? formatShortTime(chart.start) : "Start"}</span>
        <span>{chart ? `${formatNumber(chart.min, 1)} to ${formatNumber(chart.max, 1)}` : "No range"}</span>
        <span>{chart ? formatShortTime(chart.end) : "End"}</span>
      </div>
    </Panel>
  );
}

function buildChart(series: ChartSeries[]) {
  const visibleSeries = series
    .map((item) => ({
      ...item,
      values: item.values.filter(
        (point): point is { at: string; value: number } =>
          point.value !== null &&
          point.value !== undefined &&
          Number.isFinite(point.value)
      ),
    }))
    .filter((item) => item.values.length > 0);

  if (visibleSeries.length === 0) {
    return null;
  }

  const allValues = visibleSeries.flatMap((item) => item.values);
  const times = allValues.map((point) => new Date(point.at).getTime());
  const values = allValues.map((point) => point.value);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;
  const paddedMin = minValue - valueRange * 0.08;
  const paddedMax = maxValue + valueRange * 0.08;
  const paddedRange = paddedMax - paddedMin || 1;

  const toX = (at: string, index: number, length: number) => {
    if (maxTime === minTime) {
      return length <= 1 ? 362 : 34 + (index / (length - 1)) * 656;
    }

    return 34 + ((new Date(at).getTime() - minTime) / (maxTime - minTime)) * 656;
  };

  const toY = (value: number) => 220 - ((value - paddedMin) / paddedRange) * 200;

  const paths = visibleSeries.map((item) => {
    const commands = item.values.map((point, index) => {
      const x = toX(point.at, index, item.values.length);
      const y = toY(point.value);

      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    });

    return {
      color: item.color,
      d: commands.join(" "),
      label: item.label,
    };
  });

  const plottedPoints = visibleSeries.flatMap((item) =>
    item.values.map((point, index) => ({
      color: item.color,
      label: item.label,
      x: toX(point.at, index, item.values.length),
      y: toY(point.value),
    }))
  );

  return {
    end: new Date(maxTime).toISOString(),
    max: maxValue,
    min: minValue,
    paths,
    points: plottedPoints,
    start: new Date(minTime).toISOString(),
  };
}

function Charts({ points }: { points: TelemetryPoint[] }) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <ChartPanel
        title="Speed trace"
        description="Vehicle speed trace from recorded telemetry points."
        series={[
          {
            label: "Speed km/h",
            color: "#0b2a4a",
            values: points.map((point) => ({
              at: point.recorded_at,
              value: point.speed_kmh,
            })),
          },
        ]}
      />
      <ChartPanel
        title="Battery trace"
        description="State of charge through the selected session."
        series={[
          {
            label: "Battery %",
            color: "#1d4ed8",
            values: points.map((point) => ({
              at: point.recorded_at,
              value: point.battery_percent,
            })),
          },
        ]}
      />
      <ChartPanel
        title="Traction vs brake demand"
        description="Demand channel comparison for propulsion and braking."
        series={[
          {
            label: "Traction",
            color: "#0b2a4a",
            values: points.map((point) => ({
              at: point.recorded_at,
              value: point.traction_demand,
            })),
          },
          {
            label: "Brake",
            color: "#b45309",
            values: points.map((point) => ({
              at: point.recorded_at,
              value: point.brake_demand,
            })),
          },
        ]}
      />
      <ChartPanel
        title="Recovered energy"
        description="Energy recovered during the selected telemetry session."
        series={[
          {
            label: "Recovered Wh",
            color: "#047857",
            values: points.map((point) => ({
              at: point.recorded_at,
              value: point.recovered_energy_wh,
            })),
          },
        ]}
      />
      <ChartPanel
        title="Temperature traces"
        description="Thermal readings where temperature channels are present."
        series={[
          {
            label: "Motor deg C",
            color: "#dc2626",
            values: points.map((point) => ({
              at: point.recorded_at,
              value: point.motor_temp_c,
            })),
          },
          {
            label: "Controller deg C",
            color: "#7c3aed",
            values: points.map((point) => ({
              at: point.recorded_at,
              value: point.controller_temp_c,
            })),
          },
        ]}
      />
    </section>
  );
}

function EventsTimeline({ events }: { events: TelemetryEvent[] }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Run log / test timeline
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Typed session events, safety markers, warnings, faults, and run markers.
          </p>
        </div>
        <Clock3 className="size-5 text-primary" aria-hidden="true" />
      </div>

      <div className="relative mt-5">
        <div className="absolute bottom-0 left-[0.68rem] top-0 hidden w-px bg-border sm:block" />
        <div className="grid gap-4">
          {events.length > 0 ? (
            events.map((event) => (
              <article
                className="relative grid gap-3 rounded-lg border border-border bg-muted/20 p-4 sm:ml-8 sm:grid-cols-[10rem_1fr]"
                key={event.id}
              >
                <span className="absolute -left-[2.08rem] top-5 hidden size-3 rounded-full border-2 border-white bg-primary shadow-sm sm:block" />
                <div>
                  <span
                    className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold capitalize ${
                      eventStyles[event.event_type]
                    }`}
                  >
                    {normaliseEventType(event.event_type)}
                  </span>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatShortTime(event.recorded_at)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {event.title}
                  </h3>
                  {event.description ? (
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {event.description}
                    </p>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/25 p-5 text-sm text-muted-foreground">
              No events recorded for this session.
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

function RecordedPointsTable({ points }: { points: TelemetryPoint[] }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-3">
        <TableProperties className="size-5 text-primary" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Recorded points
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest 50 rows from telemetry_points for the selected session.
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted-foreground">
              <TableHead>Recorded at</TableHead>
              <TableHead>Speed</TableHead>
              <TableHead>Battery</TableHead>
              <TableHead>Recovered</TableHead>
              <TableHead>Traction</TableHead>
              <TableHead>Brake</TableHead>
              <TableHead>Brakes</TableHead>
              <TableHead>E-brake</TableHead>
              <TableHead>Auto-stop</TableHead>
              <TableHead>Motor</TableHead>
              <TableHead>Controller</TableHead>
            </tr>
          </thead>
          <tbody>
            {points.length > 0 ? (
              points.map((point) => (
                <tr className="border-t border-border" key={point.id}>
                  <TableCell>{formatShortTime(point.recorded_at)}</TableCell>
                  <TableCell>{formatNumber(point.speed_kmh)}</TableCell>
                  <TableCell>{formatInteger(point.battery_percent)}</TableCell>
                  <TableCell>{formatNumber(point.recovered_energy_wh)}</TableCell>
                  <TableCell>{formatDemand(point.traction_demand)}</TableCell>
                  <TableCell>{formatDemand(point.brake_demand)}</TableCell>
                  <TableCell>
                    {formatBoolean(point.brakes_applied, "Applied", "Released")}
                  </TableCell>
                  <TableCell>{formatBoolean(point.emergency_brake_active)}</TableCell>
                  <TableCell>{formatBoolean(point.auto_stop_active)}</TableCell>
                  <TableCell>{formatNumber(point.motor_temp_c)}</TableCell>
                  <TableCell>{formatNumber(point.controller_temp_c)}</TableCell>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="border-b border-border px-3 py-6 text-center text-muted-foreground"
                  colSpan={11}
                >
                  No telemetry points recorded for this session yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function TableHead({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <th className="border-b border-border bg-muted/50 px-3 py-3 font-semibold first:rounded-l-md last:rounded-r-md">
      {children}
    </th>
  );
}

function TableCell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <td className="border-b border-border px-3 py-3 text-foreground">
      {children}
    </td>
  );
}

function ExpectedSignalsPanel() {
  return (
    <Panel className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        Expected signals
      </p>
      <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
        {EXPECTED_SIGNALS.map((signal) => (
          <li className="flex items-start gap-2" key={signal}>
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{signal}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default async function TelemetryPage({
  searchParams,
}: TelemetryPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: sessionData, error: sessionsError } = await supabase
    .from("telemetry_sessions")
    .select(
      "id, vehicle_id, title, test_run_id, started_at, ended_at, source, notes, created_by, created_at, updated_at"
    )
    .order("started_at", { ascending: false });

  const sessions = (sessionData as TelemetrySession[] | null | undefined) ?? [];
  const selectedSessionId = getSelectedSessionId(params, sessions);
  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;
  const testRunIds = Array.from(
    new Set(
      sessions
        .map((session) => session.test_run_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const [{ data: testRunData }, pointResult, recentPointResult, eventResult] =
    await Promise.all([
      testRunIds.length > 0
        ? supabase.from("test_runs").select("id, title").in("id", testRunIds)
        : Promise.resolve({ data: [] as TestRun[] }),
      selectedSession
        ? supabase
            .from("telemetry_points")
            .select(TELEMETRY_SELECT)
            .eq("session_id", selectedSession.id)
            .order("recorded_at", { ascending: true })
        : Promise.resolve({ data: [] as TelemetryPoint[] }),
      selectedSession
        ? supabase
            .from("telemetry_points")
            .select(TELEMETRY_SELECT)
            .eq("session_id", selectedSession.id)
            .order("recorded_at", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] as TelemetryPoint[] }),
      selectedSession
        ? supabase
            .from("telemetry_events")
            .select(
              "id, session_id, event_type, title, description, recorded_at, payload, created_at"
            )
            .eq("session_id", selectedSession.id)
            .order("recorded_at", { ascending: false })
        : Promise.resolve({ data: [] as TelemetryEvent[] }),
    ]);

  const testRuns = (testRunData as TestRun[] | null | undefined) ?? [];
  const testRunById = new Map(
    testRuns.map((testRun) => [testRun.id, testRun.title])
  );
  const points =
    (pointResult.data as TelemetryPoint[] | null | undefined) ?? [];
  const recentPoints =
    (recentPointResult.data as TelemetryPoint[] | null | undefined) ?? [];
  const events =
    (eventResult.data as TelemetryEvent[] | null | undefined) ?? [];
  const latestPoint = points.at(-1) ?? null;
  const testRunTitle = selectedSession?.test_run_id
    ? testRunById.get(selectedSession.test_run_id) ?? null
    : null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <Header selectedSession={selectedSession} testRunTitle={testRunTitle} />

      {sessionsError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {sessionsError.message}
        </p>
      ) : null}

      <SessionSelector sessions={sessions} selectedSession={selectedSession} />
      <SessionOverview
        selectedSession={selectedSession}
        testRunTitle={testRunTitle}
        pointCount={points.length}
        eventCount={events.length}
        latestPoint={latestPoint}
      />
      <InstrumentCluster
        latestPoint={latestPoint}
        selectedSession={selectedSession}
      />
      <TrackMapPanel points={points} />
      <LatestSnapshot latestPoint={latestPoint} />
      <Charts points={points} />
      <EventsTimeline events={events} />
      <RecordedPointsTable points={recentPoints} />
      {!selectedSession ? <ExpectedSignalsPanel /> : null}
    </div>
  );
}
