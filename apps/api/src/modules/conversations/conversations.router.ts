import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as convsService from './conversations.service';

export const conversationsRouter = Router();

// GET /api/v1/conversations
conversationsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const data = await convsService.getConversations(req.session.userId!);
  res.json({ success: true, data });
});

// POST /api/v1/conversations
conversationsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  const conv = await convsService.getOrCreateConversation({
    listingId: req.body.listingId,
    buyerId: req.session.userId!,
  });
  res.status(201).json({ success: true, data: conv });
});

// GET /api/v1/conversations/:id/messages
conversationsRouter.get('/:id/messages', requireAuth, async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || '50'))));
  const data = await convsService.getMessages(req.params.id, req.session.userId!, page, pageSize);
  res.json({ success: true, data });
});

// POST /api/v1/conversations/:id/messages
conversationsRouter.post('/:id/messages', requireAuth, async (req: Request, res: Response) => {
  const data = await convsService.sendMessage({
    conversationId: req.params.id,
    senderId: req.session.userId!,
    content: req.body.content,
  });
  res.status(201).json({ success: true, data });
});
