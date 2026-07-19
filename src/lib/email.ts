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

const SIGNATURE_HTML = `<p>Abo-Tracker<br>Ein kostenloser Service von<br>Kurz Intelligence</p>`;
const SIGNATURE_TEXT = `\n\nAbo-Tracker\nEin kostenloser Service von\nKurz Intelligence`;

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
    from,
    ...opts,
    html: opts.html + SIGNATURE_HTML,
    text: opts.text ? opts.text + SIGNATURE_TEXT : undefined,
  });
  return {
    accepted: info.accepted.map(String),
    rejected: info.rejected.map(String),
    response: info.response,
  };
}
