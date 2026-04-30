import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  Constants,
  type Database,
  type Enums,
} from "@/lib/supabase/database.types";
import {
  ACTIVE_SUBTEAM_OPTIONS,
  DEFAULT_ACTIVE_SUBTEAM,
  getSubteamLabel,
  isActiveSubteam,
} from "@/lib/team-options";
import { inviteMember, setMemberPassword, updateMember } from "./actions";

type AppRole = Enums<"app_role">;
type AppSubteam = Enums<"app_subteam">;
type MemberInvitationStatus = Enums<"invitation_status">;

const APP_ROLES = Constants.public.Enums.app_role;
const MEMBER_INVITATION_STATUSES = Constants.public.Enums.invitation_status;

type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "email"
  | "full_name"
  | "preferred_name"
  | "role"
  | "subteam"
  | "is_active"
  | "created_at"
  | "updated_at"
>;

type Invitation =
  Database["public"]["Tables"]["member_invitations"]["Row"];

type AdminMembersPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

function formatValue(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: MemberInvitationStatus }) {
  const styles: Record<MemberInvitationStatus, string> = {
    pending: "border-amber-300 bg-amber-50 text-amber-800",
    failed: "border-destructive/30 bg-destructive/10 text-destructive",
    revoked: "border-zinc-300 bg-zinc-100 text-zinc-700",
    accepted: "border-emerald-300 bg-emerald-50 text-emerald-800",
    expired: "border-zinc-300 bg-zinc-100 text-zinc-700",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${styles[status]}`}
    >
      {formatValue(status)}
    </span>
  );
}

function SelectRole({ defaultValue }: { defaultValue: AppRole }) {
  return (
    <select
      className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      defaultValue={defaultValue}
      name="role"
    >
      {APP_ROLES.map((role) => (
        <option key={role} value={role}>
          {formatValue(role)}
        </option>
      ))}
    </select>
  );
}

function SelectSubteam({ defaultValue }: { defaultValue: AppSubteam | null }) {
  const activeDefault = isActiveSubteam(defaultValue)
    ? defaultValue
    : DEFAULT_ACTIVE_SUBTEAM;
  const isLegacyValue = Boolean(defaultValue) && !isActiveSubteam(defaultValue);

  return (
    <div className="space-y-2">
      <select
        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        defaultValue={activeDefault}
        name="subteam"
      >
        {ACTIVE_SUBTEAM_OPTIONS.map((subteam) => (
          <option key={subteam.value} value={subteam.value}>
            {subteam.label}
          </option>
        ))}
      </select>
      {isLegacyValue ? (
        <p className="text-xs leading-5 text-muted-foreground">
          Current saved team is legacy. Choose an active team before saving.
        </p>
      ) : null}
    </div>
  );
}

async function requireAdminAccess() {
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

export default async function AdminMembersPage({
  searchParams,
}: AdminMembersPageProps) {
  await requireAdminAccess();
  const params = await searchParams;
  const admin = createAdminClient();

  const [{ data: members, error: membersError }, { data: invitations, error: invitationsError }] =
    await Promise.all([
      admin
        .from("profiles")
        .select(
          "id, email, full_name, preferred_name, role, subteam, is_active, created_at, updated_at"
        )
        .order("full_name", { ascending: true }),
      admin
        .from("member_invitations")
        .select("*")
        .in("status", MEMBER_INVITATION_STATUSES)
        .order("created_at", { ascending: false }),
    ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-lg border bg-background p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Gryphon Hub Admin
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Member management
              </h1>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Create member accounts and manage profile access.
              </p>
            </div>
            <Button asChild variant="outline">
              <a href="/dashboard">Dashboard</a>
            </Button>
          </div>
        </header>

        {params.error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {params.error}
          </div>
        ) : null}

        {params.message ? (
          <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {params.message}
          </div>
        ) : null}

        <section className="rounded-lg border bg-background p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Add a member</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Creates or updates the member account profile for Gryphon Hub
              access. Share the initial password securely with the member.
            </p>
          </div>

          <form action={inviteMember} className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Email
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                name="email"
                placeholder="user@leeds.ac.uk"
                required
                type="email"
              />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Full name
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                name="full_name"
                placeholder="Alex Taylor"
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Initial password
              <input
                autoComplete="new-password"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                minLength={8}
                name="initial_password"
                placeholder="Minimum 8 characters"
                required
                type="password"
              />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Confirm initial password
              <input
                autoComplete="new-password"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                minLength={8}
                name="confirm_initial_password"
                placeholder="Repeat password"
                required
                type="password"
              />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Role
              <SelectRole defaultValue="member" />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Subteam
              <SelectSubteam defaultValue={DEFAULT_ACTIVE_SUBTEAM} />
            </label>

            <label className="flex h-10 items-center gap-2 text-sm font-medium">
              <input
                className="size-4 rounded border-input"
                defaultChecked
                name="is_active"
                type="checkbox"
              />
              Active
            </label>

            <div className="sm:col-span-2">
              <Button type="submit">Create member</Button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border bg-background p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Current members</h2>
              <p className="text-sm text-muted-foreground">
                Profiles from the Gryphon Hub member directory.
              </p>
            </div>
            <span className="text-sm text-muted-foreground">
              {members?.length ?? 0} total
            </span>
          </div>

          {membersError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {membersError.message}
            </p>
          ) : null}

          <div className="grid gap-3">
            {(members as Profile[] | null)?.map((member) => (
              <article className="rounded-md border p-4" key={member.id}>
                <div className="flex flex-col gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">
                      {member.full_name ??
                        member.preferred_name ??
                        member.email ??
                        "Unnamed member"}
                    </h3>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {member.email ?? "No email"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Updated {formatDate(member.updated_at)}
                    </p>
                  </div>

                  <form action={updateMember}>
                    <input name="id" type="hidden" value={member.id} />
                    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
                      <label className="space-y-2 text-sm font-medium">
                        Role
                        <SelectRole defaultValue={member.role} />
                      </label>

                      <label className="space-y-2 text-sm font-medium">
                        Subteam
                        <SelectSubteam defaultValue={member.subteam} />
                      </label>

                      <label className="flex h-9 items-center gap-2 text-sm font-medium">
                        <input
                          className="size-4 rounded border-input"
                          defaultChecked={member.is_active}
                          name="is_active"
                          type="checkbox"
                        />
                        Active
                      </label>

                      <Button type="submit" variant="outline">
                        Save
                      </Button>
                    </div>
                  </form>

                  <details className="rounded-md border bg-muted/30 p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      Set new password
                    </summary>
                    <form
                      action={setMemberPassword}
                      className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                    >
                      <input name="id" type="hidden" value={member.id} />
                      <label className="space-y-2 text-sm font-medium">
                        New password
                        <input
                          autoComplete="new-password"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                          minLength={8}
                          name="new_password"
                          placeholder="Minimum 8 characters"
                          required
                          type="password"
                        />
                      </label>
                      <label className="space-y-2 text-sm font-medium">
                        Confirm password
                        <input
                          autoComplete="new-password"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                          minLength={8}
                          name="confirm_new_password"
                          placeholder="Repeat password"
                          required
                          type="password"
                        />
                      </label>
                      <Button type="submit" variant="outline">
                        Update password
                      </Button>
                    </form>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      This updates Auth directly. Share the new password
                      securely.
                    </p>
                  </details>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-background p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Invitations</h2>
              <p className="text-sm text-muted-foreground">
                Pending, failed, revoked, and accepted invitation records.
              </p>
            </div>
            <span className="text-sm text-muted-foreground">
              {invitations?.length ?? 0} total
            </span>
          </div>

          {invitationsError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {invitationsError.message}
            </p>
          ) : null}

          <div className="grid gap-3">
            {(invitations as Invitation[] | null)?.map((invitation) => (
              <article className="rounded-md border p-4" key={invitation.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-semibold">
                      {invitation.full_name ?? invitation.email}
                    </h3>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {invitation.email}
                    </p>
                  </div>
                  <StatusBadge status={invitation.status} />
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Role
                    </dt>
                    <dd className="mt-1">{formatValue(invitation.role)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Subteam
                    </dt>
                    <dd className="mt-1">
                      {getSubteamLabel(invitation.subteam)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Invited
                    </dt>
                    <dd className="mt-1">{formatDate(invitation.invited_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Expires
                    </dt>
                    <dd className="mt-1">{formatDate(invitation.expires_at)}</dd>
                  </div>
                </dl>

                {invitation.error_message ? (
                  <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {invitation.error_message}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
    </div>
  );
}
