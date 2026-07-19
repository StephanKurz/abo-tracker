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

export type SubscriptionWithCategory = Subscription & { categories: { name: string } | null };

export function findNearestCancellation(
  subscriptions: SubscriptionWithCategory[],
  today: Date,
): { sub: SubscriptionWithCategory; date: Date } | null {
  let nearest: { sub: SubscriptionWithCategory; date: Date } | null = null;
  for (const sub of subscriptions) {
    const date = getEffectiveCancellationDate(sub);
    if (!date || date.getTime() < today.getTime()) continue;
    if (!nearest || date.getTime() < nearest.date.getTime()) {
      nearest = { sub, date };
    }
  }
  return nearest;
}

export async function sendCancellationReminderEmail(
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
