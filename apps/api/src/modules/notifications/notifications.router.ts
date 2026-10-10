import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';
import { prisma } from '../../shared/prisma';
import { ForbiddenError } from '../../shared/errors';

export const notificationsRouter = Router();

// GET /api/v1/notifications
notificationsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize || '20'))));
  const skip = (page - 1) * pageSize;

  const userId = req.session.userId!;
  const [items, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.notification.count({ where: { recipientId: userId } }),
    prisma.notification.count({ where: { recipientId: userId, readAt: null } }),
  ]);

  res.json({
    success: true,
    data: {
      items: items.map((n) => ({ ...n, createdAt: n.createdAt.toISOString(), readAt: n.readAt?.toISOString() ?? null })),
      total,
      unreadCount: unread,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

// PATCH /api/v1/notifications/:id/read
notificationsRouter.patch('/:id/read', requireAuth, async (req: Request, res: Response) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification) return void res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } });
  if (notification.recipientId !== req.session.userId!) throw new ForbiddenError();

  await prisma.notification.update({ where: { id: req.params.id }, data: { readAt: new Date() } });
  res.json({ success: true, data: { message: 'Marked as read.' } });
});

// PATCH /api/v1/notifications/read-all
notificationsRouter.patch('/read-all', requireAuth, async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { recipientId: req.session.userId!, readAt: null },
    data: { readAt: new Date() },
  });
  res.json({ success: true, data: { message: 'All notifications marked as read.' } });
});
