"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
