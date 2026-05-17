"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Constants,
  type Database,
  type Enums,
} from "@/lib/supabase/database.types";

type AppSubteam = Enums<"app_subteam">;
type FaultStatus = Enums<"fault_status">;
type PriorityLevel = Enums<"priority_level">;
type ActionStatus = "idle" | "success" | "error";

type FaultUpdate = Database["public"]["Tables"]["faults"]["Update"];

export type FaultActionState = {
  status: ActionStatus;
  message: string | null;
};

const PRIORITIES = Constants.public.Enums.priority_level;
const FAULT_STATUSES = Constants.public.Enums.fault_status;
const SUBTEAMS = Constants.public.Enums.app_subteam;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value ? value : null;
}

function isPriority(value: string): value is PriorityLevel {
  return (PRIORITIES as readonly string[]).includes(value);
}

function isFaultStatus(value: string): value is FaultStatus {
  return (FAULT_STATUSES as readonly string[]).includes(value);
}

function isSubteam(value: string): value is AppSubteam {
  return (SUBTEAMS as readonly string[]).includes(value);
}

function parseOptionalDateTime(value: string) {
  if (!value) {
    return { value: null, error: null };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { value: null, error: "Choose a valid due date and time." };
  }

  return { value: date.toISOString(), error: null };
}

function getRlsFriendlyMessage(message: string | undefined, fallback: string) {
  const normalized = message?.toLowerCase() ?? "";

  if (
    normalized.includes("row-level security") ||
    normalized.includes("permission") ||
    normalized.includes("not authorized") ||
    normalized.includes("violates")
  ) {
    return "You do not have permission to make that change.";
  }

  return message ?? fallback;
}

async function requireFaultActor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_active === false) {
    return null;
  }

  return user;
}

export async function createFault(
  _previousState: FaultActionState,
  formData: FormData
): Promise<FaultActionState> {
  const actor = await requireFaultActor();
  if (!actor) {
    return {
      status: "error",
      message: "Your account is not active, so you cannot report faults.",
    };
  }

  const title = getString(formData, "title");
  const description = getOptionalString(formData, "description");
  const subsystemValue = getString(formData, "subsystem");
  const severityValue = getString(formData, "severity") || "medium";
  const assignedTo = getOptionalString(formData, "assigned_to");
  const linkedTestRunId = getOptionalString(formData, "linked_test_run_id");
  const dueAt = parseOptionalDateTime(getString(formData, "due_at"));
  const safetyCritical = formData.get("safety_critical") === "on";
  const blocksTesting = formData.get("blocks_testing") === "on";

  if (!title) {
    return { status: "error", message: "Enter a fault title." };
  }

  if (!isSubteam(subsystemValue)) {
    return { status: "error", message: "Choose a valid subsystem." };
  }

  if (!isPriority(severityValue)) {
    return { status: "error", message: "Choose a valid severity." };
  }

  if (dueAt.error) {
    return { status: "error", message: dueAt.error };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("faults").insert({
    title,
    description,
    subsystem: subsystemValue,
    severity: severityValue,
    safety_critical: safetyCritical,
    blocks_testing: blocksTesting,
    assigned_to: assignedTo,
    due_at: dueAt.value,
    linked_test_run_id: linkedTestRunId,
    reported_by: actor.id,
  });

  if (error) {
    return {
      status: "error",
      message: getRlsFriendlyMessage(error.message, "Fault could not be reported."),
    };
  }

  revalidatePath("/faults");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Fault reported.",
  };
}

export async function addFaultComment(
  _previousState: FaultActionState,
  formData: FormData
): Promise<FaultActionState> {
  const actor = await requireFaultActor();
  if (!actor) {
    return {
      status: "error",
      message: "Your account is not active, so you cannot comment on faults.",
    };
  }

  const faultId = getString(formData, "fault_id");
  const body = getString(formData, "body");

  if (!faultId) {
    return { status: "error", message: "Choose a fault to comment on." };
  }

  if (!body) {
    return { status: "error", message: "Enter a comment." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("fault_comments").insert({
    fault_id: faultId,
    body,
    author_id: actor.id,
  });

  if (error) {
    return {
      status: "error",
      message: getRlsFriendlyMessage(error.message, "Comment could not be added."),
    };
  }

  revalidatePath("/faults");

  return {
    status: "success",
    message: "Comment added.",
  };
}

export async function updateFault(
  _previousState: FaultActionState,
  formData: FormData
): Promise<FaultActionState> {
  const actor = await requireFaultActor();
  if (!actor) {
    return {
      status: "error",
      message: "Your account is not active, so you cannot update faults.",
    };
  }

  const faultId = getString(formData, "fault_id");
  const statusValue = getString(formData, "status");
  const assignedTo = getOptionalString(formData, "assigned_to");
  const dueAt = parseOptionalDateTime(getString(formData, "due_at"));
  const safetyCritical = formData.get("safety_critical") === "on";
  const blocksTesting = formData.get("blocks_testing") === "on";
  const note = getOptionalString(formData, "status_note");

  if (!faultId) {
    return { status: "error", message: "Choose a fault to update." };
  }

  if (!isFaultStatus(statusValue)) {
    return { status: "error", message: "Choose a valid status." };
  }

  if (dueAt.error) {
    return { status: "error", message: dueAt.error };
  }

  const supabase = await createClient();
  const { data: currentFault, error: currentError } = await supabase
    .from("faults")
    .select("status, fixed_at, verified_closed_at")
    .eq("id", faultId)
    .maybeSingle();

  if (currentError || !currentFault) {
    return {
      status: "error",
      message: getRlsFriendlyMessage(
        currentError?.message,
        "Fault could not be loaded for update."
      ),
    };
  }

  const now = new Date().toISOString();
  const updates: FaultUpdate = {
    status: statusValue,
    assigned_to: assignedTo,
    due_at: dueAt.value,
    safety_critical: safetyCritical,
    blocks_testing: blocksTesting,
  };

  if (
    (statusValue === "fixed" || statusValue === "verified_closed") &&
    !currentFault.fixed_at
  ) {
    updates.fixed_at = now;
    updates.fixed_by = actor.id;
  }

  if (statusValue === "verified_closed") {
    updates.verified_closed_at = currentFault.verified_closed_at ?? now;
    updates.verified_closed_by = actor.id;
  } else if (currentFault.status === "verified_closed") {
    updates.verified_closed_at = null;
    updates.verified_closed_by = null;
  }

  const statusChanged = currentFault.status !== statusValue;
  const { error: updateError } = await supabase
    .from("faults")
    .update(updates)
    .eq("id", faultId);

  if (updateError) {
    return {
      status: "error",
      message: getRlsFriendlyMessage(updateError.message, "Fault could not be updated."),
    };
  }

  if (statusChanged) {
    const { error: historyError } = await supabase
      .from("fault_status_history")
      .insert({
        fault_id: faultId,
        old_status: currentFault.status,
        new_status: statusValue,
        changed_by: actor.id,
        note,
      });

    if (historyError) {
      return {
        status: "error",
        message: getRlsFriendlyMessage(
          historyError.message,
          "Fault was updated, but status history could not be recorded."
        ),
      };
    }
  }

  revalidatePath("/faults");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Fault updated.",
  };
}
