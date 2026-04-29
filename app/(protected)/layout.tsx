import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "email" | "full_name" | "preferred_name" | "role" | "subteam" | "is_active"
>;

const PROFILE_SELECT =
  "email, full_name, preferred_name, role, subteam, is_active";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return (
    <AppShell profile={profile} email={profile?.email ?? user.email ?? null}>
      {children}
    </AppShell>
  );
}
