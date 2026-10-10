import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { prisma } from '../../shared/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../shared/errors';
import { createAndSendNotification } from '../../shared/notifications';

export const reportsRouter = Router();

// POST /api/v1/reports
reportsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  const { category, description, reportedUserId, listingId } = req.body;

  if (!category) throw new BadRequestError('Report category is required.');
  if (!description?.trim()) throw new BadRequestError('Description is required.');
  if (!reportedUserId && !listingId) throw new BadRequestError('Provide a user or listing to report.');

  const report = await prisma.report.create({
    data: {
      reporterId: req.session.userId!,
      category,
      description: description.trim(),
      reportedUserId: reportedUserId ?? null,
      listingId: listingId ?? null,
    },
  });

  res.status(201).json({ success: true, data: { id: report.id, message: 'Report submitted. Our team will review it.' } });
});

// GET /api/v1/reports  (moderator+)
reportsRouter.get('/', requireRole('MODERATOR', 'ADMIN'), async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize || '20'))));
  const skip = (page - 1) * pageSize;
  const status = req.query.status as string | undefined;

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where: status ? { status: status as any } : {},
      include: {
        reporter: { select: { id: true, name: true } },
        reportedUser: { select: { id: true, name: true } },
        listing: { select: { id: true, title: true } },
        assignedModerator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.report.count({ where: status ? { status: status as any } : {} }),
  ]);

  res.json({ success: true, data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) } });
});

// PATCH /api/v1/reports/:id  (moderator+)
reportsRouter.patch('/:id', requireRole('MODERATOR', 'ADMIN'), async (req: Request, res: Response) => {
  const { status, resolutionNotes, assignedModeratorId } = req.body;

  const report = await prisma.report.findUnique({ where: { id: req.params.id } });
  if (!report) throw new NotFoundError('Report');

  const updated = await prisma.report.update({
    where: { id: req.params.id },
    data: {
      ...(status && { status }),
      ...(resolutionNotes && { resolutionNotes }),
      ...(assignedModeratorId && { assignedModeratorId }),
      ...(status === 'RESOLVED' || status === 'DISMISSED' ? { resolvedAt: new Date() } : {}),
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: req.session.userId!,
      action: `REPORT_${status}`,
      entityType: 'report',
      entityId: report.id,
      metadata: { resolutionNotes },
    },
  });

  res.json({ success: true, data: updated });
});
