"use server";

import { revalidatePath } from "next/cache";
import { ImapFlow } from "imapflow";
import { createClient } from "@/lib/supabase/server";
import { encryptSecret, decryptSecret } from "@/lib/checkinCrypto";
import { isEmail } from "@/lib/validation";

export type CheckinSettingsInput = {
  checkinEmail: string;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPassword: string; // leer lassen = vorhandenes Passwort behalten
  enabled: boolean;
};

export async function saveCheckinSettings(
  input: CheckinSettingsInput,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const checkinEmail = input.checkinEmail.trim().toLowerCase();
  const imapHost = input.imapHost.trim();
  const imapUser = input.imapUser.trim();
  const imapPort = Math.round(input.imapPort);

  if (!isEmail(checkinEmail)) return { error: "Bitte eine gültige Check-in-E-Mail-Adresse angeben." };
  if (!imapHost) return { error: "IMAP-Host ist ein Pflichtfeld." };
  if (!imapUser) return { error: "IMAP-Benutzername ist ein Pflichtfeld." };
  if (!Number.isFinite(imapPort) || imapPort < 1 || imapPort > 65535) {
    return { error: "IMAP-Port ist ungültig." };
  }

  const { data: existing } = await supabase
    .from("checkin_settings")
    .select("imap_password_enc")
    .eq("user_id", user.id)
    .maybeSingle();

  let passwordEnc: string;
  if (input.imapPassword) {
    passwordEnc = encryptSecret(input.imapPassword);
  } else if (existing) {
    passwordEnc = existing.imap_password_enc;
  } else {
    return { error: "IMAP-Passwort ist ein Pflichtfeld." };
  }

  const { error } = await supabase.from("checkin_settings").upsert({
    user_id: user.id,
    checkin_email: checkinEmail,
    imap_host: imapHost,
    imap_port: imapPort,
    imap_user: imapUser,
    imap_password_enc: passwordEnc,
    enabled: input.enabled,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  revalidatePath("/account");
  return { error: null };
}

export async function testCheckinConnection(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { data: settings } = await supabase
    .from("checkin_settings")
    .select("imap_host, imap_port, imap_user, imap_password_enc")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!settings) return { error: "Bitte zuerst die Zugangsdaten speichern." };

  const client = new ImapFlow({
    host: settings.imap_host,
    port: settings.imap_port,
    secure: settings.imap_port === 993,
    auth: { user: settings.imap_user, pass: decryptSecret(settings.imap_password_enc) },
    logger: false,
  });

  try {
    await client.connect();
    await client.logout();
    return { error: null };
  } catch (err) {
    return {
      error: `Verbindung fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function deleteCheckinSettings(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const { error } = await supabase.from("checkin_settings").delete().eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/account");
  return { error: null };
}
