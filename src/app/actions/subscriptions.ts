"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const errors: string[] = [];
  if (!name) errors.push("Name ist ein Pflichtfeld.");
  if (!["monthly", "yearly"].includes(billing_cycle)) errors.push("Abrechnung ist ein Pflichtfeld.");
  if (!amount || Number.isNaN(Number(amount)) || Number(amount) < 0) {
    errors.push("Betrag pro Abrechnungseinheit ist ein Pflichtfeld.");
  }
  if (!category_id) errors.push("Kategorie ist ein Pflichtfeld.");

  const values: Omit<TablesInsert<"subscriptions">, "user_id"> = {
    name,
    description: description || null,
    start_date: start_date || null,
    billing_cycle,
    min_term_months: min_term_months ? Number(min_term_months) : null,
    amount: Number(amount || 0),
    category_id,
    cancellation_mode: cancellation_mode || null,
    notice_period: notice_period || null,
  };

  return { values, errors };
}

export async function createSubscription(formData: FormData) {
  const { values, errors } = parseSubscriptionForm(formData);
  if (errors.length > 0) return { error: errors.join(" ") };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { error } = await supabase
    .from("subscriptions")
    .insert({ ...values, user_id: user.id });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateSubscription(id: string, formData: FormData) {
  const { values, errors } = parseSubscriptionForm(formData);
  if (errors.length > 0) return { error: errors.join(" ") };

  const supabase = await createClient();
  const { error } = await supabase.from("subscriptions").update(values).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(`/subscriptions/${id}`);
  redirect("/dashboard");
}

export async function deleteSubscription(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("subscriptions").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
