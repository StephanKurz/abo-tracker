import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export default function DatenschutzPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-6">
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
            Alle Abo-, Kategorie- und Profildaten sind durch Datenbankregeln (Row Level Security)
            ausschließlich für den jeweils angemeldeten Benutzer selbst einsehbar und bearbeitbar.
            Ein Zugriff auf Daten anderer Nutzer ist technisch nicht möglich.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Verarbeitete Daten</h2>
          <p className="text-gray-700">
            Bei der Registrierung werden Name, E-Mail-Adresse und ein verschlüsseltes Passwort
            gespeichert. Die E-Mail-Adresse wird zur Kontofreischaltung per Bestätigungscode und für
            die Passwort-vergessen-Funktion verwendet.
          </p>
        </section>

        <Link href="/login" className="text-orange-600 hover:underline">
          Zurück zur Anmeldung
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
