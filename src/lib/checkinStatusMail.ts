import {
  BILLING_CYCLE_LABELS,
  formatCurrency,
  formatDate,
  getEffectiveCancellationDate,
  isFullyExpired,
} from "@/lib/subscriptions";
import type { Subscription } from "@/lib/subscriptions";

// Rendert die Abo-Übersicht als Antwortmail auf eine Status-Abfrage.
// Bewusst eigenständig statt PrintView wiederzuverwenden: PrintView ist eine
// Client-Komponente mit Tailwind-Klassen, E-Mail-Programme brauchen Inline-CSS.

export type StatusRow = Subscription & { category_name: string };

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const TD = 'style="padding:4px 8px;border-top:1px solid #e5e7eb;"';
const TH = 'style="padding:4px 8px;text-align:left;font-weight:bold;color:#6b7280;"';

function totalsFor(rows: StatusRow[]) {
  const yearly = rows.reduce((sum, s) => sum + (s.yearly_cost ?? 0), 0);
  return { yearly, monthly: yearly / 12, count: rows.length };
}

function summaryBlockHtml(title: string, t: ReturnType<typeof totalsFor>): string {
  return `
    <div style="margin:0 0 12px 0;padding:12px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;">
      <div style="font-weight:bold;color:#111827;margin-bottom:6px;">${esc(title)}</div>
      <div style="color:#111827;font-size:14px;">
        Gesamtsumme pro Jahr: <strong>${formatCurrency(t.yearly)}</strong><br>
        Gesamtsumme pro Monat: <strong>${formatCurrency(t.monthly)}</strong><br>
        Anzahl Abos: <strong>${t.count}</strong>
      </div>
    </div>`;
}

/**
 * Baut die Status-Antwortmail. `intro` ist der Einleitungssatz über der
 * Tabelle — bei einer Bestandsfrage die konkrete Antwort der KI, sonst ein
 * neutraler Standardsatz.
 */
export function renderStatusMail(input: {
  recipientName: string;
  ownerName: string | null;
  rows: StatusRow[];
  intro: string;
}): { html: string; text: string } {
  const { recipientName, ownerName, rows, intro } = input;

  const active = rows.filter((s) => !isFullyExpired(s));
  const uncanceled = active.filter((s) => !s.canceled_at);
  const totalsAll = totalsFor(active);
  const totalsUncanceled = totalsFor(uncanceled);

  // Nach Kategorie gruppieren, Kategorien und Abos jeweils alphabetisch
  const byCategory = new Map<string, StatusRow[]>();
  for (const sub of rows) {
    const key = sub.category_name || "Ohne Kategorie";
    const list = byCategory.get(key);
    if (list) list.push(sub);
    else byCategory.set(key, [sub]);
  }
  const categories = [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b, "de"));
  for (const [, list] of categories) list.sort((a, b) => a.name.localeCompare(b.name, "de"));

  const headline = ownerName ? `Abo-Übersicht von ${ownerName}` : "Abo-Übersicht";

  if (rows.length === 0) {
    return {
      html: `<p>Hallo ${esc(recipientName)},</p><p>${esc(intro)}</p><p>In dieser Übersicht ist aktuell kein Abo erfasst.</p>`,
      text: `Hallo ${recipientName},\n\n${intro}\n\nIn dieser Übersicht ist aktuell kein Abo erfasst.`,
    };
  }

  const tablesHtml = categories
    .map(([category, list]) => {
      const body = list
        .map((sub) => {
          const cancellation = getEffectiveCancellationDate(sub);
          const status = sub.canceled_at
            ? '<span style="color:#dc2626;">gekündigt</span>'
            : '<span style="color:#16a34a;">aktiv</span>';
          return `
            <tr>
              <td ${TD}>${status}</td>
              <td ${TD}>${esc(sub.name)}</td>
              <td ${TD}>${esc(BILLING_CYCLE_LABELS[sub.billing_cycle] ?? sub.billing_cycle)}</td>
              <td ${TD} align="right">${formatCurrency(sub.amount)}</td>
              <td ${TD} align="right">${formatCurrency(sub.yearly_cost)}</td>
              <td ${TD} align="right">${cancellation ? formatDate(cancellation) : "–"}</td>
            </tr>`;
        })
        .join("");
      return `
        <div style="margin:0 0 16px 0;">
          <div style="font-weight:bold;color:#ea580c;margin-bottom:4px;">${esc(category)}</div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;color:#111827;">
            <thead>
              <tr>
                <th ${TH}>Status</th>
                <th ${TH}>Name</th>
                <th ${TH}>Abrechnung</th>
                <th ${TH} align="right">Betrag</th>
                <th ${TH} align="right">Jahreskosten</th>
                <th ${TH} align="right">Kündbar bis</th>
              </tr>
            </thead>
            <tbody>${body}</tbody>
          </table>
        </div>`;
    })
    .join("");

  const html = `
    <p>Hallo ${esc(recipientName)},</p>
    <p>${esc(intro)}</p>
    <h2 style="font-size:16px;color:#111827;margin:16px 0 8px 0;">${esc(headline)}</h2>
    ${summaryBlockHtml("Alle Abos", totalsAll)}
    ${summaryBlockHtml("Ungekündigte Abos", totalsUncanceled)}
    ${tablesHtml}`;

  const textLines = [
    `Hallo ${recipientName},`,
    "",
    intro,
    "",
    headline,
    "",
    `Alle Abos: ${formatCurrency(totalsAll.yearly)} pro Jahr, ${formatCurrency(totalsAll.monthly)} pro Monat, ${totalsAll.count} Abos`,
    `Ungekündigte Abos: ${formatCurrency(totalsUncanceled.yearly)} pro Jahr, ${formatCurrency(totalsUncanceled.monthly)} pro Monat, ${totalsUncanceled.count} Abos`,
  ];
  for (const [category, list] of categories) {
    textLines.push("", `${category}:`);
    for (const sub of list) {
      const cancellation = getEffectiveCancellationDate(sub);
      textLines.push(
        `- ${sub.name}${sub.canceled_at ? " (gekündigt)" : ""}: ${formatCurrency(sub.amount)} ` +
          `${BILLING_CYCLE_LABELS[sub.billing_cycle] ?? sub.billing_cycle}, ` +
          `${formatCurrency(sub.yearly_cost)} pro Jahr, kündbar bis ` +
          `${cancellation ? formatDate(cancellation) : "–"}`,
      );
    }
  }

  return { html, text: textLines.join("\n") };
}

/** Deterministische Erkennung der offensichtlichen Fälle — spart den KI-Aufruf. */
export function looksLikeStatusRequest(subject: string, text: string): boolean {
  const haystack = `${subject}\n${text}`.trim();
  if (/abo[\s-]?status/i.test(haystack)) return true;
  // Alleinstehendes "Status" nur bei sehr kurzen Mails, damit eine
  // Bestellbestätigung mit dem Wort "Status" im Fließtext nicht greift.
  return haystack.length <= 40 && /^\W*status\W*$/i.test(haystack);
}
