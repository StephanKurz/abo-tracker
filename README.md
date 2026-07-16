# Abo-Tracker

Web-App zur Verwaltung aller privat abgeschlossenen Abonnements: Erfassung, Übersicht
inkl. Gesamtsumme, Kategorienverwaltung und Druckansicht. Benutzerkonten mit
Registrierung, E-Mail-Verifikation per sechsstelligem Code, Login über Name oder
E-Mail sowie Passwort-vergessen-Funktion.

## Tech-Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth), gehostet in Frankfurt/Deutschland (`eu-central-1`)
- Row Level Security: jeder Benutzer sieht ausschließlich seine eigenen Daten

## Lokal starten

```bash
npm install
npm run dev
```

Die Datei `.env.local` enthält bereits die Zugangsdaten des Supabase-Projekts
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

## Einmaliger manueller Schritt in Supabase

Die E-Mail-Verifikation nutzt Supabase Auth im OTP-Modus (sechsstelliger Code statt
Bestätigungslink). Damit die Bestätigungs-E-Mail den Code statt eines Links enthält,
muss im Supabase-Dashboard unter **Authentication → Email Templates → Confirm signup**
der Text so angepasst werden, dass `{{ .Token }}` verwendet wird, z. B.:

```
Dein Bestätigungscode lautet: {{ .Token }}
```

Alle übrigen Auth-Funktionen (Registrierung, Login, Passwort vergessen) funktionieren
ohne weitere Konfiguration mit dem in Supabase enthaltenen E-Mail-Versand.

## Fachliche Annahmen (aus mehrdeutiger Anforderung abgeleitet, mit Auftraggeber abgestimmt)

- Passwort-Regel „mindestens ein Großbuchstabe" (statt des unklaren „mindestens eine M.").
- Login „über Benutzername" verwendet den bei der Registrierung angegebenen **Namen**
  (kein separates Benutzername-Feld).
- „Kündigungsmodus" und „Kündigungsfrist" sind zwei unabhängige, optionale Felder.
  Die genaue Berechnungslogik für „Nächstes Kündigungsdatum" ist in
  `src/lib/subscriptions.ts` (`computeNextCancellationDate`) dokumentiert.

## Hinweis zum Hosting der Anwendung selbst

Datenbank und Authentifizierung laufen in Frankfurt (Supabase `eu-central-1`). Für ein
vollständig DSGVO-konformes Setup sollte auch das Next.js-Frontend selbst auf einem
Server mit Standort Deutschland/EU deployt werden (z. B. Vercel-Region `fra1` oder ein
deutscher Hosting-Anbieter).
