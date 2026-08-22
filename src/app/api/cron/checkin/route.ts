import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { extractText } from "unpdf";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/checkinCrypto";
import { extractSubscriptionFromEmail, type CheckinExtraction } from "@/lib/checkinAi";
import { renderStatusMail, looksLikeStatusRequest, type StatusRow } from "@/lib/checkinStatusMail";
import { sendMail, escapeHtml } from "@/lib/email";
import { canWriteRow, type Role } from "@/lib/sharing";
import {
  BILLING_CYCLE_LABELS,
  CANCELLATION_MODE_LABELS,
  NOTICE_PERIOD_LABELS,
  formatCurrency,
  formatDate,
} from "@/lib/subscriptions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_MAILS_PER_USER = 5;
const MAX_TEXT_LENGTH = 8000;
const SPAM_NAME_HINTS = ["spam", "junk", "bulk"];
const TRASH_NAME_HINTS = ["trash", "deleted", "gelöscht", "papierkorb"];
// "Abo-Tracker" nur übergangsweise, damit Antworten auf Rückfragen, die vor
// der Umbenennung in "Abo-Radar" verschickt wurden, weiter zugeordnet werden.
const TOKEN_RE = /\[(?:Abo-Radar|Abo-Tracker) #([A-Z0-9]{6,16})\]/i;

type Admin = ReturnType<typeof createAdminClient>;

type CheckinSettingsRow = {
  user_id: string;
  checkin_email: string;
  imap_host: string;
  imap_port: number;
  imap_user: string;
  imap_password_enc: string;
};

type ParsedMail = {
  uid: number;
  messageId: string | null;
  subject: string;
  fromAddress: string;
  text: string;
};

/** Person, die eine Check-in-Mail senden darf, mit ihrer Rolle auf der Übersicht. */
type Sender = { userId: string; name: string; email: string; role: Role };

/** Absender darf die gewünschte Änderung nicht vornehmen — kein Systemfehler. */
class PermissionError extends Error {}

/**
 * Baut die Landkarte der berechtigten Absender für ein Check-in-Postfach:
 * der Besitzer selbst plus alle Mitnutzer mit Schreibrechten auf seine
 * Übersicht. Nur-Lesen-Berechtigte bleiben bewusst außen vor.
 */
async function buildSenderMap(
  admin: Admin,
  ownerId: string,
  ownerProfile: { email: string; name: string },
): Promise<Map<string, Sender>> {
  const senders = new Map<string, Sender>();
  senders.set(ownerProfile.email.toLowerCase(), {
    userId: ownerId,
    name: ownerProfile.name,
    email: ownerProfile.email,
    role: "owner",
  });

  const { data: collaborators } = await admin
    .from("overview_collaborators")
    .select("collaborator_id, permission")
    .eq("overview_owner_id", ownerId)
    .eq("status", "accepted")
    .in("permission", ["full", "full_own"]);

  const ids = (collaborators ?? [])
    .map((c) => c.collaborator_id)
    .filter((id): id is string => id != null);
  if (ids.length === 0) return senders;

  // Kein deklarierter Fremdschlüssel collaborator_id -> profiles, daher
  // separate Abfrage statt PostgREST-Embedding.
  const { data: profiles } = await admin.from("profiles").select("id, email, name").in("id", ids);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  for (const c of collaborators ?? []) {
    const p = c.collaborator_id ? byId.get(c.collaborator_id) : null;
    if (!p) continue;
    senders.set(p.email.toLowerCase(), {
      userId: p.id,
      name: p.name,
      email: p.email,
      role: c.permission as Role,
    });
  }
  return senders;
}

function newToken(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

function describeFields(fields: CheckinExtraction["fields"], categoryName: string | null): string[] {
  const rows: string[] = [];
  if (fields.name) rows.push(`Name: ${fields.name}`);
  if (fields.description) rows.push(`Beschreibung: ${fields.description}`);
  if (categoryName) rows.push(`Kategorie: ${categoryName}`);
  if (fields.billing_cycle) {
    rows.push(`Abrechnung: ${BILLING_CYCLE_LABELS[fields.billing_cycle] ?? fields.billing_cycle}`);
  }
  if (fields.amount != null) rows.push(`Betrag: ${formatCurrency(fields.amount)}`);
  if (fields.start_date) rows.push(`Abschlussdatum: ${formatDate(fields.start_date)}`);
  if (fields.min_term_months != null) rows.push(`Mindestlaufzeit: ${fields.min_term_months} Monate`);
  if (fields.cancellation_mode) {
    rows.push(
      `Kündigungsmodus: ${CANCELLATION_MODE_LABELS[fields.cancellation_mode] ?? fields.cancellation_mode}`,
    );
  }
  if (fields.notice_period) {
    rows.push(
      `Kündigungsfrist: ${NOTICE_PERIOD_LABELS[fields.notice_period] ?? fields.notice_period}`,
    );
  }
  if (fields.canceled_at) rows.push(`Gekündigt zum: ${formatDate(fields.canceled_at)}`);
  return rows;
}

function listHtml(rows: string[]): string {
  return rows.length > 0 ? `<ul>${rows.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>` : "";
}

/**
 * Sucht einen Ordner zuerst über sein SPECIAL-USE-Attribut (RFC 6154), dann
 * als Rückfallebene über typische Namensbestandteile.
 */
function findMailboxPath(
  mailboxes: Awaited<ReturnType<ImapFlow["list"]>>,
  specialUse: string,
  nameHints: string[],
): string | null {
  const byUse = mailboxes.find((box) => box.specialUse === specialUse);
  if (byUse) return byUse.path;
  const byName = mailboxes.find((box) =>
    nameHints.some((hint) => box.path.toLowerCase().includes(hint)),
  );
  return byName?.path ?? null;
}

/**
 * Verschiebt ungelesene Mails von registrierten Absendern (Postfach-Besitzer
 * oder Mitnutzer mit Schreibrechten) aus dem Spam-/Junk-Ordner ins INBOX, bevor
 * die reguläre Verarbeitung läuft. Bewusst eng gefasst: nur bekannte Absender,
 * kein pauschales Leeren des Spam-Ordners. Ein fehlender/unzugänglicher
 * Spam-Ordner ist kein Fehler - die INBOX-Verarbeitung läuft trotzdem weiter.
 */
async function rescueFromSpam(
  settings: CheckinSettingsRow,
  senders: Map<string, Sender>,
): Promise<void> {
  const client = new ImapFlow({
    host: settings.imap_host,
    port: settings.imap_port,
    secure: settings.imap_port === 993,
    auth: { user: settings.imap_user, pass: decryptSecret(settings.imap_password_enc) },
    logger: false,
  });

  await client.connect();
  try {
    const mailboxes = await client.list();
    const spamPath = findMailboxPath(mailboxes, "\\Junk", SPAM_NAME_HINTS);
    if (!spamPath) return;

    const lock = await client.getMailboxLock(spamPath);
    try {
      const candidates: number[] = [];
      for await (const msg of client.fetch(
        { seen: false },
        { envelope: true, uid: true },
        { uid: true },
      )) {
        if (candidates.length >= MAX_MAILS_PER_USER) break;
        const from = msg.envelope?.from?.[0]?.address?.toLowerCase();
        if (from && senders.has(from)) candidates.push(msg.uid);
      }
      if (candidates.length > 0) {
        await client.messageMove(candidates, "INBOX", { uid: true });
      }
    } finally {
      lock.release();
    }
  } catch {
    // Spam-/Junk-Ordner nicht vorhanden oder nicht zugreifbar - kein
    // harter Fehler, die reguläre INBOX-Verarbeitung läuft trotzdem weiter
  } finally {
    await client.logout().catch(() => {});
  }
}

/**
 * Holt ALLE Mails aus dem INBOX — unabhängig davon, ob sie gelesen sind.
 * Das INBOX ist die alleinige Arbeitsschlange: Jede Mail, die dort liegt, wird
 * verarbeitet und anschließend über moveHandledMails() herausbewegt (Trash bzw.
 * Spam). Der Gelesen-Status spielt bewusst keine Rolle mehr, damit z. B. eine
 * versehentlich als „gelesen” markierte Mail nicht stillschweigend liegen bleibt.
 */
async function fetchInboxMails(settings: CheckinSettingsRow): Promise<ParsedMail[]> {
  const client = new ImapFlow({
    host: settings.imap_host,
    port: settings.imap_port,
    secure: settings.imap_port === 993,
    auth: { user: settings.imap_user, pass: decryptSecret(settings.imap_password_enc) },
    logger: false,
  });

  await client.connect();
  const collected: { uid: number; source: Buffer }[] = [];
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      for await (const msg of client.fetch("1:*", { source: true, uid: true }, { uid: true })) {
        if (collected.length >= MAX_MAILS_PER_USER) break;
        if (msg.source) collected.push({ uid: msg.uid, source: msg.source });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }

  const parsed: ParsedMail[] = [];
  for (const { uid, source } of collected) {
    const mail = await simpleParser(source);
    let text = (mail.text ?? "").trim();
    if (!text && mail.html) text = String(mail.html).replace(/<[^>]+>/g, " ").trim();

    for (const att of mail.attachments ?? []) {
      if (att.contentType === "application/pdf" && att.content) {
        try {
          const { text: pdfText } = await extractText(new Uint8Array(att.content), {
            mergePages: true,
          });
          if (pdfText.trim()) {
            text += `\n\n[PDF-Anhang "${att.filename ?? "Dokument"}"]\n${pdfText.trim().slice(0, MAX_TEXT_LENGTH)}`;
          }
        } catch {
          // Nicht lesbare PDFs überspringen; der Mail-Text bleibt nutzbar
        }
      }
    }

    parsed.push({
      uid,
      messageId: mail.messageId ?? null,
      subject: mail.subject ?? "",
      fromAddress: mail.from?.value?.[0]?.address?.toLowerCase() ?? "",
      text: text.slice(0, MAX_TEXT_LENGTH * 2),
    });
  }
  return parsed;
}

/**
 * Räumt das INBOX nach der Verarbeitung auf: abgearbeitete Mails wandern in den
 * Papierkorb („Gelöschte Objekte”), Mails unberechtigter Absender unverarbeitet
 * in den Spam-Ordner. So ist das INBOX nach jedem Lauf leer und der Ordner
 * selbst dokumentiert, was mit jeder Mail passiert ist. Fehlt ein Papierkorb,
 * wird „Trash” angelegt; fehlt ein Spam-Ordner, landen auch unberechtigte
 * Mails im Papierkorb.
 */
async function moveHandledMails(
  settings: CheckinSettingsRow,
  toTrash: number[],
  toSpam: number[],
): Promise<void> {
  if (toTrash.length === 0 && toSpam.length === 0) return;

  const client = new ImapFlow({
    host: settings.imap_host,
    port: settings.imap_port,
    secure: settings.imap_port === 993,
    auth: { user: settings.imap_user, pass: decryptSecret(settings.imap_password_enc) },
    logger: false,
  });

  await client.connect();
  try {
    const mailboxes = await client.list();
    let trashPath = findMailboxPath(mailboxes, "\\Trash", TRASH_NAME_HINTS);
    if (!trashPath) {
      trashPath = "Trash";
      await client.mailboxCreate(trashPath).catch(() => {});
    }
    const spamPath = findMailboxPath(mailboxes, "\\Junk", SPAM_NAME_HINTS) ?? trashPath;

    const lock = await client.getMailboxLock("INBOX");
    try {
      if (toTrash.length > 0) await client.messageMove(toTrash, trashPath, { uid: true });
      if (toSpam.length > 0) await client.messageMove(toSpam, spamPath, { uid: true });
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

/**
 * Wendet eine validierte Extraktion an (Neuanlage oder bestätigtes Update).
 * `ownerId` bestimmt, in welcher Übersicht das Abo landet, `sender` wer als
 * Ersteller bzw. Bearbeiter vermerkt wird. Gibt die Beschreibung für die
 * Bestätigungs-Mail zurück oder wirft einen Fehler.
 */
async function applyExtraction(
  admin: Admin,
  ownerId: string,
  sender: Sender,
  extraction: CheckinExtraction,
): Promise<{ verb: "angelegt" | "aktualisiert"; name: string; rows: string[] }> {
  if (extraction.action === "update" && extraction.subscription_id) {
    const { data: existing } = await admin
      .from("subscriptions")
      .select("created_by")
      .eq("id", extraction.subscription_id)
      .eq("user_id", ownerId)
      .maybeSingle();
    if (!existing) throw new Error("Abo nicht gefunden.");
    if (!canWriteRow(sender.role, sender.userId, existing.created_by)) {
      throw new PermissionError(
        "Du darfst nur Abos ändern, die du selbst angelegt hast. Es wurde nichts geändert.",
      );
    }

    const updates: Record<string, unknown> = { ...extraction.fields };
    const { data: updated, error } = await admin
      .from("subscriptions")
      .update({ ...updates, updated_by: sender.userId, updated_at: new Date().toISOString() })
      .eq("id", extraction.subscription_id)
      .eq("user_id", ownerId)
      .select("name")
      .single();
    if (error) throw new Error(error.message);
    return {
      verb: "aktualisiert",
      name: updated.name,
      rows: describeFields(extraction.fields, null),
    };
  }

  // Neuanlage: Kategorie auflösen (vorhandene matchen, sonst anlegen)
  const categoryName = extraction.category ?? "Sonstiges";
  const { data: categories } = await admin
    .from("categories")
    .select("id, name")
    .eq("user_id", ownerId);
  let categoryId = (categories ?? []).find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
  )?.id;
  if (!categoryId) {
    const { data: newCat, error: catError } = await admin
      .from("categories")
      .insert({ name: categoryName, user_id: ownerId, created_by: sender.userId })
      .select("id")
      .single();
    if (catError) throw new Error(catError.message);
    categoryId = newCat.id;
  }

  const fields = extraction.fields;
  const { error } = await admin.from("subscriptions").insert({
    name: fields.name ?? "Unbenanntes Abo",
    description: fields.description ?? null,
    start_date: fields.start_date ?? null,
    billing_cycle: fields.billing_cycle ?? "monthly",
    min_term_months: fields.min_term_months ?? null,
    amount: fields.amount ?? 0,
    category_id: categoryId,
    cancellation_mode: fields.cancellation_mode ?? null,
    notice_period: fields.notice_period ?? null,
    canceled_at: fields.canceled_at ?? null,
    user_id: ownerId,
    created_by: sender.userId,
  });
  if (error) throw new Error(error.message);

  return {
    verb: "angelegt",
    name: fields.name ?? "Unbenanntes Abo",
    rows: describeFields(fields, categoryName),
  };
}

/** Schickt die Abo-Übersicht der Zielübersicht als Antwort auf eine Status-Abfrage. */
async function sendStatusMail(
  admin: Admin,
  settings: CheckinSettingsRow,
  sender: Sender,
  ownerName: string,
  intro: string,
): Promise<void> {
  const { data: subscriptions } = await admin
    .from("subscriptions")
    .select("*, categories(name)")
    .eq("user_id", settings.user_id)
    .order("name");

  const rows: StatusRow[] = (subscriptions ?? []).map((sub) => ({
    ...sub,
    category_name:
      (sub as { categories?: { name: string } | null }).categories?.name ?? "Ohne Kategorie",
  }));

  const { html, text } = renderStatusMail({
    recipientName: sender.name,
    ownerName: sender.role === "owner" ? null : ownerName,
    rows,
    intro,
  });

  await sendMail({
    to: sender.email,
    replyTo: settings.checkin_email,
    subject: "Deine Abo-Übersicht",
    html,
    text,
  });
}

async function processMail(
  admin: Admin,
  settings: CheckinSettingsRow,
  sender: Sender,
  ownerName: string,
  mail: ParsedMail,
): Promise<void> {
  // Antwort auf eine frühere Rückfrage?
  const tokenMatch = mail.subject.match(TOKEN_RE);
  const openItem = tokenMatch
    ? (
        await admin
          .from("checkin_items")
          .select("id, token, extracted, open_questions, kind")
          .eq("user_id", sender.userId)
          .eq("token", tokenMatch[1].toUpperCase())
          .eq("status", "question_sent")
          .maybeSingle()
      ).data
    : null;

  // Idempotenz nur für neue Mails (Antworten haben eigene Message-IDs)
  if (!openItem && mail.messageId) {
    const { data: dupe } = await admin
      .from("checkin_items")
      .select("id")
      .eq("user_id", sender.userId)
      .eq("message_id", mail.messageId)
      .maybeSingle();
    if (dupe) return;
  }

  const [{ data: subs }, { data: cats }] = await Promise.all([
    admin.from("subscriptions").select("id, name").eq("user_id", settings.user_id),
    admin.from("categories").select("id, name").eq("user_id", settings.user_id),
  ]);
  const existingSubscriptions = subs ?? [];

  const itemToken = openItem?.token ?? newToken();
  let itemId = openItem?.id ?? null;
  if (!itemId) {
    const { data: inserted, error } = await admin
      .from("checkin_items")
      .insert({
        user_id: sender.userId,
        message_id: mail.messageId,
        token: itemToken,
        status: "received",
        raw_subject: mail.subject.slice(0, 500),
        raw_excerpt: mail.text.slice(0, 500),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    itemId = inserted.id;
  }

  // Eindeutige Status-Abfragen ohne KI-Aufruf beantworten
  if (!openItem && looksLikeStatusRequest(mail.subject, mail.text)) {
    await sendStatusMail(
      admin,
      settings,
      sender,
      ownerName,
      "hier ist deine aktuelle Abo-Übersicht.",
    );
    await admin
      .from("checkin_items")
      .update({ status: "applied", kind: "status_request", updated_at: new Date().toISOString() })
      .eq("id", itemId);
    return;
  }

  let extraction: CheckinExtraction;
  try {
    extraction = await extractSubscriptionFromEmail({
      mailSubject: mail.subject,
      mailText: mail.text,
      existingSubscriptions,
      categories: cats ?? [],
      previousExtraction: openItem ? ((openItem.extracted as CheckinExtraction) ?? null) : null,
      previousQuestions: openItem?.open_questions ?? null,
      userAnswer: openItem ? mail.text : null,
    });
  } catch (err) {
    await admin
      .from("checkin_items")
      .update({
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId);
    throw err;
  }

  const kind =
    extraction.action === "update"
      ? "update_subscription"
      : extraction.action === "create"
        ? "new_subscription"
        : extraction.action === "status"
          ? "status_request"
          : (openItem?.kind ?? "unknown");

  // Frei formulierte Status- bzw. Bestandsfrage: Übersicht schicken, wobei die
  // KI-Zusammenfassung als konkrete Antwort über der Tabelle steht.
  if (extraction.action === "status") {
    await sendStatusMail(
      admin,
      settings,
      sender,
      ownerName,
      extraction.summary || "hier ist deine aktuelle Abo-Übersicht.",
    );
    await admin
      .from("checkin_items")
      .update({
        status: "applied",
        kind,
        extracted: extraction,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId);
    return;
  }

  if (extraction.action === "reject") {
    await admin
      .from("checkin_items")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", itemId);
    await sendMail({
      to: sender.email,
      subject: "Alles klar, nichts geändert",
      html: `<p>Hallo ${escapeHtml(sender.name)},</p><p>der Vorschlag wurde verworfen. Es wurde nichts geändert.</p>`,
      text: `Hallo ${sender.name},\n\nder Vorschlag wurde verworfen. Es wurde nichts geändert.`,
    });
    return;
  }

  // Unklar oder unbestätigtes Update: Rückfrage bzw. Änderungsvorschlag senden
  const needsConfirmation = extraction.action === "update" && !openItem;

  // Kategorie-Rückfrage vor der Neuanlage: Passt der KI-Vorschlag zu einer
  // bestehenden Kategorie, wird direkt zugeordnet. Wäre eine NEUE Kategorie
  // nötig (oder ist keine erkennbar), wird erst nachgefragt — nur in der
  // ersten Runde, damit die Antwort des Nutzers nicht wieder eine Frage auslöst.
  const categoryNames = (cats ?? []).map((c) => c.name);
  const categoryExists =
    extraction.category != null &&
    categoryNames.some((n) => n.toLowerCase() === extraction.category!.toLowerCase());
  const needsCategoryConfirmation =
    extraction.action === "create" && !openItem && !categoryExists;

  if (extraction.action === "unclear" || needsConfirmation || needsCategoryConfirmation) {
    const categoryList =
      categoryNames.length > 0 ? categoryNames.join(", ") : "noch keine vorhanden";
    const questions =
      extraction.action === "unclear" && extraction.questions.length > 0
        ? extraction.questions
        : needsConfirmation
          ? ["Soll ich diese Änderung übernehmen? Antworte mit „Ja” oder mit Korrekturen."]
          : needsCategoryConfirmation
            ? [
                extraction.category
                  ? `Dafür würde ich die neue Kategorie „${extraction.category}” anlegen. Ist das ok? Antworte mit „Ja” oder nenne mir eine andere Kategorie (vorhanden: ${categoryList}).`
                  : `Welcher Kategorie soll ich das Abo zuordnen? Vorhanden: ${categoryList} — oder nenne mir eine neue.`,
              ]
            : ["Kannst du das Abo genauer beschreiben (Name, Betrag, Abrechnung)?"];
    const targetName = extraction.subscription_id
      ? (existingSubscriptions.find((s) => s.id === extraction.subscription_id)?.name ?? null)
      : null;

    await admin
      .from("checkin_items")
      .update({
        status: "question_sent",
        kind,
        subscription_id: extraction.subscription_id,
        extracted: extraction,
        open_questions: questions.join("\n"),
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId);

    const introHtml = needsConfirmation
      ? `<p>deine Mail passt zum bestehenden Abo${targetName ? ` <strong>${escapeHtml(targetName)}</strong>` : ""}. Ich schlage folgende Änderung vor:</p>${listHtml(describeFields(extraction.fields, null))}`
      : needsCategoryConfirmation
        ? `<p>ich habe folgendes Abo erkannt:</p>${listHtml(describeFields(extraction.fields, null))}`
        : `<p>zu deiner Check-in-Mail${mail.subject ? ` („${escapeHtml(mail.subject)}”)` : ""} habe ich noch Fragen:</p>`;
    const introText = needsConfirmation
      ? `deine Mail passt zum bestehenden Abo${targetName ? ` "${targetName}"` : ""}. Ich schlage folgende Änderung vor:\n${describeFields(extraction.fields, null).join("\n")}`
      : needsCategoryConfirmation
        ? `ich habe folgendes Abo erkannt:\n${describeFields(extraction.fields, null).join("\n")}`
        : `zu deiner Check-in-Mail${mail.subject ? ` ("${mail.subject}")` : ""} habe ich noch Fragen:`;

    await sendMail({
      to: sender.email,
      replyTo: settings.checkin_email,
      subject: `${needsConfirmation ? "Änderungsvorschlag" : "Rückfrage zu deinem Abo-Check-in"} [Abo-Radar #${itemToken}]`,
      html: `<p>Hallo ${escapeHtml(sender.name)},</p>${introHtml}${listHtml(questions)}<p>Antworte einfach auf diese E-Mail — deine Antwort wird automatisch verarbeitet.</p>`,
      text: `Hallo ${sender.name},\n\n${introText}\n${questions.map((q) => `- ${q}`).join("\n")}\n\nAntworte einfach auf diese E-Mail — deine Antwort wird automatisch verarbeitet.`,
    });
    return;
  }

  // Anwenden (Neuanlage direkt bzw. bestätigtes Update)
  try {
    const result = await applyExtraction(admin, settings.user_id, sender, extraction);
    await admin
      .from("checkin_items")
      .update({
        status: "applied",
        kind,
        subscription_id: extraction.subscription_id,
        extracted: extraction,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId);
    await sendMail({
      to: sender.email,
      subject: `Abo ${result.verb}: ${result.name}`,
      html: `<p>Hallo ${escapeHtml(sender.name)},</p><p>${extraction.summary ? escapeHtml(extraction.summary) : `das Abo wurde ${result.verb}.`}</p>${listHtml(result.rows)}`,
      text: `Hallo ${sender.name},\n\n${extraction.summary || `das Abo wurde ${result.verb}.`}\n${result.rows.join("\n")}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin
      .from("checkin_items")
      .update({ status: "failed", error: message, updated_at: new Date().toISOString() })
      .eq("id", itemId);

    // Fehlende Berechtigung ist kein Systemfehler: der Absender bekommt eine
    // Erklärung, der Gesamtlauf läuft normal weiter.
    if (err instanceof PermissionError) {
      await sendMail({
        to: sender.email,
        subject: "Änderung nicht möglich",
        html: `<p>Hallo ${escapeHtml(sender.name)},</p><p>${escapeHtml(message)}</p>`,
        text: `Hallo ${sender.name},\n\n${message}`,
      });
      return;
    }
    throw err;
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const { data: allSettings } = await admin
    .from("checkin_settings")
    .select("user_id, checkin_email, imap_host, imap_port, imap_user, imap_password_enc")
    .eq("enabled", true);

  let processed = 0;
  const errors: string[] = [];

  for (const settings of allSettings ?? []) {
    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("email, name")
        .eq("id", settings.user_id)
        .single();
      if (!profile) continue;

      // Ohne eigene Übersicht kann kein Abo zugeordnet werden
      const { data: overview } = await admin
        .from("overviews")
        .select("owner_id")
        .eq("owner_id", settings.user_id)
        .maybeSingle();

      const senders = await buildSenderMap(admin, settings.user_id, profile);
      await rescueFromSpam(settings, senders);
      const mails = await fetchInboxMails(settings);

      // Jede Mail im INBOX wird abschließend behandelt: verarbeitete (auch
      // fehlgeschlagene, der Fehler steht dann in checkin_items) wandern in
      // den Papierkorb, unberechtigte Absender unverarbeitet in den Spam.
      const toTrash: number[] = [];
      const toSpam: number[] = [];
      const mailErrors: string[] = [];

      for (const mail of mails) {
        // Nur Mails von berechtigten Absendern verarbeiten: der Besitzer des
        // Postfachs sowie Mitnutzer mit Schreibrechten auf seine Übersicht.
        const sender = senders.get(mail.fromAddress);
        if (!sender) {
          toSpam.push(mail.uid);
          continue;
        }

        if (!mail.text.trim()) {
          toTrash.push(mail.uid);
          continue;
        }

        if (!overview) {
          await sendMail({
            to: sender.email,
            subject: "Abo-Check-in: Bitte zuerst Übersicht anlegen",
            html: `<p>Hallo ${escapeHtml(sender.name)},</p><p>deine Check-in-Mail konnte nicht verarbeitet werden, weil noch keine Abo-Übersicht angelegt ist. Lege sie zuerst in der App an und sende die Mail danach erneut.</p>`,
            text: `Hallo ${sender.name},\n\ndeine Check-in-Mail konnte nicht verarbeitet werden, weil noch keine Abo-Übersicht angelegt ist. Lege sie zuerst in der App an und sende die Mail danach erneut.`,
          });
          toTrash.push(mail.uid);
          continue;
        }

        try {
          await processMail(admin, settings, sender, profile.name, mail);
          processed++;
        } catch (err) {
          mailErrors.push(
            `${mail.fromAddress}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
        toTrash.push(mail.uid);
      }

      await moveHandledMails(settings, toTrash, toSpam);

      if (mailErrors.length > 0) {
        errors.push(...mailErrors.map((m) => `${settings.checkin_email}: ${m}`));
      }
      await admin
        .from("checkin_settings")
        .update({
          last_polled_at: new Date().toISOString(),
          last_error: mailErrors.length > 0 ? mailErrors.join("; ") : null,
        })
        .eq("user_id", settings.user_id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${settings.checkin_email}: ${message}`);
      await admin
        .from("checkin_settings")
        .update({ last_polled_at: new Date().toISOString(), last_error: message })
        .eq("user_id", settings.user_id);
    }
  }

  return NextResponse.json({ ok: true, processed, errors });
}
