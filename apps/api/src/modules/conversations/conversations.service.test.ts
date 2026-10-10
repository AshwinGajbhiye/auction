import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../shared/prisma';
import * as conversationsService from './conversations.service';
import { BadRequestError, ForbiddenError } from '../../shared/errors';

describe('Conversations Service', () => {
  let sellerId: string;
  let buyerId: string;
  let listingId: string;
  let conversationId: string;

  beforeAll(async () => {
    const seller = await prisma.user.findFirst({ where: { email: 'bob@student.demo.edu' } });
    const buyer = await prisma.user.findFirst({ where: { email: 'carol@student.demo.edu' } });
    const college = await prisma.college.findFirst({ where: { slug: 'demo-university' } });
    const category = await prisma.category.findFirst();

    if (!seller || !buyer || !college || !category) {
      throw new Error('Required seed data missing for conversations tests');
    }

    sellerId = seller.id;
    buyerId = buyer.id;

    // Create an isolated test listing
    const listing = await prisma.listing.create({
      data: {
        sellerId,
        collegeId: college.id,
        categoryId: category.id,
        title: 'Test Messaging Item',
        description: 'For chat test suite',
        condition: 'LIKE_NEW',
        listingType: 'FIXED_PRICE',
        fixedPrice: 600,
        pickupLocation: 'Campus Quad',
        status: 'ACTIVE',
      },
    });
    listingId = listing.id;
  });

  afterAll(async () => {
    // Cleanup
    if (conversationId) {
      await prisma.message.deleteMany({ where: { conversationId } });
      await prisma.conversation.deleteMany({ where: { id: conversationId } });
    }
    await prisma.listing.deleteMany({ where: { id: listingId } });
  });

  it('rejects creating conversation when user tries to message their own listing', async () => {
    await expect(
      conversationsService.getOrCreateConversation({
        listingId,
        buyerId: sellerId,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('creates a new conversation between buyer and seller', async () => {
    const conv = await conversationsService.getOrCreateConversation({
      listingId,
      buyerId,
    });

    expect(conv).toBeDefined();
    expect(conv.buyerId).toBe(buyerId);
    expect(conv.sellerId).toBe(sellerId);
    expect(conv.listingId).toBe(listingId);
    conversationId = conv.id;
  });

  it('returns existing conversation if called again for the same listing and buyer', async () => {
    const conv = await conversationsService.getOrCreateConversation({
      listingId,
      buyerId,
    });

    expect(conv.id).toBe(conversationId);
  });

  it('rejects empty message', async () => {
    await expect(
      conversationsService.sendMessage({
        conversationId,
        senderId: buyerId,
        content: '   ',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('successfully sends message and stores in database', async () => {
    const message = await conversationsService.sendMessage({
      conversationId,
      senderId: buyerId,
      content: 'Hi Bob, is this item still available for pickup today?',
    });

    expect(message).toBeDefined();
    expect(message.content).toBe('Hi Bob, is this item still available for pickup today?');
    expect(message.sender.name).toBe('Carol Buyer');
  });

  it('retrieves conversation messages and marks unread as read', async () => {
    const res = await conversationsService.getMessages(conversationId, sellerId, 1, 20);

    expect(res.items.length).toBeGreaterThanOrEqual(1);
    expect(res.total).toBeGreaterThanOrEqual(1);

    // Verify messages sent by Carol have now been marked read when retrieved by Bob
    const stored = await prisma.message.findFirst({
      where: { conversationId, senderId: buyerId },
    });
    expect(stored?.readAt).not.toBeNull();
  });
});
