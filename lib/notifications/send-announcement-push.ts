import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { ActiveSubteam } from "@/lib/team-options";

type AppRole = Database["public"]["Enums"]["app_role"];
type PriorityLevel = Database["public"]["Enums"]["priority_level"];

type SendAnnouncementPushInput = {
  announcementId: string;
  actorId: string;
  title: string;
  priority: PriorityLevel;
  targetLabel: string;
  targetSubteam: ActiveSubteam | null;
};

type ProfileRecipient = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "role" | "subteam" | "is_active"
>;

type PushSubscription = Pick<
  Database["public"]["Tables"]["push_subscriptions"]["Row"],
  "subscription_id" | "external_user_id" | "enabled" | "profile_id"
>;

type PushResult = {
  deliveredAt: string | null;
  warning?: string;
};

function isAdminRole(role: AppRole) {
  return role === "admin" || role === "exec";
}

function uniqueValues(values: Array<string | null>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value)))
  );
}

async function insertNotificationEvent(
  input: SendAnnouncementPushInput,
  deliveredAt: string | null,
  recipientCount: number,
  pushSubscriptionCount: number
) {
  const admin = createAdminClient();
  const payload = {
    title: input.title,
    priority: input.priority,
    target_label: input.targetLabel,
    recipient_count: recipientCount,
    push_subscription_count: pushSubscriptionCount,
  } satisfies Json;

  const { error } = await admin.from("notification_events").insert({
    event_type: "announcement_created",
    actor_id: input.actorId,
    target_subteam: input.targetSubteam,
    entity_table: "announcements",
    entity_id: input.announcementId,
    payload,
    delivered_at: deliveredAt,
  });

  if (error) {
    console.error("Failed to record announcement notification event", error);
  }
}

async function postOneSignalNotification(payload: Record<string, unknown>) {
  const response = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OneSignal request failed: ${response.status} ${body}`);
  }
}

export async function sendAnnouncementPush(
  input: SendAnnouncementPushInput
): Promise<PushResult> {
  const appId = process.env.ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;
  const admin = createAdminClient();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, role, subteam, is_active")
    .eq("is_active", true);

  if (profilesError) {
    console.error("Failed to load notification recipients", profilesError);
    await insertNotificationEvent(input, null, 0, 0);
    return {
      deliveredAt: null,
      warning: "Announcement posted, but recipients could not be loaded.",
    };
  }

  const profileRows = (profiles ?? []) as ProfileRecipient[];
  const recipients = profileRows
    .filter((profile) => {
      if (!input.targetSubteam) {
        return true;
      }

      return (
        profile.subteam === input.targetSubteam || isAdminRole(profile.role)
      );
    })
    .map((profile) => profile.id);

  if (recipients.length === 0) {
    await insertNotificationEvent(input, null, 0, 0);
    return { deliveredAt: null };
  }

  const { data: subscriptions, error: subscriptionsError } = await admin
    .from("push_subscriptions")
    .select("subscription_id, external_user_id, enabled, profile_id")
    .eq("enabled", true)
    .in("profile_id", recipients);

  if (subscriptionsError) {
    console.error("Failed to load push subscriptions", subscriptionsError);
    await insertNotificationEvent(input, null, recipients.length, 0);
    return {
      deliveredAt: null,
      warning: "Announcement posted, but push subscriptions could not be loaded.",
    };
  }

  const enabledSubscriptions =
    (subscriptions as PushSubscription[] | null | undefined) ?? [];
  const externalUserIds = uniqueValues(
    enabledSubscriptions.map((subscription) => subscription.external_user_id)
  );
  const subscriptionIds = uniqueValues(
    enabledSubscriptions
      .filter((subscription) => !subscription.external_user_id)
      .map((subscription) => subscription.subscription_id)
  );
  const pushTargetCount = externalUserIds.length + subscriptionIds.length;

  if (!appId || !restApiKey) {
    await insertNotificationEvent(
      input,
      null,
      recipients.length,
      pushTargetCount
    );
    return {
      deliveredAt: null,
      warning: "Announcement posted, but push notifications are not configured.",
    };
  }

  if (pushTargetCount === 0) {
    await insertNotificationEvent(input, null, recipients.length, 0);
    return { deliveredAt: null };
  }

  const basePayload = {
    app_id: appId,
    headings: { en: "Gryphon Hub announcement" },
    contents: { en: input.title },
    data: {
      url: "/dashboard",
      announcement_id: input.announcementId,
    },
  };

  try {
    if (externalUserIds.length > 0) {
      await postOneSignalNotification({
        ...basePayload,
        include_external_user_ids: externalUserIds,
        channel_for_external_user_ids: "push",
      });
    }

    if (subscriptionIds.length > 0) {
      await postOneSignalNotification({
        ...basePayload,
        include_player_ids: subscriptionIds,
      });
    }

    const deliveredAt = new Date().toISOString();
    await insertNotificationEvent(
      input,
      deliveredAt,
      recipients.length,
      pushTargetCount
    );
    return { deliveredAt };
  } catch (error) {
    console.error("Failed to send announcement push notification", error);
    await insertNotificationEvent(
      input,
      null,
      recipients.length,
      pushTargetCount
    );
    return {
      deliveredAt: null,
      warning: "Announcement posted, but push notifications could not be sent.",
    };
  }
}
