import Link from "next/link";

export default function DatenschutzPage() {
  return (
    <div className="w-full max-w-3xl self-start space-y-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Datenschutzhinweise</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">Hosting</h2>
        <p className="text-gray-700">
          Datenbank und Authentifizierung dieser Anwendung werden in einem Rechenzentrum in
          Frankfurt am Main, Deutschland (Region eu-central-1), betrieben.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">Zugriff auf deine Daten</h2>
        <p className="text-gray-700">
          Abo-, Kategorie- und Profildaten sind durch Datenbankregeln (Row Level Security)
          grundsätzlich ausschließlich für den jeweils angemeldeten Benutzer selbst einsehbar und
          bearbeitbar. Nach der Registrierung wird zunächst keine Abo-Übersicht angelegt — das
          entscheidest du selbst.
        </p>
        <p className="text-gray-700">
          Über die Funktion „Zugriff teilen” in „Mein Konto” kannst du eine andere, bereits
          registrierte Person gezielt und freiwillig einladen, deine Abo-Übersicht einzusehen oder
          zu bearbeiten (Vollzugriff, Vollzugriff nur für selbst angelegte Abos, oder Nur-Lese-Zugriff).
          Eine solche Freigabe wird erst wirksam, nachdem die eingeladene Person die Einladung
          ausdrücklich angenommen hat, und du kannst sie jederzeit widerrufen. Die eingeladene
          Person sieht deine Daten nur, wenn sie aktiv in die Ansicht „Übersicht von dir” wechselt;
          ihre eigenen Daten bleiben davon getrennt und werden nie vermischt angezeigt. Eine
          eingeladene Person kann selbst keine weiteren Personen zu deinen Daten einladen.
        </p>
        <p className="text-gray-700">
          Lädst du eine Person ein, die sich noch nicht registriert hat, wird ihre E-Mail-Adresse
          bis zur Registrierung, Ablehnung oder einem Widerruf der Einladung gespeichert; die
          Einladung erscheint automatisch, sobald sich diese Person mit genau dieser E-Mail-Adresse
          registriert.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">Verarbeitete Daten</h2>
        <p className="text-gray-700">
          Bei der Registrierung werden Name, E-Mail-Adresse und ein verschlüsseltes Passwort
          gespeichert. Die E-Mail-Adresse wird zur Kontofreischaltung per Bestätigungscode und für
          die Passwort-vergessen-Funktion verwendet.
        </p>
        <p className="text-gray-700">
          Lädst du eine andere Person zum Zugriff auf deine Abo-Übersicht ein, wird deren
          E-Mail-Adresse ausschließlich verwendet, um sie über die Einladung zu informieren.
          Kündigungserinnerungen per E-Mail gehen stets ausschließlich an den Eigentümer einer
          Abo-Übersicht, nie an eingeladene Personen.
        </p>
      </section>

      <Link href="/login" className="text-orange-600 hover:underline">
        Zurück
      </Link>
    </div>
  );
}
