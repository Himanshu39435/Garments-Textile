import nodemailer from 'nodemailer';

let transporter;
const smtpPassword = () => process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
const emailFrom = () => process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;
const isConfigured = () => Boolean(
  process.env.SMTP_HOST
  && process.env.SMTP_USER
  && smtpPassword(),
);

/**
 * Sends an email through SMTP. OTP emails must never be printed to the server
 * console because that would expose a password-reset credential.
 */
export async function sendEmail({ to, subject, text, html, allowDevelopmentFallback = true }) {
  if (!isConfigured()) {
    if (!allowDevelopmentFallback || process.env.NODE_ENV === 'production') {
      throw new Error('Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS (or SMTP_PASSWORD) in backend/.env');
    }
    console.log(`\n[email:dev, not sent] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return { delivered: false };
  }
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === undefined
    ? port === 465
    : process.env.SMTP_SECURE.trim().toLowerCase() === 'true';
  transporter ??= nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure, auth: { user: process.env.SMTP_USER, pass: smtpPassword() } });
  await transporter.sendMail({ from: emailFrom(), to, subject, text, html });
  return { delivered: true };
}

const PURPOSE_TEXT = {
  verify: { subject: 'Verify your NARANG TEXTILE account', intro: 'Use this code to verify your email address' },
  reset: { subject: 'Reset your NARANG TEXTILE password', intro: 'Use this code to reset your password' },
};

export function sendOtpEmail({ to, name, code, purpose }) {
  const { subject, intro } = PURPOSE_TEXT[purpose];
  const text = `Hello ${name},\n\n${intro}:\n\n${code}\n\nThe code expires in 10 minutes. If you did not request it, you can ignore this email.\n\nNARANG TEXTILE`;
  const html = `<p>Hello ${name.replace(/[<>&]/g, '')},</p><p>${intro}:</p><p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p><p>The code expires in 10 minutes. If you did not request it, you can ignore this email.</p><p>NARANG TEXTILE</p>`;
  return sendEmail({ to, subject, text, html, allowDevelopmentFallback: false });
}

/** Plain status email to a customer. Callers should not await it: a mail failure must never fail an order update. */
export function sendOrderUpdateEmail({ to, name, orderNumber, headline, detail }) {
  const text = `Hello ${name},\n\n${headline}\n${detail ? `\n${detail}\n` : ''}\nOrder: ${orderNumber}\nYou can follow it any time in your account.\n\nNARANG TEXTILE`;
  return sendEmail({ to, subject: `${headline} (${orderNumber})`, text });
}

/** Quotation status email. Fire and forget, like order updates. */
export function sendQuotationEmail({ to, name, quoteNumber, headline, detail }) {
  const text = `Hello ${name},\n\n${headline}\n${detail ? `\n${detail}\n` : ''}\nQuotation: ${quoteNumber}\nYou can view it any time in your account under Quotations.\n\nNARANG TEXTILE`;
  return sendEmail({ to, subject: `${headline} (${quoteNumber})`, text });
}
