import Link from "next/link";

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="flex gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 font-bold text-white">
          {number}
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function SoGehtsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">So geht&apos;s</h1>
        <p className="mt-1 text-sm text-gray-500">
          Diese kurze Anleitung zeigt dir alles Wichtige rund um Abo-Radar.
        </p>
      </div>

      <Section number={1} title="Übersicht anlegen & erstes Abo erfassen">
        <p className="text-gray-700">
          Nach dem ersten Login legst du mit einem Klick deine Abo-Übersicht an. Über den
          Button „Neues Abo” auf der{" "}
          <Link href="/dashboard" className="text-orange-600 hover:underline">
            Übersicht
          </Link>{" "}
          erfasst du Name, Betrag, Abrechnung (monatlich/jährlich), Abschlussdatum,
          Mindestlaufzeit und Kündigungsfrist. Kategorien wie „Streaming” oder
          „Versicherungen” helfen beim Sortieren — du verwaltest sie unter{" "}
          <Link href="/account" className="text-orange-600 hover:underline">
            Einstellungen
          </Link>{" "}
          im Bereich „Kategorien”.
        </p>
      </Section>

      <Section number={2} title="Alles im Blick: die Übersicht">
        <p className="text-gray-700">
          Die Übersicht zeigt alle Abos mit Jahres- und Monatskosten, getrennt nach allen und
          ungekündigten Abos. Sortiere per Klick auf die Spaltentitel. Mit dem Stift-Symbol
          bearbeitest du ein Abo, über das Drucker-Symbol lädst du eine PDF-Übersicht herunter.
        </p>
      </Section>

      <Section number={3} title="Nie wieder Fristen verpassen">
        <p className="text-gray-700">
          Unter Einstellungen → Benachrichtigungen legst du fest, wie viele Tage vor dem
          nächsten Kündigungstermin dich Abo-Radar per E-Mail erinnert. Mit „Testmail senden”
          prüfst du sofort, ob alles ankommt.
        </p>
      </Section>

      <Section number={4} title="Abos per E-Mail erfassen — der E-Mail-Check-in">
        <p className="text-gray-700">
          Richte unter Einstellungen → E-Mail-Check-in ein eigenes Postfach ein
          (IMAP-Zugangsdaten genügen). Danach leitest du Bestellbestätigungen oder Rechnungen
          einfach an dieses Postfach weiter — als Text, als PDF-Anhang, oder als
          Foto/Screenshot (JPEG, PNG, GIF oder WebP, bis zu 3 Bilder pro Mail, je maximal
          5 MB). Abo-Radar liest die Mail, erkennt die Daten per KI und trägt das Abo
          automatisch ein — auch aus Bild-Anhängen. Fehlen Angaben wie Kündigungsmodus oder
          -frist, recherchiert die KI sie bei bekannten Anbietern selbst nach oder fragt kurz
          nach — einfach antworten, fertig.
        </p>
        <p className="text-gray-700">
          Tipp: Eine Mail mit dem Betreff „Abo Status” an dein Check-in-Postfach liefert dir
          deine komplette Übersicht als Antwort — auch Fragen wie „Ist Netflix schon drin?”
          werden direkt beantwortet.
        </p>
      </Section>

      <Section number={5} title="Gemeinsam nutzen">
        <p className="text-gray-700">
          Über dein Profil (Link hinter deinem Namen oben) → Zugriff teilen lädst du z. B. deine Familie ein, deine
          Übersicht mitzunutzen — wahlweise nur lesend, mit Vollzugriff oder mit Vollzugriff
          nur auf selbst angelegte Abos. Personen mit Schreibrechten können sogar per E-Mail
          an dein Check-in-Postfach Abos eintragen.
        </p>
      </Section>

      <Section number={6} title="Deine Meinung zählt">
        <p className="text-gray-700">
          Bewerte Abo-Radar unter Einstellungen mit einem Klick, schick uns über „Mein
          Feedback” deine Wünsche — oder empfiehl Abo-Radar weiter, wenn es dir gefällt.
        </p>
      </Section>
    </div>
  );
}
