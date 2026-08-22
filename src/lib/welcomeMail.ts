// Willkommens-Mail mit Bedienungsanleitung für neu registrierte Personen.
// Wird (nach Freigabe des Entwurfs) nach erfolgreicher Registrierung
// verschickt. Nur Inline-CSS, damit E-Mail-Programme sie korrekt darstellen;
// den gebrandeten Rahmen (Kopfleiste, Signatur) ergänzt sendMail() zentral.

import { escapeHtml as esc } from "@/lib/email";

const ORANGE = "#ea580c";

function section(number: number, title: string, contentHtml: string): string {
  return `
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 20px 0;">
      <tr>
        <td style="width:36px;vertical-align:top;padding-top:2px;">
          <div style="width:28px;height:28px;border-radius:50%;background-color:${ORANGE};color:#ffffff;font-weight:bold;font-size:14px;text-align:center;line-height:28px;">${number}</div>
        </td>
        <td style="vertical-align:top;">
          <div style="font-size:16px;font-weight:bold;color:#111827;margin-bottom:6px;">${title}</div>
          <div style="font-size:14px;color:#374151;line-height:1.6;">${contentHtml}</div>
        </td>
      </tr>
    </table>`;
}

function tip(contentHtml: string): string {
  return `
    <div style="margin:8px 0 0 0;padding:10px 12px;background-color:#fff7ed;border-left:3px solid ${ORANGE};border-radius:4px;font-size:13px;color:#7c2d12;">
      💡 ${contentHtml}
    </div>`;
}

export function renderWelcomeMail(input: {
  name: string;
  appUrl: string;
}): { subject: string; html: string; text: string } {
  const { name, appUrl } = input;
  const link = (path: string, label: string) =>
    appUrl
      ? `<a href="${appUrl}${path}" style="color:${ORANGE};font-weight:bold;">${label}</a>`
      : `<strong>${label}</strong>`;

  const html = `
    <p style="font-size:14px;color:#374151;">Hallo ${esc(name)},</p>
    <p style="font-size:14px;color:#374151;line-height:1.6;">
      willkommen bei <strong>Abo-Radar</strong> — deinem intelligenten Abo-Wächter!
      Hier behältst du alle Abonnements, Kosten und Kündigungsfristen im Blick.
      Diese kurze Anleitung zeigt dir alles Wichtige.
    </p>

    ${section(
      1,
      "Übersicht anlegen & erstes Abo erfassen",
      `Nach dem ersten Login legst du mit einem Klick deine <strong>Abo-Übersicht</strong> an.
       Über ${link("/subscriptions/new", "„Neues Abo”")} erfasst du dann dein erstes Abo:
       Name, Betrag, Abrechnung (monatlich/jährlich), Abschlussdatum, Mindestlaufzeit und
       Kündigungsfrist. Kategorien wie „Streaming” oder „Versicherungen” helfen beim Sortieren —
       du kannst sie unter ${link("/account", "„Einstellungen”")} im Bereich „Kategorien” verwalten.`,
    )}

    ${section(
      2,
      "Alles im Blick: die Übersicht",
      `Die ${link("/dashboard", "„Übersicht”")} zeigt alle Abos mit Jahres- und Monatskosten,
       getrennt nach allen und ungekündigten Abos. Sortiere per Klick auf die Spaltentitel —
       standardmäßig steht das Abo mit dem nächsten Kündigungstermin oben. Mit dem
       Stift-Symbol bearbeitest du ein Abo, über den Button ${link("/print", "„Drucken”")}
       auf der Übersicht bekommst du eine druckfertige Liste nach Kategorien.`,
    )}

    ${section(
      3,
      "Nie wieder Fristen verpassen",
      `Unter ${link("/account", "„Einstellungen”")} → <strong>Benachrichtigungen</strong> legst du fest,
       wie viele Tage vor dem nächsten Kündigungstermin dich Abo-Radar per E-Mail erinnert.
       Mit „Testmail senden” prüfst du sofort, ob alles ankommt.`,
    )}

    ${section(
      4,
      "Abos per E-Mail erfassen — der E-Mail-Check-in",
      `Das Herzstück von Abo-Radar: Richte unter ${link("/account", "„Einstellungen”")} →
       <strong>E-Mail-Check-in</strong> ein eigenes Postfach ein (IMAP-Zugangsdaten genügen).
       Danach leitest du einfach Bestellbestätigungen oder Rechnungen an dieses Postfach weiter —
       als Text, als PDF-Anhang oder als Foto/Screenshot (JPEG, PNG, GIF, WebP, bis zu 3 Bilder
       pro Mail, je max. 5 MB) — oder schreibst formlos <em>„Netflix, 12,99 € monatlich, ab 01.09.”</em>.
       Abo-Radar liest die Mail, erkennt die Daten per KI und trägt das Abo automatisch ein.
       Fehlt etwas, bekommst du eine Rückfrage per E-Mail — einfach antworten, fertig.
       ${tip(
         `Schick eine Mail mit dem Betreff <strong>„Abo Status”</strong> an dein Check-in-Postfach
          und du bekommst deine komplette Übersicht als Antwort. Auch Fragen wie
          <em>„Ist Netflix schon drin?”</em> werden direkt beantwortet.`,
       )}`,
    )}

    ${section(
      5,
      "Gemeinsam nutzen",
      `Über ${link("/account", "„Einstellungen”")} → <strong>Zugriff teilen</strong> lädst du z.B.
       deine Familie ein, deine Übersicht mitzunutzen — wahlweise nur lesend, mit Vollzugriff
       oder mit Vollzugriff nur auf selbst angelegte Abos. Personen mit Schreibrechten können
       sogar per E-Mail an dein Check-in-Postfach Abos eintragen.`,
    )}

    ${section(
      6,
      "Deine Meinung zählt",
      `Bewerte Abo-Radar unter ${link("/account", "„Einstellungen”")} mit einem Klick,
       schick uns über <strong>„Mein Feedback”</strong> deine Wünsche — oder empfiehl
       Abo-Radar weiter, wenn es dir gefällt.`,
    )}

    <p style="font-size:14px;color:#374151;line-height:1.6;margin-top:8px;">
      Viel Freude mit Abo-Radar!<br>
      ${appUrl ? `<a href="${appUrl}/dashboard" style="display:inline-block;margin-top:12px;padding:10px 20px;background-color:${ORANGE};color:#ffffff;font-weight:bold;text-decoration:none;border-radius:6px;">Jetzt loslegen</a>` : ""}
    </p>`;

  const text = [
    `Hallo ${name},`,
    "",
    "willkommen bei Abo-Radar — deinem intelligenten Abo-Wächter!",
    "Hier behältst du alle Abonnements, Kosten und Kündigungsfristen im Blick.",
    "",
    "1. Übersicht anlegen & erstes Abo erfassen",
    "Nach dem ersten Login legst du mit einem Klick deine Abo-Übersicht an. Über",
    "„Neues Abo” erfasst du Name, Betrag, Abrechnung, Abschlussdatum, Mindestlaufzeit",
    "und Kündigungsfrist. Kategorien verwaltest du unter „Einstellungen” im Bereich",
    "„Kategorien”.",
    "",
    "2. Alles im Blick: die Übersicht",
    "Die Übersicht zeigt alle Abos mit Jahres- und Monatskosten, getrennt nach allen",
    "und ungekündigten Abos. Sortierung per Klick auf die Spaltentitel, Bearbeiten über",
    "das Stift-Symbol, druckfertige Liste über den Button „Drucken” auf der Übersicht.",
    "",
    "3. Nie wieder Fristen verpassen",
    "Unter „Einstellungen” → Benachrichtigungen legst du fest, wie viele Tage vor dem",
    "nächsten Kündigungstermin dich Abo-Radar per E-Mail erinnert.",
    "",
    "4. Abos per E-Mail erfassen — der E-Mail-Check-in",
    "Richte unter „Einstellungen” → E-Mail-Check-in ein eigenes Postfach ein und leite",
    "Bestellbestätigungen einfach dorthin weiter — als Text, als PDF-Anhang oder als",
    "Foto/Screenshot (JPEG, PNG, GIF, WebP, bis zu 3 Bilder, je max. 5 MB) — oder schreib",
    "formlos „Netflix, 12,99 € monatlich, ab 01.09.”. Abo-Radar trägt das Abo automatisch",
    "ein und fragt per E-Mail nach, wenn etwas fehlt.",
    "Tipp: Eine Mail mit Betreff „Abo Status” liefert dir deine komplette Übersicht",
    "als Antwort — auch Fragen wie „Ist Netflix schon drin?” werden beantwortet.",
    "",
    "5. Gemeinsam nutzen",
    "Über „Einstellungen” → Zugriff teilen lädst du andere ein — nur lesend, mit",
    "Vollzugriff oder mit Vollzugriff nur auf selbst angelegte Abos.",
    "",
    "6. Deine Meinung zählt",
    "Bewerte Abo-Radar, schick uns dein Feedback — oder empfiehl es weiter.",
    "",
    "Viel Freude mit Abo-Radar!",
    ...(appUrl ? ["", `Jetzt loslegen: ${appUrl}/dashboard`] : []),
  ].join("\n");

  return { subject: "Willkommen bei Abo-Radar – so geht's los", html, text };
}
