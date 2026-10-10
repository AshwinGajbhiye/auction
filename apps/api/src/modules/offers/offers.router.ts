import { Router, Request, Response } from 'express';
import { requireAuth, requireVerified } from '../../middleware/auth';
import * as offersService from './offers.service';

export const offersRouter = Router();

// POST /api/v1/listings/:id/offers
export const createOfferHandler = async (req: Request, res: Response) => {
  const offer = await offersService.createOffer({
    listingId: req.params.id,
    buyerId: req.session.userId!,
    amount: parseFloat(req.body.amount),
    parentOfferId: req.body.parentOfferId,
  });
  res.status(201).json({ success: true, data: offer });
};

// POST /api/v1/offers/:id/respond
offersRouter.post('/:id/respond', requireAuth, async (req: Request, res: Response) => {
  const result = await offersService.respondToOffer({
    offerId: req.params.id,
    userId: req.session.userId!,
    action: req.body.action,
    counterAmount: req.body.counterAmount ? parseFloat(req.body.counterAmount) : undefined,
  });
  res.json({ success: true, data: result });
});

// GET /api/v1/users/me/offers
export async function myOffersHandler(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize || '20'))));
  const data = await offersService.getMyOffers(req.session.userId!, page, pageSize);
  res.json({ success: true, data });
}
