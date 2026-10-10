import nodemailer from 'nodemailer';
import { config } from '../../config';
import { logger } from '../logger';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  auth: config.email.user
    ? { user: config.email.user, pass: config.email.pass }
    : undefined,
  ignoreTLS: config.env === 'development',
});

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  if (config.env === 'test') return; // suppress in tests

  try {
    const info = await transporter.sendMail({
      from: config.email.from,
      ...opts,
    });
    if (config.env === 'development') {
      logger.info(`[Email] Sent to ${opts.to}: ${opts.subject}`, { messageId: info.messageId });
    }
  } catch (err) {
    logger.error('[Email] Failed to send email', { to: opts.to, error: err });
    // Do not throw — email failures should not crash request handlers
  }
}

export function buildVerifyEmailHtml(name: string, token: string): string {
  const url = `${config.apiBaseUrl}/api/v1/auth/verify-email?token=${token}`;
  return `
    <h2>Welcome to CampusLoop, ${name}!</h2>
    <p>Please verify your email address by clicking the button below.</p>
    <a href="${url}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
      Verify Email
    </a>
    <p>This link expires in ${config.security.emailVerifyExpiryHours} hours.</p>
    <p>If you did not register, ignore this email.</p>
  `;
}

export function buildPasswordResetHtml(name: string, token: string): string {
  const url = `${config.cors.origin}/reset-password?token=${token}`;
  return `
    <h2>Reset your CampusLoop password</h2>
    <p>Hi ${name}, someone requested a password reset for your account.</p>
    <a href="${url}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
      Reset Password
    </a>
    <p>This link expires in ${config.security.passwordResetExpiryMinutes} minutes.</p>
    <p>If you did not request this, ignore this email.</p>
  `;
}
