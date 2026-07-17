import type { Tables } from "@/types/database.types";

export type Subscription = Tables<"subscriptions">;
export type Category = Tables<"categories">;

export const BILLING_CYCLE_LABELS: Record<string, string> = {
  monthly: "monatlich",
  yearly: "jährlich",
};

export const CANCELLATION_MODE_LABELS: Record<string, string> = {
  monthly: "monatlich",
  quarterly: "vierteljährlich",
  yearly: "jährlich",
};

export const NOTICE_PERIOD_LABELS: Record<string, string> = {
  "1_month": "1 Monat",
  "3_months": "3 Monate",
  end_of_year: "3 Monate zum Jahresende",
  anytime: "jederzeit",
};

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

const CYCLE_MONTHS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

/**
 * Finds the next recurring cycle date on/after `today`, using the same
 * day-of-month/month as `start`, stepping forward in `mode`-sized cycles.
 */
function nextCycleAnchor(start: Date, mode: string, today: Date): Date {
  const step = CYCLE_MONTHS[mode] ?? 1;
  let anchor = new Date(start);
  while (anchor.getTime() < today.getTime()) {
    anchor = addMonths(anchor, step);
  }
  return anchor;
}

/**
 * "Nächstes Kündigungsdatum" per Anforderung:
 * - Solange das früheste Kündigungsdatum (Abschlussdatum + Mindestlaufzeit)
 *   noch in der Zukunft liegt, ist genau dieses Datum das nächste
 *   Kündigungsdatum.
 * - Danach: nächster Kündigungsmodus-Zyklustermin (auf Basis des
 *   Abschlussdatum-Tages) zzgl. Kündigungsfrist. Bei "zum Jahresende" ist
 *   der Stichtag fix 3 Monate vor Jahresende (30.9.). Bei "jederzeit" endet
 *   das Abo zum Tag vor dem Abschlussdatum-Tag im laufenden Monat (falls
 *   dieser Tag noch nicht erreicht ist) oder im Folgemonat (falls er schon
 *   erreicht/vorbei ist) — z. B. Abschlusstag 19., heute 17.: kündbar bis
 *   18. des laufenden Monats; ab dem 19. dann bis 18. des Folgemonats.
 * Diese Formel ist aus einer mehrdeutigen fachlichen Vorgabe abgeleitet
 * und mit dem Auftraggeber als "zwei unabhängige Felder" abgestimmt.
 */
export function computeNextCancellationDate(
  sub: Pick<
    Subscription,
    "start_date" | "min_term_months" | "cancellation_mode" | "notice_period"
  >,
  today: Date = new Date(),
): Date | null {
  if (!sub.start_date) return null;
  const start = new Date(sub.start_date);

  const earliest =
    sub.min_term_months != null ? addMonths(start, sub.min_term_months) : start;

  if (earliest.getTime() > today.getTime()) {
    return earliest;
  }

  if (!sub.cancellation_mode || !sub.notice_period) {
    return null;
  }

  if (sub.notice_period === "end_of_year") {
    let deadline = new Date(today.getFullYear(), 8, 30); // 30. September
    if (deadline.getTime() < today.getTime()) {
      deadline = new Date(today.getFullYear() + 1, 8, 30);
    }
    return deadline;
  }

  if (sub.notice_period === "anytime") {
    const day = start.getDate();
    const candidate = new Date(today.getFullYear(), today.getMonth(), day);
    const target =
      today.getTime() < candidate.getTime()
        ? candidate
        : new Date(today.getFullYear(), today.getMonth() + 1, day);
    return new Date(target.getFullYear(), target.getMonth(), target.getDate() - 1);
  }

  const anchor = nextCycleAnchor(start, sub.cancellation_mode, today);
  const noticeMonths = sub.notice_period === "1_month" ? 1 : 3;
  return addMonths(anchor, noticeMonths);
}

export function computeYearlyCost(amount: number, billingCycle: string): number {
  return billingCycle === "yearly" ? amount : amount * 12;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "–";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "–";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("de-DE").format(date);
}
