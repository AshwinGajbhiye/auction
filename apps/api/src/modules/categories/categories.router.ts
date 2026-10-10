import { Router, Request, Response } from 'express';
import { prisma } from '../../shared/prisma';

export const categoriesRouter = Router();

// GET /api/v1/categories
categoriesRouter.get('/', async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    where: { active: true, parentId: null },
    include: {
      children: { where: { active: true }, orderBy: { name: 'asc' } },
    },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: categories });
});
