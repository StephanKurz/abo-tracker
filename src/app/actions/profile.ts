"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateNotificationSettings(formData: FormData) {
  const raw = String(formData.get("notify_days_before") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  if (!raw) {
    const { error } = await supabase
      .from("profiles")
      .update({ notify_days_before: null })
      .eq("id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/account");
    return { error: null };
  }

  const days = Number(raw);
  if (!Number.isInteger(days) || days < 0) {
    return { error: "Bitte eine gültige Anzahl Tage (0 oder mehr) angeben." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ notify_days_before: days })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/account");
  return { error: null };
}

export async function updateProfileName(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Bitte einen Namen angeben." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { error } = await supabase.from("profiles").update({ name }).eq("id", user.id);

  if (error) {
    return {
      error: error.code === "23505" ? "Dieser Name ist bereits vergeben." : error.message,
    };
  }

  revalidatePath("/account");
  revalidatePath("/dashboard");
  return { error: null };
}
