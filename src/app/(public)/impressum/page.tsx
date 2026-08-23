import Link from "next/link";
import { ObfuscatedEmail } from "@/components/ObfuscatedEmail";

export default function ImpressumPage() {
  return (
    <div className="w-full max-w-3xl self-start space-y-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Impressum</h1>

      <section className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">Angaben gemäß § 5 DDG</h2>
        <p className="text-gray-700">
          Kurz Intelligence™
          <br />
          Hans-Sachs-Str. 44
          <br />
          72760 Reutlingen
          <br />
          Deutschland
        </p>
      </section>

      <section className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">Vertreten durch</h2>
        <p className="text-gray-700">Stephan Kurz</p>
      </section>

      <section className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">Kontakt</h2>
        <p className="text-gray-700">
          Telefon: 0176 / 1623-0777
          <br />
          E-Mail: <ObfuscatedEmail user="abo" domain="mykurz.de" />
        </p>
      </section>

      <section className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
        </h2>
        <p className="text-gray-700">
          Stephan Kurz
          <br />
          Hans-Sachs-Str. 44
          <br />
          72760 Reutlingen
        </p>
      </section>

      <Link href="/login" className="text-orange-600 hover:underline">
        Zurück
      </Link>
    </div>
  );
}
