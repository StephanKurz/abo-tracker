"use server";

import { createClient } from "@/lib/supabase/server";
import { createFeedbackTask } from "@/lib/todoist";

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
    await createFeedbackTask(trimmed, userEmail);
  } catch {
    // Feedback ist bereits gespeichert; Todoist-Übertragung ist best-effort
  }

  return { error: null };
}
