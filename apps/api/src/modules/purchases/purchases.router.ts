import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as purchasesService from './purchases.service';

export const purchasesRouter = Router();

// POST /api/v1/listings/:id/purchase-requests  (mounted in main router)
export const createPurchaseRequestHandler = async (req: Request, res: Response) => {
  const purchase = await purchasesService.createPurchaseRequest({
    listingId: req.params.id,
    buyerId: req.session.userId!,
  });
  res.status(201).json({ success: true, data: purchase });
};

// POST /api/v1/purchases/:id/respond
purchasesRouter.post('/:id/respond', requireAuth, async (req: Request, res: Response) => {
  // Normalize action to lowercase and map 'decline' → 'reject' (frontend may send uppercase)
  const rawAction = String(req.body.action || '').toLowerCase();
  const action = rawAction === 'decline' ? 'reject' : rawAction as 'accept' | 'reject';
  const data = await purchasesService.respondToPurchase({
    purchaseId: req.params.id,
    userId: req.session.userId!,
    action,
  });
  res.json({ success: true, data });
});

// POST /api/v1/purchases/:id/confirm-exchange
purchasesRouter.post('/:id/confirm-exchange', requireAuth, async (req: Request, res: Response) => {
  const data = await purchasesService.confirmExchange({
    purchaseId: req.params.id,
    userId: req.session.userId!,
  });
  res.json({ success: true, data });
});

// GET /api/v1/purchases/:id
purchasesRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const data = await purchasesService.getPurchase(req.params.id, req.session.userId!);
  res.json({ success: true, data });
});

// GET /api/v1/users/me/purchases
export async function myPurchasesHandler(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize || '20'))));
  const data = await purchasesService.getMyPurchases(req.session.userId!, page, pageSize);
  res.json({ success: true, data });
}
