import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Verschlüsselt IMAP-Passwörter mit AES-256-GCM. Der Schlüssel kommt aus der
// Umgebungsvariable CHECKIN_ENC_KEY (64 Hex-Zeichen = 32 Byte) und verlässt
// nie den Server; in der Datenbank liegt nur iv:authTag:ciphertext (base64).

function getKey(): Buffer {
  const hex = process.env.CHECKIN_ENC_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("CHECKIN_ENC_KEY muss als Umgebungsvariable gesetzt sein (64 Hex-Zeichen).");
  }
  return Buffer.from(hex, "hex");
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function decryptSecret(stored: string): string {
  const [ivB64, tagB64, dataB64] = stored.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Gespeichertes Passwort hat ein ungültiges Format.");
  }
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString(
    "utf8",
  );
}
