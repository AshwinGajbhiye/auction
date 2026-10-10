import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { prisma } from '../../shared/prisma';
import { BadRequestError, NotFoundError } from '../../shared/errors';

export const adminRouter = Router();

// Protect all admin routes
adminRouter.use(requireAuth, requireRole('ADMIN', 'MODERATOR'));

// GET /api/v1/admin/stats
adminRouter.get('/stats', async (req: Request, res: Response) => {
  const [
    totalUsers,
    totalListings,
    activeAuctions,
    pendingReports,
    completedPurchases,
    totalColleges,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.auction.count({ where: { status: 'LIVE' } }),
    prisma.report.count({ where: { status: 'OPEN' } }),
    prisma.purchase.count({ where: { status: 'COMPLETED' } }),
    prisma.college.count(),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      activeListings: totalListings,
      activeAuctions,
      pendingReports,
      completedPurchases,
      totalColleges,
    },
  });
});

// GET /api/v1/admin/users
adminRouter.get('/users', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize || '20'))));
  const skip = (page - 1) * pageSize;
  const search = (req.query.q as string)?.trim();
  const role = req.query.role as string | undefined;
  const status = req.query.status as string | undefined;
  const collegeId = req.query.collegeId as string | undefined;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = role;
  if (status) where.status = status;
  if (collegeId) where.collegeId = collegeId;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        college: { select: { id: true, name: true } },
        _count: {
          select: {
            listings: true,
            reportsFiledBy: true,
            reportsAgainst: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      items: items.map((u) => ({
        ...u,
        emailVerified: !!u.emailVerifiedAt,
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

// PATCH /api/v1/admin/users/:id/role  (ADMIN only)
adminRouter.patch('/users/:id/role', requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!['STUDENT', 'MODERATOR', 'ADMIN'].includes(role)) {
    throw new BadRequestError('Invalid role.');
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
  });

  await prisma.auditLog.create({
    data: {
      actorId: req.session.userId!,
      action: 'USER_ROLE_CHANGED',
      entityType: 'user',
      entityId: user.id,
      metadata: { newRole: role },
    },
  });

  res.json({ success: true, data: { id: user.id, role: user.role } });
});

// GET /api/v1/admin/audit-logs
adminRouter.get('/audit-logs', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || '25'))));
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count(),
  ]);

  res.json({
    success: true,
    data: {
      items: items.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

// POST /api/v1/admin/categories
adminRouter.post('/categories', requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { name, slug, description, parentId } = req.body;
  if (!name || !slug) throw new BadRequestError('Name and slug are required.');

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      parentId: parentId ?? null,
    },
  });

  res.status(201).json({ success: true, data: category });
});
