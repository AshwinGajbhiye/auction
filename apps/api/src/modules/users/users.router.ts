import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { uploadMiddleware } from '../../middleware/upload';
import { prisma } from '../../shared/prisma';
import { storeImage } from '../../shared/storage';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../shared/errors';
import { prisma as db } from '../../shared/prisma';

export const usersRouter = Router();

// GET /api/v1/users/:id  (public profile)
usersRouter.get('/:id', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      profileImageUrl: true,
      course: true,
      graduationYear: true,
      emailVerifiedAt: true,
      createdAt: true,
      role: true,
      college: { select: { id: true, name: true } },
      _count: {
        select: {
          listings: { where: { status: { in: ['ACTIVE', 'PAUSED'] } } },
          purchasesAsBuyer: { where: { status: 'COMPLETED' } },
          reviewsReceived: true,
        },
      },
    },
  });

  if (!user) throw new NotFoundError('User');

  const avg = await prisma.review.aggregate({
    where: { revieweeId: req.params.id },
    _avg: { rating: true },
  });

  res.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      profileImageUrl: user.profileImageUrl,
      course: user.course,
      graduationYear: user.graduationYear,
      emailVerified: !!user.emailVerifiedAt,
      memberSince: user.createdAt.toISOString(),
      role: user.role,
      college: user.college,
      activeListingsCount: user._count.listings,
      completedTransactionsCount: user._count.purchasesAsBuyer,
      reviewCount: user._count.reviewsReceived,
      averageRating: avg._avg.rating,
    },
  });
});

// PATCH /api/v1/users/me  (update profile)
usersRouter.patch(
  '/me',
  requireAuth,
  uploadMiddleware.single('profileImage'),
  async (req: Request, res: Response) => {
    const userId = req.session.userId!;
    const { name, course, graduationYear } = req.body;
    const update: any = {};

    if (name) update.name = name;
    if (course !== undefined) update.course = course;
    if (graduationYear) update.graduationYear = parseInt(graduationYear);

    if (req.file) {
      const stored = await storeImage(req.file.buffer, req.file.mimetype, `avatars/${userId}`);
      update.profileImageUrl = stored.url;
    }

    const user = await prisma.user.update({ where: { id: userId }, data: update });
    res.json({
      success: true,
      data: { id: user.id, name: user.name, profileImageUrl: user.profileImageUrl, course: user.course, graduationYear: user.graduationYear },
    });
  },
);

// GET /api/v1/users/:id/listings
usersRouter.get('/:id/listings', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize || '12'))));
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: req.params.id, status: { in: ['ACTIVE', 'PAUSED', 'RESERVED'] } },
      select: {
        id: true, title: true, fixedPrice: true, condition: true, listingType: true, status: true,
        images: { take: 1, orderBy: { displayOrder: 'asc' } },
        auction: { select: { currentHighestBid: true, endsAt: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.listing.count({ where: { sellerId: req.params.id, status: { in: ['ACTIVE', 'PAUSED', 'RESERVED'] } } }),
  ]);

  res.json({
    success: true,
    data: { items: items.map((l) => ({ ...l, fixedPrice: l.fixedPrice?.toString() ?? null })), total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
});

// Admin: suspend/reinstate user
usersRouter.patch('/:id/status', requireRole('ADMIN', 'MODERATOR'), async (req: Request, res: Response) => {
  const { status, reason } = req.body;
  if (!['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) throw new BadRequestError('Invalid status.');

  const user = await prisma.user.update({ where: { id: req.params.id }, data: { status } });

  await prisma.auditLog.create({
    data: {
      actorId: req.session.userId!,
      action: `USER_STATUS_CHANGED`,
      entityType: 'user',
      entityId: req.params.id,
      metadata: { status, reason },
    },
  });

  res.json({ success: true, data: { id: user.id, status: user.status } });
});
