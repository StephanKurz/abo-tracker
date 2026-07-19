import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  findNearestCancellation,
  sendCancellationReminderEmail,
  type SubscriptionWithCategory,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select(
      "id, name, email, notify_days_before, last_notified_subscription_id, last_notified_target_date",
    )
    .not("notify_days_before", "is", null);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const profile of profiles ?? []) {
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("*, categories(name)")
      .eq("user_id", profile.id);

    if (!subscriptions || subscriptions.length === 0) continue;

    const nearest = findNearestCancellation(subscriptions as SubscriptionWithCategory[], today);
    if (!nearest) continue;

    const daysUntil = Math.round((nearest.date.getTime() - today.getTime()) / 86_400_000);
    if (daysUntil > profile.notify_days_before) continue;

    const targetDateStr = nearest.date.toISOString().slice(0, 10);
    if (
      profile.last_notified_subscription_id === nearest.sub.id &&
      profile.last_notified_target_date === targetDateStr
    ) {
      continue;
    }

    try {
      await sendCancellationReminderEmail(profile, nearest.sub, nearest.date);
      await supabase
        .from("profiles")
        .update({
          last_notified_subscription_id: nearest.sub.id,
          last_notified_target_date: targetDateStr,
        })
        .eq("id", profile.id);
      sent++;
    } catch (err) {
      errors.push(`${profile.email}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ ok: true, sent, errors });
}
