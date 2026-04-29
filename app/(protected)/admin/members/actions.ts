"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Constants, type Enums } from "@/lib/supabase/database.types";
import {
  type ActiveSubteam,
  isActiveSubteam,
} from "@/lib/team-options";

type AppRole = Enums<"app_role">;

const APP_ROLES = Constants.public.Enums.app_role;

type AdminActor = {
  id: string;
  role: AppRole;
};

type ProvisionMemberInput = {
  email: string;
  fullName: string;
  role: AppRole;
  subteam: ActiveSubteam;
};

function isRole(value: FormDataEntryValue | null): value is AppRole {
  return typeof value === "string" && APP_ROLES.includes(value as AppRole);
}

function isSubteam(value: FormDataEntryValue | null): value is ActiveSubteam {
  return isActiveSubteam(value);
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getActionRedirect(path: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return `${path}?${query.toString()}`;
}

async function requireAdminActor(): Promise<AdminActor> {
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

  return { id: user.id, role: profile.role };
}

async function findAuthUserIdByEmail(email: string) {
  const admin = createAdminClient();
  const normalizedEmail = email.toLowerCase();
  let page = 1;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === normalizedEmail
    );

    if (user) {
      return user.id;
    }

    if (data.users.length < 1000) {
      return null;
    }

    page += 1;
  }

  return null;
}

async function provisionAuthUser({
  email,
  fullName,
  role,
  subteam,
}: ProvisionMemberInput) {
  const admin = createAdminClient();
  const userMetadata = {
    full_name: fullName,
    role,
    subteam,
  };

  const { data: createdUser, error: createError } =
    await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: userMetadata,
    });

  if (!createError && createdUser.user) {
    return createdUser.user.id;
  }

  const existingUserId = await findAuthUserIdByEmail(email);

  if (!existingUserId) {
    throw new Error(
      createError?.message ?? "Supabase did not return a provisioned user."
    );
  }

  const { data: updatedUser, error: updateError } =
    await admin.auth.admin.updateUserById(existingUserId, {
      email_confirm: true,
      user_metadata: userMetadata,
    });

  if (updateError || !updatedUser.user) {
    throw new Error(
      updateError?.message ?? "Supabase did not return an updated user."
    );
  }

  return updatedUser.user.id;
}

export async function inviteMember(formData: FormData) {
  const actor = await requireAdminActor();
  const email = getString(formData, "email").toLowerCase();
  const fullName = getString(formData, "full_name");
  const role = formData.get("role");
  const subteam = formData.get("subteam");

  if (!email || !email.includes("@")) {
    redirect(
      getActionRedirect("/admin/members", {
        error: "Enter a valid email address.",
      })
    );
  }

  if (!fullName) {
    redirect(
      getActionRedirect("/admin/members", {
        error: "Enter the member's full name.",
      })
    );
  }

  if (!isRole(role) || !isSubteam(subteam)) {
    redirect(
      getActionRedirect("/admin/members", {
        error: "Choose a valid role and subteam.",
      })
    );
  }

  const admin = createAdminClient();
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data: invitation, error: invitationError } = await admin
    .from("member_invitations")
    .insert({
      email,
      full_name: fullName,
      role,
      subteam,
      status: "pending",
      invited_by: actor.id,
      invited_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (invitationError || !invitation) {
    redirect(
      getActionRedirect("/admin/members", {
        error:
          invitationError?.message ??
          "The invitation record could not be created.",
      })
    );
  }

  let authUserId: string;
  try {
    authUserId = await provisionAuthUser({ email, fullName, role, subteam });
  } catch (error) {
    await admin
      .from("member_invitations")
      .update({
        status: "failed",
        error_message:
          error instanceof Error
            ? error.message
            : "The Auth user could not be provisioned.",
      })
      .eq("id", invitation.id);

    revalidatePath("/admin/members");
    redirect(
      getActionRedirect("/admin/members", {
        error:
          error instanceof Error
            ? error.message
            : "The Auth user could not be provisioned.",
      })
    );
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: authUserId,
    email,
    full_name: fullName,
    role,
    subteam,
    is_active: true,
  });

  if (profileError) {
    await admin
      .from("member_invitations")
      .update({
        status: "failed",
        error_message: profileError.message,
      })
      .eq("id", invitation.id);

    revalidatePath("/admin/members");
    redirect(
      getActionRedirect("/admin/members", {
        error: profileError.message,
      })
    );
  }

  const { error: invitationUpdateError } = await admin
    .from("member_invitations")
    .update({
      status: "accepted",
      accepted_by: authUserId,
      accepted_at: now.toISOString(),
      error_message: null,
    })
    .eq("id", invitation.id);

  if (invitationUpdateError) {
    redirect(
      getActionRedirect("/admin/members", {
        error: invitationUpdateError.message,
      })
    );
  }

  revalidatePath("/admin/members");
  redirect(
    getActionRedirect("/admin/members", {
      message: `${email} has been provisioned in Gryphon Hub.`,
    })
  );
}

export async function updateMember(formData: FormData) {
  await requireAdminActor();

  const id = getString(formData, "id");
  const role = formData.get("role");
  const subteam = formData.get("subteam");
  const isActive = formData.get("is_active") === "on";

  if (!id || !isRole(role) || !isSubteam(subteam)) {
    redirect(
      getActionRedirect("/admin/members", {
        error: "Choose a valid member, role, and subteam.",
      })
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      role,
      subteam,
      is_active: isActive,
    })
    .eq("id", id);

  if (error) {
    redirect(
      getActionRedirect("/admin/members", {
        error: error.message,
      })
    );
  }

  revalidatePath("/admin/members");
  redirect(
    getActionRedirect("/admin/members", {
      message: "Member updated.",
    })
  );
}
