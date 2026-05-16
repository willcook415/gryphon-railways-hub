import type { Enums } from "@/lib/supabase/database.types";

export type AppSubteam = Enums<"app_subteam">;

export const ALL_SUBTEAM_OPTIONS = [
  { value: "structures", label: "Structures" },
  { value: "powertrain", label: "Powertrain" },
  { value: "vehicle_systems", label: "Vehicle Systems" },
  { value: "manufacturing_testing", label: "Manufacturing & Testing" },
  { value: "systems_engineering", label: "Systems Engineering" },
  { value: "business_ops", label: "Business Operations" },
  { value: "executive_board", label: "Executive Board" },
  { value: "mechanical_design", label: "Mechanical Design" },
  { value: "sponsorship_finance", label: "Sponsorship & Finance" },
  { value: "marketing", label: "Marketing" },
  { value: "welfare_inclusion", label: "Welfare & Inclusion" },
] as const satisfies ReadonlyArray<{ value: AppSubteam; label: string }>;

export const ACTIVE_SUBTEAM_OPTIONS = [
  { value: "executive_board", label: "Executive Board" },
  { value: "mechanical_design", label: "Mechanical Design" },
  { value: "powertrain", label: "Powertrain" },
  { value: "vehicle_systems", label: "Vehicle Systems" },
  { value: "sponsorship_finance", label: "Sponsorship & Finance" },
  { value: "marketing", label: "Marketing" },
  { value: "welfare_inclusion", label: "Welfare & Inclusion" },
] as const satisfies ReadonlyArray<{ value: AppSubteam; label: string }>;

export type ActiveSubteam = (typeof ACTIVE_SUBTEAM_OPTIONS)[number]["value"];

export const DEFAULT_ACTIVE_SUBTEAM: ActiveSubteam = "mechanical_design";

export const ACTIVE_SUBTEAM_VALUES = ACTIVE_SUBTEAM_OPTIONS.map(
  (option) => option.value
);

export function isActiveSubteam(value: unknown): value is ActiveSubteam {
  return (
    typeof value === "string" &&
    (ACTIVE_SUBTEAM_VALUES as readonly string[]).includes(value)
  );
}

export function getSubteamLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return (
    ALL_SUBTEAM_OPTIONS.find((option) => option.value === value)?.label ??
    "Legacy team"
  );
}
