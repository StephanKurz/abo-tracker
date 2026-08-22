"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMail } from "@/lib/email";
import { renderWelcomeMail } from "@/lib/welcomeMail";

/**
 * Verschickt die Willkommensmail mit Bedienungsanleitung. Wird direkt nach
 * der erfolgreichen E-Mail-Bestätigung aufgerufen; Fehler blockieren die
 * Registrierung nicht (best-effort).
 */
export async function sendWelcomeEmail(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .single();

  const to = profile?.email ?? user.email ?? "";
  if (!to) return { error: "Keine E-Mail-Adresse gefunden." };

  const { subject, html, text } = renderWelcomeMail({
    name: profile?.name?.trim() || "du",
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
  });

  try {
    await sendMail({ to, subject, html, text });
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "E-Mail-Versand fehlgeschlagen." };
  }
}
