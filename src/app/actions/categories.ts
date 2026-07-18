"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canWriteAny, canWriteRow, getRoleForOwner } from "@/lib/sharing";

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Bitte einen Namen angeben." };

  const overviewOwnerId = String(formData.get("overview_owner_id") ?? "").trim();
  if (!overviewOwnerId) return { error: "Keine aktive Übersicht ausgewählt." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const role = await getRoleForOwner(supabase, user, overviewOwnerId);
  if (!role || !canWriteAny(role)) return { error: "Keine Berechtigung für diese Übersicht." };

  const { error } = await supabase
    .from("categories")
    .insert({ name, user_id: overviewOwnerId, created_by: user.id });

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { data: existing } = await supabase
    .from("categories")
    .select("user_id, created_by")
    .eq("id", id)
    .single();
  if (!existing) return { error: "Kategorie nicht gefunden." };

  const role = await getRoleForOwner(supabase, user, existing.user_id);
  if (!role || !canWriteRow(role, user.id, existing.created_by)) {
    return { error: "Keine Berechtigung, diese Kategorie zu bearbeiten." };
  }

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { data: existing } = await supabase
    .from("categories")
    .select("user_id, created_by")
    .eq("id", id)
    .single();
  if (!existing) return { error: "Kategorie nicht gefunden." };

  const role = await getRoleForOwner(supabase, user, existing.user_id);
  if (!role || !canWriteRow(role, user.id, existing.created_by)) {
    return { error: "Keine Berechtigung, diese Kategorie zu löschen." };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return {
      error:
        error.code === "23503"
          ? "Kategorie wird noch von mindestens einem Abo verwendet und kann nicht gelöscht werden."
          : error.message,
    };
  }

  revalidatePath("/categories");
  revalidatePath("/subscriptions/new");
  return { error: null };
}
