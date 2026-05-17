"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  AlertTriangle,
  CalendarClock,
  MessageSquare,
  Plus,
  Save,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database, Enums } from "@/lib/supabase/database.types";
import { ALL_SUBTEAM_OPTIONS, getSubteamLabel } from "@/lib/team-options";
import { getMemberDisplayName } from "@/lib/member-display";
import { cn } from "@/lib/utils";
import {
  addFaultComment,
  createFault,
  updateFault,
  type FaultActionState,
} from "./actions";

type FaultStatus = Enums<"fault_status">;
type PriorityLevel = Enums<"priority_level">;

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "email"
  | "full_name"
  | "preferred_name"
  | "role"
  | "subteam"
  | "team_title"
>;

export type FaultPersonOption = ProfileRow;

export type FaultTestRunOption = Pick<
  Database["public"]["Tables"]["test_runs"]["Row"],
  "id" | "title" | "scheduled_start"
>;

export type FaultCommentView = Pick<
  Database["public"]["Tables"]["fault_comments"]["Row"],
  "id" | "body" | "created_at"
> & {
  author: FaultPersonOption | null;
};

export type FaultView = Pick<
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
> & {
  reporter: FaultPersonOption | null;
  assignee: FaultPersonOption | null;
  linkedTestRunTitle: string | null;
  comments: FaultCommentView[];
};

const initialState: FaultActionState = {
  status: "idle",
  message: null,
};

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const satisfies ReadonlyArray<{ value: PriorityLevel; label: string }>;

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "fixed", label: "Fixed" },
  { value: "verified_closed", label: "Verified closed" },
  { value: "rejected", label: "Rejected" },
] as const satisfies ReadonlyArray<{ value: FaultStatus; label: string }>;

const severityStyles: Record<PriorityLevel, string> = {
  low: "border-border bg-muted text-muted-foreground",
  medium: "border-ring/15 bg-accent text-primary",
  high: "border-orange-200 bg-orange-50 text-orange-800",
  critical: "border-red-200 bg-red-50 text-red-800",
};

const statusStyles: Record<FaultStatus, string> = {
  open: "border-blue-200 bg-blue-50 text-blue-800",
  investigating: "border-amber-200 bg-amber-50 text-amber-800",
  fixed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  verified_closed: "border-zinc-200 bg-zinc-100 text-zinc-700",
  rejected: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

function formatValue(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function truncate(value: string | null) {
  if (!value) {
    return "No description provided yet.";
  }

  return value.length > 180 ? `${value.slice(0, 177).trim()}...` : value;
}

function SubmitButton({
  children,
  icon: Icon,
  pendingText,
  variant = "default",
}: {
  children: string;
  icon: typeof Save;
  pendingText: string;
  variant?: "default" | "outline";
}) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit" variant={variant}>
      <Icon className="size-4" aria-hidden="true" />
      {pending ? pendingText : children}
    </Button>
  );
}

function ActionMessage({ state }: { state: FaultActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <p
      className={cn(
        "rounded-md border px-3 py-2 text-sm leading-6",
        state.status === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-destructive/25 bg-destructive/10 text-destructive"
      )}
    >
      {state.message}
    </p>
  );
}

export function ReportFaultDialog({
  profiles,
  testRuns,
}: {
  profiles: FaultPersonOption[];
  testRuns: FaultTestRunOption[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [state, formAction] = useActionState(async (
    previousState: FaultActionState,
    formData: FormData
  ) => {
    const nextState = await createFault(previousState, formData);

    if (nextState.status === "success") {
      formRef.current?.reset();
      setIsOpen(false);
      setToast(nextState.message ?? "Fault reported.");
      router.refresh();

      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }

      toastTimeoutRef.current = window.setTimeout(() => {
        setToast(null);
        toastTimeoutRef.current = null;
      }, 4200);
    }

    return nextState;
  }, initialState);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} type="button">
        <Plus className="size-4" aria-hidden="true" />
        Report fault
      </Button>

      {toast ? (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg">
          {toast}
        </div>
      ) : null}

      {isOpen ? (
        <div
          aria-labelledby="report-fault-title"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/25 px-4 py-5 backdrop-blur-sm sm:items-center"
          role="dialog"
        >
          <div className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card shadow-2xl shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Issue control
                </p>
                <h2
                  className="mt-1 text-xl font-semibold tracking-tight text-foreground"
                  id="report-fault-title"
                >
                  Report fault
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Capture a defect, safety concern, or testing blocker for triage.
                </p>
              </div>
              <button
                aria-label="Close fault form"
                className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <form action={formAction} className="grid gap-4 p-5" ref={formRef}>
              <ActionMessage state={state} />

              <label className="space-y-2 text-sm font-medium text-foreground">
                Title
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                  name="title"
                  placeholder="Brake pressure drop during bench test"
                  required
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-foreground">
                Description
                <textarea
                  className="min-h-28 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                  name="description"
                  placeholder="Summarise what happened, where it was seen, and any immediate workarounds."
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-foreground">
                  Subsystem
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                    defaultValue=""
                    name="subsystem"
                    required
                  >
                    <option disabled value="">
                      Choose subsystem
                    </option>
                    {ALL_SUBTEAM_OPTIONS.map((option) => (
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
                    defaultValue="medium"
                    name="severity"
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-foreground">
                  Assigned to
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                    defaultValue=""
                    name="assigned_to"
                  >
                    <option value="">Unassigned</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {getMemberDisplayName(profile)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-foreground">
                  Due date
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                    name="due_at"
                    type="datetime-local"
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm font-medium text-foreground">
                Linked test run
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                  defaultValue=""
                  name="linked_test_run_id"
                >
                  <option value="">No linked test run</option>
                  {testRuns.map((testRun) => (
                    <option key={testRun.id} value={testRun.id}>
                      {testRun.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex min-h-10 items-center gap-3 rounded-md border border-border bg-muted/35 px-3 text-sm font-medium text-foreground">
                  <input
                    className="size-4 rounded border-input accent-primary"
                    name="safety_critical"
                    type="checkbox"
                  />
                  Safety critical
                </label>

                <label className="flex min-h-10 items-center gap-3 rounded-md border border-border bg-muted/35 px-3 text-sm font-medium text-foreground">
                  <input
                    className="size-4 rounded border-input accent-primary"
                    name="blocks_testing"
                    type="checkbox"
                  />
                  Blocks testing
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  onClick={() => setIsOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <SubmitButton icon={ShieldAlert} pendingText="Reporting...">
                  Report fault
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function FaultCard({
  fault,
  profiles,
}: {
  fault: FaultView;
  profiles: FaultPersonOption[];
}) {
  const router = useRouter();
  const commentFormRef = useRef<HTMLFormElement>(null);
  const isPriorityFault =
    fault.severity === "critical" || fault.safety_critical || fault.blocks_testing;
  const dueDate = formatDate(fault.due_at);
  const createdDate = formatDate(fault.created_at);
  const [updateState, updateAction] = useActionState(async (
    previousState: FaultActionState,
    formData: FormData
  ) => {
    const nextState = await updateFault(previousState, formData);

    if (nextState.status === "success") {
      router.refresh();
    }

    return nextState;
  }, initialState);
  const [commentState, commentAction] = useActionState(async (
    previousState: FaultActionState,
    formData: FormData
  ) => {
    const nextState = await addFaultComment(previousState, formData);

    if (nextState.status === "success") {
      commentFormRef.current?.reset();
      router.refresh();
    }

    return nextState;
  }, initialState);

  return (
    <article
      className={cn(
        "animate-card-in rounded-xl border bg-card p-5 shadow-sm",
        isPriorityFault
          ? "border-red-200 shadow-red-950/5"
          : "border-border"
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {isPriorityFault ? (
              <AlertTriangle className="size-4 shrink-0 text-red-700" />
            ) : null}
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {fault.title}
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {truncate(fault.description)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span
            className={cn(
              "inline-flex rounded-md border px-2 py-1 text-xs font-medium",
              statusStyles[fault.status]
            )}
          >
            {formatValue(fault.status)}
          </span>
          <span
            className={cn(
              "inline-flex rounded-md border px-2 py-1 text-xs font-medium",
              severityStyles[fault.severity]
            )}
          >
            {formatValue(fault.severity)}
          </span>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Subsystem
          </dt>
          <dd className="mt-1 font-medium text-foreground">
            {getSubteamLabel(fault.subsystem)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reporter
          </dt>
          <dd className="mt-1 font-medium text-foreground">
            {getMemberDisplayName(fault.reporter)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Assigned
          </dt>
          <dd className="mt-1 font-medium text-foreground">
            {fault.assignee ? getMemberDisplayName(fault.assignee) : "Unassigned"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Created
          </dt>
          <dd className="mt-1 font-medium text-foreground">
            {createdDate ?? "Unknown"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
        {fault.safety_critical ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-red-800">
            <ShieldAlert className="size-3.5" aria-hidden="true" />
            Safety critical
          </span>
        ) : null}
        {fault.blocks_testing ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-amber-800">
            <AlertTriangle className="size-3.5" aria-hidden="true" />
            Blocks testing
          </span>
        ) : null}
        {dueDate ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-muted-foreground">
            <CalendarClock className="size-3.5" aria-hidden="true" />
            Due {dueDate}
          </span>
        ) : null}
        {fault.linkedTestRunTitle ? (
          <span className="inline-flex rounded-md border border-border bg-muted px-2 py-1 text-muted-foreground">
            Linked: {fault.linkedTestRunTitle}
          </span>
        ) : null}
      </div>

      <details className="mt-5 rounded-lg border border-border bg-muted/20">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-foreground">
          Update fault and comments
        </summary>

        <div className="grid gap-5 border-t border-border p-4">
          <form action={updateAction} className="grid gap-4">
            <input name="fault_id" type="hidden" value={fault.id} />
            <ActionMessage state={updateState} />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2 text-sm font-medium text-foreground">
                Status
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                  defaultValue={fault.status}
                  name="status"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-foreground">
                Assigned to
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                  defaultValue={fault.assigned_to ?? ""}
                  name="assigned_to"
                >
                  <option value="">Unassigned</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {getMemberDisplayName(profile)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-foreground">
                Due date
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                  defaultValue={formatDateTimeLocal(fault.due_at)}
                  name="due_at"
                  type="datetime-local"
                />
              </label>

              <div className="grid gap-2 md:self-end">
                <label className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground">
                  <input
                    className="size-4 rounded border-input accent-primary"
                    defaultChecked={fault.safety_critical}
                    name="safety_critical"
                    type="checkbox"
                  />
                  Safety critical
                </label>
                <label className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground">
                  <input
                    className="size-4 rounded border-input accent-primary"
                    defaultChecked={fault.blocks_testing}
                    name="blocks_testing"
                    type="checkbox"
                  />
                  Blocks testing
                </label>
              </div>
            </div>

            <label className="space-y-2 text-sm font-medium text-foreground">
              Status note
              <input
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                name="status_note"
                placeholder="Optional note for status history"
              />
            </label>

            <div className="flex justify-end">
              <SubmitButton icon={Save} pendingText="Saving...">
                Save changes
              </SubmitButton>
            </div>
          </form>

          <div className="border-t border-border pt-5">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-foreground">
                Comments
              </h3>
            </div>

            <div className="grid gap-3">
              {fault.comments.length > 0 ? (
                fault.comments.map((comment) => (
                  <article
                    className="rounded-md border border-border bg-card px-3 py-2"
                    key={comment.id}
                  >
                    <p className="text-sm leading-6 text-foreground">
                      {comment.body}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getMemberDisplayName(comment.author)} ·{" "}
                      {formatDate(comment.created_at)}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                  No comments yet.
                </p>
              )}
            </div>

            <form
              action={commentAction}
              className="mt-4 grid gap-3"
              ref={commentFormRef}
            >
              <input name="fault_id" type="hidden" value={fault.id} />
              <ActionMessage state={commentState} />
              <label className="space-y-2 text-sm font-medium text-foreground">
                Add comment
                <textarea
                  className="min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                  name="body"
                  placeholder="Add triage notes, updates, or closure evidence."
                  required
                />
              </label>
              <div className="flex justify-end">
                <SubmitButton icon={Send} pendingText="Adding..." variant="outline">
                  Add comment
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      </details>
    </article>
  );
}
