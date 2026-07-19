"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMail } from "@/lib/email";

export async function submitFeedback(text: string): Promise<{ error: string | null }> {
  const trimmed = text.trim();
  if (!trimmed) return { error: "Bitte gib einen Text ein." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).single();
  const userEmail = profile?.email ?? user.email ?? "";

  const { error: insertError } = await supabase
    .from("feedback")
    .insert({ user_id: user.id, text: trimmed });
  if (insertError) return { error: insertError.message };

  try {
    await sendMail({
      to: "stephan.kurz@gmx.de",
      subject: "Abo-Tracker: Feedback",
      replyTo: userEmail,
      text: `${trimmed}\n\n${userEmail}`,
      html: `<p>${trimmed.replace(/\n/g, "<br>")}</p><p>${userEmail}</p>`,
    });
  } catch {
    // Feedback ist bereits gespeichert; E-Mail-Zustellung ist best-effort
  }

  return { error: null };
}
