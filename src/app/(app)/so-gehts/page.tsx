import Link from "next/link";

export default function SoGehtsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">So geht&apos;s</h1>
      <p className="text-gray-700">
        Diese kurze Anleitung zeigt dir alles Wichtige rund um Abo-Radar.
      </p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">
          1. Übersicht anlegen &amp; erstes Abo erfassen
        </h2>
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
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">2. Alles im Blick: die Übersicht</h2>
        <p className="text-gray-700">
          Die Übersicht zeigt alle Abos mit Jahres- und Monatskosten, getrennt nach allen und
          ungekündigten Abos. Sortiere per Klick auf die Spaltentitel. Mit dem Stift-Symbol
          bearbeitest du ein Abo, über den Button „Drucken” bekommst du eine druckfertige
          Liste nach Kategorien.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">3. Nie wieder Fristen verpassen</h2>
        <p className="text-gray-700">
          Unter Einstellungen → Benachrichtigungen legst du fest, wie viele Tage vor dem
          nächsten Kündigungstermin dich Abo-Radar per E-Mail erinnert. Mit „Testmail senden”
          prüfst du sofort, ob alles ankommt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">
          4. Abos per E-Mail erfassen — der E-Mail-Check-in
        </h2>
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
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">5. Gemeinsam nutzen</h2>
        <p className="text-gray-700">
          Über Einstellungen → Zugriff teilen lädst du z. B. deine Familie ein, deine
          Übersicht mitzunutzen — wahlweise nur lesend, mit Vollzugriff oder mit Vollzugriff
          nur auf selbst angelegte Abos. Personen mit Schreibrechten können sogar per E-Mail
          an dein Check-in-Postfach Abos eintragen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">6. Deine Meinung zählt</h2>
        <p className="text-gray-700">
          Bewerte Abo-Radar unter Einstellungen mit einem Klick, schick uns über „Mein
          Feedback” deine Wünsche — oder empfiehl Abo-Radar weiter, wenn es dir gefällt.
        </p>
      </section>
    </div>
  );
}
