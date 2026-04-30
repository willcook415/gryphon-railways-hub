"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";
import {
  getSubteamLabel,
  isActiveSubteam,
  type ActiveSubteam,
} from "@/lib/team-options";
import { sendAnnouncementPush } from "@/lib/notifications/send-announcement-push";

type PriorityLevel = Enums<"priority_level">;

const PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const satisfies readonly PriorityLevel[];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getDashboardRedirect(params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return `/dashboard?${query.toString()}`;
}

function isPriority(value: string): value is PriorityLevel {
  return (PRIORITIES as readonly string[]).includes(value);
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

  if (profile?.role !== "admin" && profile?.role !== "exec") {
    redirect("/dashboard");
  }

  return user;
}

export async function createAnnouncement(formData: FormData) {
  const actor = await requireAnnouncementActor();
  const title = getString(formData, "title");
  const body = getString(formData, "body");
  const priorityValue = getString(formData, "priority");
  const targetValue = getString(formData, "target_subteam");
  const pinned = formData.get("pinned") === "on";

  if (!title) {
    redirect(getDashboardRedirect({ error: "Enter an announcement title." }));
  }

  if (!body) {
    redirect(getDashboardRedirect({ error: "Enter announcement details." }));
  }

  if (!isPriority(priorityValue)) {
    redirect(getDashboardRedirect({ error: "Choose a valid priority." }));
  }

  let targetSubteam: ActiveSubteam | null = null;
  if (targetValue !== "all") {
    if (!isActiveSubteam(targetValue)) {
      redirect(getDashboardRedirect({ error: "Choose a valid audience." }));
    }

    targetSubteam = targetValue;
  }

  const admin = createAdminClient();
  const { data: announcement, error } = await admin
    .from("announcements")
    .insert({
      title,
      body,
      priority: priorityValue,
      target_subteam: targetSubteam,
      pinned,
      created_by: actor.id,
    })
    .select("id")
    .single();

  if (error || !announcement) {
    redirect(
      getDashboardRedirect({
        error: error?.message ?? "Announcement could not be posted.",
      })
    );
  }

  const targetLabel = targetSubteam ? getSubteamLabel(targetSubteam) : "All team";
  const pushResult = await sendAnnouncementPush({
    announcementId: announcement.id,
    actorId: actor.id,
    title,
    priority: priorityValue,
    targetLabel,
    targetSubteam,
  });

  revalidatePath("/dashboard");

  redirect(
    getDashboardRedirect({
      message: "Announcement posted.",
      ...(pushResult.warning ? { warning: pushResult.warning } : {}),
    })
  );
}
