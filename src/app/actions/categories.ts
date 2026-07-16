"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Bitte einen Namen angeben." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { error } = await supabase
    .from("categories")
    .insert({ name, user_id: user.id });

  if (error) {
    return {
      error: error.code === "23505" ? "Diese Kategorie existiert bereits." : error.message,
    };
  }

  revalidatePath("/categories");
  revalidatePath("/subscriptions/new");
  return { error: null };
}

export async function renameCategory(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Bitte einen Namen angeben." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name: trimmed })
    .eq("id", id);

  if (error) {
    return {
      error: error.code === "23505" ? "Diese Kategorie existiert bereits." : error.message,
    };
  }

  revalidatePath("/categories");
  revalidatePath("/subscriptions/new");
  return { error: null };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return {
      error: error.code === "23503"
        ? "Kategorie wird noch von mindestens einem Abo verwendet und kann nicht gelöscht werden."
        : error.message,
    };
  }

  revalidatePath("/categories");
  revalidatePath("/subscriptions/new");
  return { error: null };
}
