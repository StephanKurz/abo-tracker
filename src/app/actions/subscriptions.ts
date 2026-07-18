"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseGermanAmount } from "@/lib/subscriptions";
import { canWriteAny, canWriteRow, getRoleForOwner } from "@/lib/sharing";
import type { TablesInsert } from "@/types/database.types";

function parseSubscriptionForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const start_date = String(formData.get("start_date") ?? "").trim();
  const billing_cycle = String(formData.get("billing_cycle") ?? "").trim();
  const min_term_months = String(formData.get("min_term_months") ?? "").trim();
  const amount = String(formData.get("amount") ?? "").trim();
  const category_id = String(formData.get("category_id") ?? "").trim();
  const cancellation_mode = String(formData.get("cancellation_mode") ?? "").trim();
  const notice_period = String(formData.get("notice_period") ?? "").trim();
  const canceled_at = String(formData.get("canceled_at") ?? "").trim();

  const parsedAmount = parseGermanAmount(amount);

  const errors: string[] = [];
  if (!name) errors.push("Name ist ein Pflichtfeld.");
  if (!["monthly", "yearly"].includes(billing_cycle)) errors.push("Abrechnung ist ein Pflichtfeld.");
  if (!amount || Number.isNaN(parsedAmount) || parsedAmount < 0) {
    errors.push("Betrag pro Abrechnungseinheit ist ein Pflichtfeld.");
  }
  if (!category_id) errors.push("Kategorie ist ein Pflichtfeld.");

  const values: Omit<TablesInsert<"subscriptions">, "user_id" | "created_by"> = {
    name,
    description: description || null,
    start_date: start_date || null,
    billing_cycle,
    min_term_months: min_term_months ? Number(min_term_months) : null,
    amount: Number.isNaN(parsedAmount) ? 0 : parsedAmount,
    category_id,
    cancellation_mode: cancellation_mode || null,
    notice_period: notice_period || null,
    canceled_at: canceled_at || null,
  };

  return { values, errors };
}

export async function createSubscription(formData: FormData) {
  const { values, errors } = parseSubscriptionForm(formData);
  if (errors.length > 0) return { error: errors.join(" ") };

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
    .from("subscriptions")
    .insert({ ...values, user_id: overviewOwnerId, created_by: user.id });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/print");
  redirect("/dashboard");
}

export async function updateSubscription(id: string, formData: FormData) {
  const { values, errors } = parseSubscriptionForm(formData);
  if (errors.length > 0) return { error: errors.join(" ") };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("user_id, created_by")
    .eq("id", id)
    .single();
  if (!existing) return { error: "Abo nicht gefunden." };

  const role = await getRoleForOwner(supabase, user, existing.user_id);
  if (!role || !canWriteRow(role, user.id, existing.created_by)) {
    return { error: "Keine Berechtigung, dieses Abo zu bearbeiten." };
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({ ...values, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/print");
  revalidatePath(`/subscriptions/${id}`);
  redirect("/dashboard");
}

export async function deleteSubscription(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("user_id, created_by")
    .eq("id", id)
    .single();
  if (!existing) return { error: "Abo nicht gefunden." };

  const role = await getRoleForOwner(supabase, user, existing.user_id);
  if (!role || !canWriteRow(role, user.id, existing.created_by)) {
    return { error: "Keine Berechtigung, dieses Abo zu löschen." };
  }

  const { error } = await supabase.from("subscriptions").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/print");
  redirect("/dashboard");
}
