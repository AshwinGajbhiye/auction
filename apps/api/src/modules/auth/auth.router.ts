import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../../config';
import { requireAuth } from '../../middleware/auth';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
} from './auth.schemas';
import * as authService from './auth.service';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/v1/auth/register
authRouter.post('/register', authLimiter, async (req: Request, res: Response) => {
  const input = RegisterSchema.parse(req.body);
  const user = await authService.registerUser(input);
  res.status(201).json({
    success: true,
    data: {
      message: 'Account created. Please check your email to verify your account.',
      userId: user.id,
    },
  });
});

// POST /api/v1/auth/login
authRouter.post('/login', authLimiter, async (req: Request, res: Response) => {
  const input = LoginSchema.parse(req.body);
  const user = await authService.loginUser(input);

  req.session.userId = user.id;
  req.session.userRole = user.role as any;
  req.session.collegeId = user.collegeId;
  req.session.emailVerified = !!user.emailVerifiedAt;

  res.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: !!user.emailVerifiedAt,
      college: user.college,
    },
  });
});

// POST /api/v1/auth/logout
authRouter.post('/logout', requireAuth, (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie(config.session.cookieName);
    res.json({ success: true, data: { message: 'Logged out.' } });
  });
});

// GET /api/v1/auth/verify-email?token=xxx  (link in email)
authRouter.get('/verify-email', async (req: Request, res: Response) => {
  const { token } = VerifyEmailSchema.parse(req.query);
  await authService.verifyEmail(token);

  // Update session if the current user just verified
  if (req.session?.userId) {
    req.session.emailVerified = true;
  }

  // Redirect to frontend
  res.redirect(`${config.cors.origin}/login?verified=1`);
});

// POST /api/v1/auth/verify-email  (for programmatic calls)
authRouter.post('/verify-email', async (req: Request, res: Response) => {
  const { token } = VerifyEmailSchema.parse(req.body);
  await authService.verifyEmail(token);
  if (req.session?.userId) req.session.emailVerified = true;
  res.json({ success: true, data: { message: 'Email verified.' } });
});

// POST /api/v1/auth/forgot-password
authRouter.post('/forgot-password', authLimiter, async (req: Request, res: Response) => {
  const input = ForgotPasswordSchema.parse(req.body);
  await authService.forgotPassword(input);
  res.json({
    success: true,
    data: { message: 'If an account exists with that email, a reset link has been sent.' },
  });
});

// POST /api/v1/auth/reset-password
authRouter.post('/reset-password', authLimiter, async (req: Request, res: Response) => {
  const input = ResetPasswordSchema.parse(req.body);
  await authService.resetPassword(input);
  res.json({ success: true, data: { message: 'Password reset successfully.' } });
});

// GET /api/v1/auth/me
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  const { user, unreadMessages, avgRating } = await authService.getMe(req.session.userId!);

  res.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: !!user.emailVerifiedAt,
      profileImageUrl: user.profileImageUrl,
      course: user.course,
      graduationYear: user.graduationYear,
      college: user.college,
      memberSince: user.createdAt.toISOString(),
      activeListingsCount: user._count.listings,
      completedTransactionsCount: user._count.purchasesAsBuyer,
      averageRating: avgRating._avg.rating,
      reviewCount: avgRating._count,
      unreadNotificationsCount: user._count.notifications,
      unreadMessagesCount: unreadMessages,
    },
  });
});
