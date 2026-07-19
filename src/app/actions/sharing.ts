"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendMail } from "@/lib/email";
import { ACTIVE_OVERVIEW_COOKIE, PERMISSION_LABELS } from "@/lib/sharing";
import type { Role } from "@/lib/sharing";
import { resolveActiveOverview } from "@/lib/activeOverview";

type ActionResult = { error: string | null };

const VALID_PERMISSIONS = ["full", "full_own", "read"] as const;

export async function createOwnOverview(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { error } = await supabase.from("overviews").insert({ owner_id: user.id });
  if (error) {
    return {
      error: error.code === "23505" ? "Du hast bereits eine eigene Übersicht." : error.message,
    };
  }

  revalidatePath("/", "layout");
  return { error: null };
}

export async function lookupInviteEmail(
  email: string,
): Promise<{ error: string | null; found: boolean; name: string | null }> {
  const trimmed = email.trim();
  if (!trimmed) return { error: "Bitte eine E-Mail-Adresse angeben.", found: false, name: null };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lookup_invite_email", { p_email: trimmed });
  if (error) return { error: error.message, found: false, name: null };

  const row = data?.[0];
  return { error: null, found: row?.found ?? false, name: row?.name ?? null };
}

export async function inviteCollaborator(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const permission = String(formData.get("permission") ?? "");

  if (!email) return { error: "Bitte eine E-Mail-Adresse angeben." };
  if (!VALID_PERMISSIONS.includes(permission as (typeof VALID_PERMISSIONS)[number])) {
    return { error: "Bitte eine Berechtigungsstufe wählen." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  if (email === user.email?.toLowerCase()) {
    return { error: "Du kannst dich nicht selbst einladen." };
  }

  const { data: ownOverview } = await supabase
    .from("overviews")
    .select("owner_id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!ownOverview) return { error: "Lege zuerst deine eigene Übersicht an." };

  const { data: existing } = await supabase
    .from("overview_collaborators")
    .select("id, status")
    .eq("overview_owner_id", user.id)
    .eq("invited_email", email)
    .maybeSingle();

  if (existing?.status === "accepted") return { error: "Diese Person hat bereits Zugriff." };
  if (existing?.status === "pending") return { error: "Diese Person wurde bereits eingeladen." };

  if (existing) {
    const { error } = await supabase
      .from("overview_collaborators")
      .update({ status: "pending", permission, invited_by: user.id, responded_at: null })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("overview_collaborators").insert({
      overview_owner_id: user.id,
      invited_email: email,
      permission,
      invited_by: user.id,
    });
    if (error) return { error: error.message };
  }

  const [{ data: ownerProfile }, { data: lookup }] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).single(),
    supabase.rpc("lookup_invite_email", { p_email: email }),
  ]);
  const hasAccount = lookup?.[0]?.found ?? false;
  const ownerName = ownerProfile?.name ?? "Jemand";
  const permissionLabel = PERMISSION_LABELS[permission as Role] ?? permission;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const accountHint = hasAccount
    ? "Logg dich ein und nimm die Einladung unter „Mein Konto” an."
    : `Du hast noch kein Konto? Registriere dich mit genau dieser E-Mail-Adresse (${email}), die Einladung erscheint danach automatisch unter „Mein Konto”.`;
  const actionPath = hasAccount ? "/login" : "/register";
  const actionLabel = hasAccount ? "Jetzt einloggen" : "Jetzt registrieren";

  try {
    await sendMail({
      to: email,
      subject: `${ownerName} hat dich zum Abo-Tracker eingeladen`,
      html: `
        <p>Hallo,</p>
        <p><strong>${ownerName}</strong> hat dich eingeladen, seine/ihre Abo-Übersicht im Abo-Tracker
        mit der Berechtigung „${permissionLabel}” einzusehen${permission !== "read" ? " und zu bearbeiten" : ""}.</p>
        <p>${accountHint}</p>
        ${appUrl ? `<p><a href="${appUrl}${actionPath}">${actionLabel}</a></p>` : ""}
      `,
      text: [
        `${ownerName} hat dich zum Abo-Tracker eingeladen`,
        "",
        `${ownerName} hat dich eingeladen, seine/ihre Abo-Übersicht im Abo-Tracker mit der Berechtigung „${permissionLabel}” einzusehen${permission !== "read" ? " und zu bearbeiten" : ""}.`,
        "",
        accountHint,
        ...(appUrl ? ["", `${actionLabel}: ${appUrl}${actionPath}`] : []),
      ].join("\n"),
    });
  } catch {
    // Einladung ist bereits gespeichert; E-Mail-Zustellung ist best-effort
  }

  revalidatePath("/account");
  return { error: null };
}

export async function updateCollaboratorPermission(
  id: string,
  permission: string,
): Promise<ActionResult> {
  if (!VALID_PERMISSIONS.includes(permission as (typeof VALID_PERMISSIONS)[number])) {
    return { error: "Ungültige Berechtigungsstufe." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("overview_collaborators")
    .update({ permission })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/account");
  return { error: null };
}

export async function revokeCollaborator(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("overview_collaborators")
    .update({ status: "revoked", responded_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/account");
  return { error: null };
}

export async function deleteCollaboratorRow(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { error } = await supabase
    .from("overview_collaborators")
    .delete()
    .eq("id", id)
    .eq("overview_owner_id", user.id)
    .eq("status", "revoked");
  if (error) return { error: error.message };

  revalidatePath("/account");
  return { error: null };
}

export async function acceptInvite(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("overview_collaborators")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/account");
  revalidatePath("/", "layout");
  return { error: null };
}

export async function declineInvite(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("overview_collaborators")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/account");
  return { error: null };
}

export async function leaveOverview(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("overview_collaborators")
    .update({ status: "left", responded_at: new Date().toISOString() })
    .eq("id", id)
    .select("overview_owner_id")
    .single();
  if (error) return { error: error.message };

  const cookieStore = await cookies();
  if (row && cookieStore.get(ACTIVE_OVERVIEW_COOKIE)?.value === row.overview_owner_id) {
    cookieStore.delete(ACTIVE_OVERVIEW_COOKIE);
  }

  revalidatePath("/account");
  revalidatePath("/", "layout");
  return { error: null };
}

export async function switchActiveOverview(ownerId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { overviews } = await resolveActiveOverview(supabase, user);
  const allowed = overviews.some((o) => o.ownerId === ownerId);
  if (!allowed) return { error: "Kein Zugriff auf diese Übersicht." };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_OVERVIEW_COOKIE, ownerId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/", "layout");
  return { error: null };
}
