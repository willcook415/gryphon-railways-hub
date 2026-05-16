import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { PageHeader } from "@/components/feature-page";
import { getSubteamLabel } from "@/lib/team-options";
import {
  getMemberDisplayName,
  getMemberDisplayTitle,
} from "@/lib/member-display";

type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "email"
  | "full_name"
  | "preferred_name"
  | "role"
  | "subteam"
  | "team_title"
  | "is_active"
>;

const PROFILE_SELECT =
  "email, full_name, preferred_name, role, subteam, team_title, is_active";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user?.id ?? "")
    .maybeSingle<Profile>();

  const displayName = getMemberDisplayName(profile, user?.email ?? null);
  const displayTitle = getMemberDisplayTitle(profile);
  const rows = [
    ["Name", displayName],
    ["Team title", displayTitle],
    ["Sub-team", getSubteamLabel(profile?.subteam)],
    ["Email", profile?.email ?? user?.email ?? null],
    ["Status", profile?.is_active ? "Active" : "Inactive"],
  ];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Your Gryphon Railways Hub identity and team context. Admins can update public titles and team membership from member management."
      />

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <dl className="grid gap-3 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div className="rounded-lg border border-border bg-muted/25 p-4" key={label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 break-words text-sm font-medium text-foreground">
                {value ?? "Not set"}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
