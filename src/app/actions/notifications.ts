"use server";

import { createClient } from "@/lib/supabase/server";
import {
  findNearestCancellation,
  sendCancellationReminderEmail,
  type SubscriptionWithCategory,
} from "@/lib/notifications";

export async function sendTestNotificationEmail(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const [{ data: profile }, { data: subscriptions }] = await Promise.all([
    supabase.from("profiles").select("name, email").eq("id", user.id).single(),
    supabase.from("subscriptions").select("*, categories(name)").eq("user_id", user.id),
  ]);

  if (!profile) return { error: "Profil nicht gefunden." };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nearest = findNearestCancellation(
    (subscriptions ?? []) as SubscriptionWithCategory[],
    today,
  );
  if (!nearest) {
    return { error: "Kein anstehendes Kündigungsdatum in deiner eigenen Übersicht gefunden." };
  }

  try {
    await sendCancellationReminderEmail(profile, nearest.sub, nearest.date);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "E-Mail-Versand fehlgeschlagen." };
  }

  return { error: null };
}
