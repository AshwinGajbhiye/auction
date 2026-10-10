import argon2 from 'argon2';
import crypto from 'crypto';
import { prisma } from '../../shared/prisma';
import { sendEmail, buildVerifyEmailHtml, buildPasswordResetHtml } from '../../shared/email';
import { config } from '../../config';
import {
  ConflictError,
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
} from '../../shared/errors';
import { UserRole } from '@campusloop/shared';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.schemas';

// ── helpers ──────────────────────────────────────────────────────────────────

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ── service ──────────────────────────────────────────────────────────────────

export async function registerUser(input: RegisterInput) {
  // Check college exists and is active
  const college = await prisma.college.findUnique({ where: { id: input.collegeId } });
  if (!college || college.status !== 'ACTIVE') {
    throw new BadRequestError('Selected college is not available.');
  }

  // Check uniqueness
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError('An account with this email already exists.');

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
    memoryCost: config.security.argon2MemoryCost,
    timeCost: config.security.argon2TimeCost,
  });

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      collegeId: input.collegeId,
      role: UserRole.STUDENT,
    },
  });

  // Create email verification token
  const token = generateToken();
  const expiresAt = new Date(
    Date.now() + config.security.emailVerifyExpiryHours * 60 * 60 * 1000,
  );
  await prisma.emailVerification.create({
    data: { userId: user.id, token, expiresAt },
  });

  await sendEmail({
    to: user.email,
    subject: 'Verify your CampusLoop account',
    html: buildVerifyEmailHtml(user.name, token),
  });

  return user;
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { college: true },
  });

  if (!user) throw new UnauthorizedError('Invalid email or password.');

  const valid = await argon2.verify(user.passwordHash, input.password);
  if (!valid) throw new UnauthorizedError('Invalid email or password.');

  if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
    throw new UnauthorizedError('Your account has been suspended. Please contact support.');
  }

  return user;
}

export async function verifyEmail(token: string) {
  const verification = await prisma.emailVerification.findUnique({ where: { token } });

  if (!verification || verification.usedAt) {
    throw new BadRequestError('Invalid or already used verification link.');
  }
  if (verification.expiresAt < new Date()) {
    throw new BadRequestError('Verification link has expired. Please request a new one.');
  }

  await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Always return success to prevent email enumeration
  if (!user) return;

  // Invalidate old tokens
  await prisma.passwordReset.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = generateToken();
  const expiresAt = new Date(
    Date.now() + config.security.passwordResetExpiryMinutes * 60 * 1000,
  );
  await prisma.passwordReset.create({
    data: { userId: user.id, token, expiresAt },
  });

  await sendEmail({
    to: user.email,
    subject: 'Reset your CampusLoop password',
    html: buildPasswordResetHtml(user.name, token),
  });
}

export async function resetPassword(input: ResetPasswordInput) {
  const reset = await prisma.passwordReset.findUnique({ where: { token: input.token } });

  if (!reset || reset.usedAt) throw new BadRequestError('Invalid or already used reset link.');
  if (reset.expiresAt < new Date()) throw new BadRequestError('Reset link has expired.');

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
    memoryCost: config.security.argon2MemoryCost,
    timeCost: config.security.argon2TimeCost,
  });

  await prisma.$transaction([
    prisma.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash },
    }),
  ]);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      college: { select: { id: true, name: true } },
      _count: {
        select: {
          listings: { where: { status: { in: ['ACTIVE', 'PAUSED', 'RESERVED'] } } },
          purchasesAsBuyer: { where: { status: 'COMPLETED' } },
          reviewsReceived: true,
          notifications: { where: { readAt: null } },
        },
      },
    },
  });

  if (!user) throw new NotFoundError('User');

  // Unread messages count
  const unreadMessages = await prisma.message.count({
    where: {
      readAt: null,
      conversation: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      senderId: { not: userId },
    },
  });

  const avgRating = await prisma.review.aggregate({
    where: { revieweeId: userId },
    _avg: { rating: true },
    _count: true,
  });

  return { user, unreadMessages, avgRating };
}
