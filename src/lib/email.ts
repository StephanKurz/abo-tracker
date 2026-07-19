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

export async function sendMail(opts: { to: string; subject: string; html: string }) {
  const transporter = createTransporter();
  const info = await transporter.sendMail({ from: process.env.SMTP_FROM, ...opts });
  return {
    accepted: info.accepted.map(String),
    rejected: info.rejected.map(String),
    response: info.response,
  };
}
