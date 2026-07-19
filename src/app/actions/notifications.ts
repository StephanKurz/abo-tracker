"use server";

import { createClient } from "@/lib/supabase/server";
import {
  findNearestCancellation,
  sendCancellationReminderEmail,
  type SubscriptionWithCategory,
} from "@/lib/notifications";

export async function sendTestNotificationEmail(): Promise<{
  error: string | null;
  detail?: string;
}> {
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
    const info = await sendCancellationReminderEmail(profile, nearest.sub, nearest.date);
    const detail =
      info.rejected.length > 0
        ? `Vom Mailserver abgelehnt: ${info.rejected.join(", ")} — Antwort: ${info.response}`
        : `Angenommen für: ${info.accepted.join(", ")} — Antwort: ${info.response}`;
    return { error: null, detail };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "E-Mail-Versand fehlgeschlagen." };
  }
}
