"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMail } from "@/lib/email";
import { isEmail } from "@/lib/validation";

export async function sendRecommendation(
  email: string,
  challenge: { a: number; b: number; answer: number },
): Promise<{ error: string | null }> {
  if (challenge.answer !== challenge.a + challenge.b) {
    return { error: "Bitte die Rechenaufgabe korrekt lösen." };
  }

  const trimmedEmail = email.trim();
  if (!isEmail(trimmedEmail)) {
    return { error: "Bitte eine gültige E-Mail-Adresse eingeben." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let recommenderName: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
    recommenderName = profile?.name ?? null;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const intro = recommenderName
    ? `${recommenderName} empfiehlt dir den Abo-Tracker.`
    : "Jemand empfiehlt dir den Abo-Tracker.";
  const pitch = "Mit dem Abo-Tracker behältst du den Überblick über alle deine Abonnements.";

  try {
    await sendMail({
      to: trimmedEmail,
      subject: "Abo-Tracker: Empfehlung",
      html: `
        <p>${intro}</p>
        <p>${pitch}</p>
        ${appUrl ? `<p><a href="${appUrl}/register">Jetzt kostenlos registrieren</a></p>` : ""}
      `,
      text: [intro, "", pitch, ...(appUrl ? ["", `Jetzt kostenlos registrieren: ${appUrl}/register`] : [])].join(
        "\n",
      ),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "E-Mail-Versand fehlgeschlagen." };
  }

  return { error: null };
}
