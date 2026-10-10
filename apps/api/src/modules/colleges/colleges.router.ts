import { Router, Request, Response } from 'express';
import { prisma } from '../../shared/prisma';
import { requireRole } from '../../middleware/auth';

export const collegesRouter = Router();

// GET /api/v1/colleges
collegesRouter.get('/', async (_req: Request, res: Response) => {
  const colleges = await prisma.college.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, slug: true, approvedEmailDomains: true, status: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: colleges });
});

// GET /api/v1/colleges/:id
collegesRouter.get('/:id', async (req: Request, res: Response) => {
  const college = await prisma.college.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, slug: true, approvedEmailDomains: true, status: true, createdAt: true },
  });
  if (!college) return void res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'College not found' } });
  res.json({ success: true, data: college });
});

// POST /api/v1/colleges  (admin only)
collegesRouter.post('/', requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { name, slug, approvedEmailDomains } = req.body;
  const college = await prisma.college.create({
    data: { name, slug, approvedEmailDomains: approvedEmailDomains ?? [], status: 'PENDING' },
  });
  res.status(201).json({ success: true, data: college });
});

// PATCH /api/v1/colleges/:id  (admin only)
collegesRouter.patch('/:id', requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { name, status, approvedEmailDomains } = req.body;
  const college = await prisma.college.update({
    where: { id: req.params.id },
    data: { ...(name && { name }), ...(status && { status }), ...(approvedEmailDomains && { approvedEmailDomains }) },
  });
  res.json({ success: true, data: college });
});
