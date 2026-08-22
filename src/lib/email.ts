import nodemailer from "nodemailer";

export function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

const SIGNATURE_TEXT = `\n\nKI-Abo-Tracker\nEin kostenloser Service von\nKurz Intelligence`;

// Gebrandeter Rahmen für alle ausgehenden Mails: orangefarbene Kopfleiste,
// weißer Inhaltsbereich, Signatur im Fußbereich. Nur Inline-CSS, damit es in
// gängigen E-Mail-Programmen zuverlässig dargestellt wird.
function renderEmailLayout(contentHtml: string): string {
  return `
  <div style="margin:0;padding:24px 12px;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background-color:#ea580c;padding:16px 24px;">
        <span style="color:#ffffff;font-size:20px;font-weight:bold;">KI-Abo-Tracker</span>
      </div>
      <div style="padding:24px;color:#111827;font-size:14px;line-height:1.6;">
        ${contentHtml}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.5;">
        KI-Abo-Tracker<br>Ein kostenloser Service von<br>Kurz Intelligence
      </div>
    </div>
  </div>`;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) {
    throw new Error("SMTP_FROM oder SMTP_USER muss als Umgebungsvariable gesetzt sein.");
  }
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    ...opts,
    from: { name: "KI-Abo-Tracker", address: from },
    html: renderEmailLayout(opts.html),
    text: opts.text ? opts.text + SIGNATURE_TEXT : undefined,
  });
  return {
    accepted: info.accepted.map(String),
    rejected: info.rejected.map(String),
    response: info.response,
  };
}
