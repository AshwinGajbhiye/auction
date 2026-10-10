import { Router, Request, Response } from 'express';
import { requireAuth, requireVerified } from '../../middleware/auth';
import * as auctionsService from './auctions.service';

export const auctionsRouter = Router();

// GET /api/v1/auctions
auctionsRouter.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize || '20'))));
  const data = await auctionsService.getAuctions({
    status: req.query.status as string,
    collegeId: req.session?.collegeId,
    page,
    pageSize,
  });
  res.json({ success: true, data });
});

// GET /api/v1/auctions/:id
auctionsRouter.get('/:id', async (req: Request, res: Response) => {
  const data = await auctionsService.getAuction(req.params.id);
  res.json({ success: true, data });
});

// POST /api/v1/auctions/:id/bids
auctionsRouter.post('/:id/bids', requireAuth, requireVerified, async (req: Request, res: Response) => {
  const amount = parseFloat(req.body.amount);
  if (!amount || amount <= 0) {
    return void res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid bid amount.' } });
  }
  const bid = await auctionsService.placeBid({
    auctionId: req.params.id,
    bidderId: req.session.userId!,
    amount,
  });
  res.status(201).json({ success: true, data: { id: bid.id, amount: bid.amount.toString() } });
});

// GET /api/v1/auctions/:id/bids
auctionsRouter.get('/:id/bids', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || '20'))));
  const data = await auctionsService.getAuctionBids(req.params.id, page, pageSize);
  res.json({ success: true, data });
});

// GET /api/v1/users/me/bids
export async function myBidsHandler(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize || '20'))));
  const data = await auctionsService.getMyBids(req.session.userId!, page, pageSize);
  res.json({ success: true, data });
}
