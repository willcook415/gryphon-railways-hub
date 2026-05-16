import type { Database } from "@/lib/supabase/database.types";
import { getSubteamLabel } from "@/lib/team-options";

type AppRole = Database["public"]["Enums"]["app_role"];
type AppSubteam = Database["public"]["Enums"]["app_subteam"];

export type MemberDisplayProfile = {
  email: string | null;
  full_name: string | null;
  preferred_name: string | null;
  role: AppRole | null;
  subteam: AppSubteam | null;
  team_title: string | null;
};

function clean(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
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

export function getMemberDisplayName(
  profile: Partial<MemberDisplayProfile> | null | undefined,
  fallbackEmail?: string | null,
  options: { preferPreferredName?: boolean } = {}
) {
  const email = clean(profile?.email) ?? clean(fallbackEmail);
  const fullName = clean(profile?.full_name);
  const preferredName = clean(profile?.preferred_name);
  const preferPreferredName = options.preferPreferredName ?? false;

  if (
    preferPreferredName &&
    preferredName &&
    !looksLikeIdentifier(preferredName, email)
  ) {
    return preferredName;
  }

  if (fullName) {
    return fullName;
  }

  if (preferredName && !looksLikeIdentifier(preferredName, email)) {
    return preferredName;
  }

  return email ?? "Team member";
}

export function getMemberFirstName(
  profile: Partial<MemberDisplayProfile> | null | undefined,
  fallbackEmail?: string | null
) {
  return getMemberDisplayName(profile, fallbackEmail, {
    preferPreferredName: true,
  }).split(/\s+/)[0];
}

export function getMemberDisplayTitle(
  profile: Partial<MemberDisplayProfile> | null | undefined
) {
  const teamTitle = clean(profile?.team_title);
  const subteam = profile?.subteam ?? null;

  if (subteam === "executive_board" && teamTitle) {
    return `Executive Board · ${teamTitle}`;
  }

  if (teamTitle) {
    return teamTitle;
  }

  if (profile?.role === "viewer") {
    return "Viewer";
  }

  const teamLabel = getSubteamLabel(subteam);
  return teamLabel === "Not set" || teamLabel === "Legacy team"
    ? "Team Member"
    : `${teamLabel} Member`;
}
