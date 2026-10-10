import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';
import { prisma } from '../../shared/prisma';
import { BadRequestError, ForbiddenError, ConflictError, NotFoundError } from '../../shared/errors';
import { createAndSendNotification } from '../../shared/notifications';

export const reviewsRouter = Router();

// POST /api/v1/purchases/:id/reviews
export const createReviewHandler = async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const purchaseId = req.params.id;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) throw new BadRequestError('Rating must be between 1 and 5.');

  const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) throw new NotFoundError('Purchase');
  if (purchase.status !== 'COMPLETED') throw new BadRequestError('Can only review completed transactions.');
  if (purchase.buyerId !== userId && purchase.sellerId !== userId) throw new ForbiddenError();

  const revieweeId = purchase.buyerId === userId ? purchase.sellerId : purchase.buyerId;
  if (revieweeId === userId) throw new ForbiddenError('Cannot review yourself.');

  // Prevent duplicate reviews
  const existing = await prisma.review.findUnique({
    where: { purchaseId_reviewerId: { purchaseId, reviewerId: userId } },
  });
  if (existing) throw new ConflictError('You have already reviewed this transaction.');

  const review = await prisma.review.create({
    data: { purchaseId, reviewerId: userId, revieweeId, rating: parseInt(rating), comment: comment ?? null },
    include: {
      reviewer: { select: { id: true, name: true, profileImageUrl: true } },
      reviewee: { select: { id: true, name: true, profileImageUrl: true } },
    },
  });

  await createAndSendNotification({
    recipientId: revieweeId,
    type: 'NEW_REVIEW',
    message: `${review.reviewer.name} left you a ${rating}-star review.`,
    entityType: 'review',
    entityId: review.id,
  });

  res.status(201).json({ success: true, data: { ...review, createdAt: review.createdAt.toISOString() } });
};

// GET /api/v1/users/:id/reviews
export const getUserReviewsHandler = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize || '10'))));
  const skip = (page - 1) * pageSize;

  const [items, total, avg] = await Promise.all([
    prisma.review.findMany({
      where: { revieweeId: req.params.id },
      include: { reviewer: { select: { id: true, name: true, profileImageUrl: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.review.count({ where: { revieweeId: req.params.id } }),
    prisma.review.aggregate({ where: { revieweeId: req.params.id }, _avg: { rating: true } }),
  ]);

  res.json({
    success: true,
    data: { items: items.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), total, averageRating: avg._avg.rating, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
};
