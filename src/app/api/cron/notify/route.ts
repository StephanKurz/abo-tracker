import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email";
import {
  BILLING_CYCLE_LABELS,
  CANCELLATION_MODE_LABELS,
  NOTICE_PERIOD_LABELS,
  formatCurrency,
  formatDate,
  getEffectiveCancellationDate,
} from "@/lib/subscriptions";
import type { Subscription } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type SubscriptionWithCategory = Subscription & { categories: { name: string } | null };

async function sendNotificationEmail(
  profile: { name: string; email: string },
  sub: SubscriptionWithCategory,
  targetDate: Date,
) {
  const rows: [string, string][] = [
    ["Name", sub.name],
    ["Beschreibung", sub.description ?? "–"],
    ["Kategorie", sub.categories?.name ?? "–"],
    ["Abschlussdatum", formatDate(sub.start_date)],
    ["Abrechnung", BILLING_CYCLE_LABELS[sub.billing_cycle] ?? sub.billing_cycle],
    ["Mindestlaufzeit", sub.min_term_months != null ? `${sub.min_term_months} Monate` : "–"],
    ["Betrag pro Abrechnungseinheit", formatCurrency(sub.amount)],
    ["Jahreskosten", formatCurrency(sub.yearly_cost)],
    [
      "Kündigungsmodus",
      sub.cancellation_mode ? (CANCELLATION_MODE_LABELS[sub.cancellation_mode] ?? sub.cancellation_mode) : "–",
    ],
    [
      "Kündigungsfrist",
      sub.notice_period ? (NOTICE_PERIOD_LABELS[sub.notice_period] ?? sub.notice_period) : "–",
    ],
    ["Kündbar bis", formatDate(targetDate)],
  ];

  const html = `
    <h2>Kündigungserinnerung: ${sub.name}</h2>
    <p>Hallo ${profile.name},</p>
    <p>für dein Abo <strong>${sub.name}</strong> ist am <strong>${formatDate(targetDate)}</strong> das nächste Kündigungsdatum.</p>
    <table cellpadding="4" cellspacing="0" style="border-collapse:collapse">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="color:#6b7280;padding-right:12px">${label}</td><td>${value}</td></tr>`,
        )
        .join("")}
    </table>
  `;

  await sendMail({
    to: profile.email,
    subject: `Kündigungserinnerung: ${sub.name}`,
    html,
  });
}

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

    let nearest: { sub: SubscriptionWithCategory; date: Date } | null = null;
    for (const sub of subscriptions as SubscriptionWithCategory[]) {
      const date = getEffectiveCancellationDate(sub);
      if (!date || date.getTime() < today.getTime()) continue;
      if (!nearest || date.getTime() < nearest.date.getTime()) {
        nearest = { sub, date };
      }
    }

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
      await sendNotificationEmail(profile, nearest.sub, nearest.date);
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
