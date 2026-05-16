"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Enums, Json } from "@/lib/supabase/database.types";
import { ALL_SUBTEAM_OPTIONS } from "@/lib/team-options";

type AppSubteam = Enums<"app_subteam">;
type PriorityLevel = Enums<"priority_level">;
type ActionStatus = "idle" | "success" | "error";

export type CreateAnnouncementState = {
  status: ActionStatus;
  message: string | null;
};

const PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const satisfies readonly PriorityLevel[];

const ANNOUNCEMENT_SUBTEAMS = ALL_SUBTEAM_OPTIONS.map((option) => option.value);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isPriority(value: string): value is PriorityLevel {
  return (PRIORITIES as readonly string[]).includes(value);
}

function isAnnouncementSubteam(value: string): value is AppSubteam {
  return (ANNOUNCEMENT_SUBTEAMS as readonly string[]).includes(value);
}

function parseExpiry(value: string) {
  if (!value) {
    return { value: null, error: null };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { value: null, error: "Choose a valid expiry date and time." };
  }

  return { value: date.toISOString(), error: null };
}

function getInsertErrorMessage(message: string | undefined) {
  const normalized = message?.toLowerCase() ?? "";

  if (
    normalized.includes("row-level security") ||
    normalized.includes("permission") ||
    normalized.includes("not authorized") ||
    normalized.includes("violates")
  ) {
    return "You do not have permission to create announcements.";
  }

  return message ?? "Announcement could not be posted.";
}

async function requireAnnouncementActor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    profile?.role !== "admin" &&
    profile?.role !== "exec" &&
    profile?.role !== "team_lead"
  ) {
    return null;
  }

  return user;
}

export async function createAnnouncement(
  _previousState: CreateAnnouncementState,
  formData: FormData
): Promise<CreateAnnouncementState> {
  const actor = await requireAnnouncementActor();
  if (!actor) {
    return {
      status: "error",
      message: "You do not have permission to create announcements.",
    };
  }

  const title = getString(formData, "title");
  const body = getString(formData, "body");
  const priorityValue = getString(formData, "priority");
  const targetValue = getString(formData, "target_subteam");
  const pinned = formData.get("pinned") === "on";
  const expiry = parseExpiry(getString(formData, "expires_at"));

  if (!title) {
    return { status: "error", message: "Enter an announcement title." };
  }

  if (!body) {
    return { status: "error", message: "Enter announcement details." };
  }

  if (!isPriority(priorityValue)) {
    return { status: "error", message: "Choose a valid priority." };
  }

  if (expiry.error) {
    return { status: "error", message: expiry.error };
  }

  let targetSubteam: AppSubteam | null = null;
  if (targetValue !== "all") {
    if (!isAnnouncementSubteam(targetValue)) {
      return { status: "error", message: "Choose a valid audience." };
    }

    targetSubteam = targetValue;
  }

  const supabase = await createClient();
  const { data: announcement, error } = await supabase
    .from("announcements")
    .insert({
      title,
      body,
      priority: priorityValue,
      target_subteam: targetSubteam,
      pinned,
      expires_at: expiry.value,
      created_by: actor.id,
    })
    .select("id")
    .single();

  if (error || !announcement) {
    return {
      status: "error",
      message: getInsertErrorMessage(error?.message),
    };
  }

  const payload = {
    title,
    priority: priorityValue,
    pinned,
    target_subteam: targetSubteam,
  } satisfies Json;

  await supabase.from("notification_events").insert({
    event_type: "announcement_created",
    actor_id: actor.id,
    target_subteam: targetSubteam,
    entity_table: "announcements",
    entity_id: announcement.id,
    payload,
  });

  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Announcement posted.",
  };
}
