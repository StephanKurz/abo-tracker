import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export default function ImpressumPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Impressum</h1>

        <section className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Angaben gemäß § 5 TMG</h2>
          <p className="text-gray-700">
            Kurz Intelligence
            <br />
            [Straße, Hausnummer]
            <br />
            [PLZ] Reutlingen
            <br />
            Deutschland
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Vertreten durch</h2>
          <p className="text-gray-700">[Name der vertretungsberechtigten Person]</p>
        </section>

        <section className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Kontakt</h2>
          <p className="text-gray-700">
            Telefon: [Telefonnummer]
            <br />
            E-Mail: [E-Mail-Adresse]
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Registereintrag</h2>
          <p className="text-gray-700">
            [Eintragung im Handelsregister, Registergericht und Registernummer, falls vorhanden]
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Umsatzsteuer-ID</h2>
          <p className="text-gray-700">
            Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
            <br />
            [USt-IdNr., falls vorhanden]
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
          </h2>
          <p className="text-gray-700">
            [Name]
            <br />
            [Anschrift wie oben]
          </p>
        </section>

        <p className="text-xs text-gray-500">
          Diese Seite enthält noch Platzhalter (in eckigen Klammern), die durch die tatsächlichen
          Angaben zu ersetzen sind.
        </p>

        <Link href="/login" className="text-orange-600 hover:underline">
          Zurück zur Anmeldung
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
