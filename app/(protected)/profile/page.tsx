import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { PageHeader } from "@/components/feature-page";
import { getSubteamLabel } from "@/lib/team-options";

type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "email" | "full_name" | "preferred_name" | "role" | "subteam" | "is_active"
>;

const PROFILE_SELECT =
  "email, full_name, preferred_name, role, subteam, is_active";

function formatValue(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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

  const rows = [
    ["Email", profile?.email ?? user?.email ?? null],
    ["Full name", profile?.full_name ?? null],
    ["Preferred name", profile?.preferred_name ?? null],
    ["Role", formatValue(profile?.role)],
    ["Subteam", getSubteamLabel(profile?.subteam)],
    ["Status", profile?.is_active ? "Active" : "Inactive"],
  ];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Your Gryphon Hub identity and access context. Admins can adjust roles and subteams from member management."
      />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="grid gap-3 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div className="rounded-md border border-slate-200 p-4" key={label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
              </dt>
              <dd className="mt-1 break-words text-sm font-medium text-slate-950">
                {value ?? "Not set"}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
