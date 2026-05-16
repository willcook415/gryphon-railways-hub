"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Megaphone, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ALL_SUBTEAM_OPTIONS } from "@/lib/team-options";
import { createAnnouncement, type CreateAnnouncementState } from "./actions";

const initialState: CreateAnnouncementState = {
  status: "idle",
  message: null,
};

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit">
      <Megaphone className="size-4" aria-hidden="true" />
      {pending ? "Posting..." : "Post announcement"}
    </Button>
  );
}

export function AddAnnouncementDialog() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [state, formAction] = useActionState(async (
    previousState: CreateAnnouncementState,
    formData: FormData
  ) => {
    const nextState = await createAnnouncement(previousState, formData);

    if (nextState.status === "success") {
      formRef.current?.reset();
      setIsOpen(false);
      setToast(nextState.message ?? "Announcement posted.");
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
      <Button onClick={() => setIsOpen(true)} type="button" variant="outline">
        <Plus className="size-4" aria-hidden="true" />
        Add announcement
      </Button>

      {toast ? (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg">
          {toast}
        </div>
      ) : null}

      {isOpen ? (
        <div
          aria-labelledby="add-announcement-title"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/25 px-4 py-5 backdrop-blur-sm sm:items-center"
          role="dialog"
        >
          <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card shadow-2xl shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Team notice
                </p>
                <h2
                  className="mt-1 text-xl font-semibold tracking-tight text-foreground"
                  id="add-announcement-title"
                >
                  Add announcement
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Share an operational update with the whole team or a specific
                  sub-team.
                </p>
              </div>
              <button
                aria-label="Close announcement form"
                className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <form action={formAction} className="grid gap-4 p-5" ref={formRef}>
              {state.status === "error" && state.message ? (
                <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive">
                  {state.message}
                </p>
              ) : null}

              <label className="space-y-2 text-sm font-medium text-foreground">
                Title
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                  name="title"
                  placeholder="Testing plan updated"
                  required
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-foreground">
                Body
                <textarea
                  className="min-h-32 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                  name="body"
                  placeholder="Share the update members need to know."
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-foreground">
                  Priority
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                    defaultValue="medium"
                    name="priority"
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-foreground">
                  Target sub-team
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                    defaultValue="all"
                    name="target_subteam"
                  >
                    <option value="all">All teams</option>
                    {ALL_SUBTEAM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-foreground">
                  Expiry date and time
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
                    name="expires_at"
                    type="datetime-local"
                  />
                </label>

                <label className="flex min-h-10 items-center gap-3 rounded-md border border-border bg-muted/35 px-3 text-sm font-medium text-foreground sm:self-end">
                  <input
                    className="size-4 rounded border-input accent-primary"
                    name="pinned"
                    type="checkbox"
                  />
                  Pinned announcement
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
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
