"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitRating(isPositive: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { error } = await supabase
    .from("app_ratings")
    .upsert({ user_id: user.id, is_positive: isPositive }, { onConflict: "user_id" });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { error: null };
}
