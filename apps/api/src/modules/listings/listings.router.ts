import { Router, Request, Response } from 'express';
import { requireAuth, requireVerified } from '../../middleware/auth';
import { uploadMiddleware } from '../../middleware/upload';
import * as listingsService from './listings.service';

export const listingsRouter = Router();

// GET /api/v1/listings
listingsRouter.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize || '20'))));

  const data = await listingsService.getListings({
    collegeId: req.query.collegeId as string,
    categoryId: req.query.categoryId as string,
    listingType: req.query.listingType as string,
    condition: req.query.condition as string,
    minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
    maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
    query: req.query.q as string,
    sortBy: req.query.sortBy as string,
    page,
    pageSize,
    userId: req.session?.userId,
  });

  res.json({ success: true, data });
});

// GET /api/v1/listings/:id
listingsRouter.get('/:id', async (req: Request, res: Response) => {
  const data = await listingsService.getListing(req.params.id, req.session?.userId);
  res.json({ success: true, data });
});

// POST /api/v1/listings
listingsRouter.post(
  '/',
  requireAuth,
  requireVerified,
  uploadMiddleware.array('images'),
  async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    const data = await listingsService.createListing(
      req.session.userId!,
      req.session.collegeId!,
      req.body,
      files,
    );
    res.status(201).json({ success: true, data });
  },
);

// PATCH /api/v1/listings/:id
listingsRouter.patch(
  '/:id',
  requireAuth,
  uploadMiddleware.array('images'),
  async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    const data = await listingsService.updateListing(
      req.params.id,
      req.session.userId!,
      req.session.userRole!,
      req.body,
      files,
    );
    res.json({ success: true, data });
  },
);

// DELETE /api/v1/listings/:id
listingsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  await listingsService.deleteListing(req.params.id, req.session.userId!, req.session.userRole!);
  res.json({ success: true, data: { message: 'Listing deleted.' } });
});

// GET /api/v1/users/me/listings  (mounted at /users/me/listings separately)
export async function myListingsHandler(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize || '20'))));
  const data = await listingsService.getMyListings(req.session.userId!, page, pageSize);
  res.json({ success: true, data });
}
