import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';
import { prisma } from '../../shared/prisma';
import { NotFoundError, ForbiddenError } from '../../shared/errors';

export const favouritesRouter = Router();

// POST /api/v1/listings/:id/favourite
export const addFavouriteHandler = async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const listingId = req.params.id;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status === 'DELETED') throw new NotFoundError('Listing');

  await prisma.favourite.upsert({
    where: { userId_listingId: { userId, listingId } },
    create: { userId, listingId },
    update: {},
  });

  res.status(201).json({ success: true, data: { favourited: true } });
};

// DELETE /api/v1/listings/:id/favourite
export const removeFavouriteHandler = async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const listingId = req.params.id;

  await prisma.favourite.deleteMany({ where: { userId, listingId } });
  res.json({ success: true, data: { favourited: false } });
};

// GET /api/v1/users/me/favourites
export async function myFavouritesHandler(req: Request, res: Response) {
  const userId = req.session.userId!;
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize || '20'))));
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.favourite.findMany({
      where: { userId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            fixedPrice: true,
            condition: true,
            listingType: true,
            status: true,
            images: { take: 1, orderBy: { displayOrder: 'asc' } },
            auction: { select: { currentHighestBid: true, endsAt: true, status: true } },
            college: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.favourite.count({ where: { userId } }),
  ]);

  const formatted = items.map((f) => ({
    ...f.listing,
    fixedPrice: f.listing.fixedPrice?.toString() ?? null,
    favouritedAt: f.createdAt.toISOString(),
  }));

  res.json({ success: true, data: { items: formatted, total, page, pageSize, totalPages: Math.ceil(total / pageSize) } });
}
