import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../shared/prisma';
import * as purchasesService from './purchases.service';
import { BadRequestError, ForbiddenError } from '../../shared/errors';

describe('Purchases Service', () => {
  let sellerId: string;
  let buyerId: string;
  let fixedListingId: string;
  let auctionListingId: string;

  beforeAll(async () => {
    const seller = await prisma.user.findFirst({ where: { email: 'bob@student.demo.edu' } });
    const buyer = await prisma.user.findFirst({ where: { email: 'carol@student.demo.edu' } });
    const college = await prisma.college.findFirst({ where: { slug: 'demo-university' } });
    const category = await prisma.category.findFirst();

    if (!seller || !buyer || !college || !category) {
      throw new Error('Required seed data missing for purchases tests');
    }

    sellerId = seller.id;
    buyerId = buyer.id;

    // Create isolated test listings
    const l1 = await prisma.listing.create({
      data: {
        sellerId,
        collegeId: college.id,
        categoryId: category.id,
        title: 'Test Purchase Request Item',
        description: 'For purchases testing',
        condition: 'GOOD',
        listingType: 'FIXED_PRICE',
        fixedPrice: 1200,
        negotiationEnabled: false,
        pickupLocation: 'Hostel Gate',
        status: 'ACTIVE',
      },
    });
    fixedListingId = l1.id;

    const l2 = await prisma.listing.create({
      data: {
        sellerId,
        collegeId: college.id,
        categoryId: category.id,
        title: 'Test Auction Only Item',
        description: 'Auctions only',
        condition: 'GOOD',
        listingType: 'AUCTION',
        pickupLocation: 'Hostel Gate',
        status: 'ACTIVE',
      },
    });
    auctionListingId = l2.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.purchase.deleteMany({ where: { listingId: { in: [fixedListingId, auctionListingId] } } });
    await prisma.listing.deleteMany({ where: { id: { in: [fixedListingId, auctionListingId] } } });
  });

  it('rejects purchase request on an auction listing', async () => {
    await expect(
      purchasesService.createPurchaseRequest({
        listingId: auctionListingId,
        buyerId,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('rejects purchase request made by the seller on their own item', async () => {
    await expect(
      purchasesService.createPurchaseRequest({
        listingId: fixedListingId,
        buyerId: sellerId,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('successfully creates a purchase request', async () => {
    const purchase = await purchasesService.createPurchaseRequest({
      listingId: fixedListingId,
      buyerId,
    });

    expect(purchase).toBeDefined();
    expect(purchase.status).toBe('PENDING');
    expect(Number(purchase.agreedPrice)).toBe(1200);
  });

  it('handles full lifecycle: accept request, both parties confirm exchange, listing marked SOLD', async () => {
    // Find the pending purchase created in previous test
    const pending = await prisma.purchase.findFirst({
      where: { listingId: fixedListingId, buyerId, status: 'PENDING' },
    });
    expect(pending).toBeDefined();

    // 1. Seller accepts purchase request
    const accepted = await purchasesService.respondToPurchase({
      purchaseId: pending!.id,
      userId: sellerId,
      action: 'accept',
    });
    expect(accepted).toBeDefined();

    const listingAfterAccept = await prisma.listing.findUnique({ where: { id: fixedListingId } });
    expect(listingAfterAccept?.status).toBe('RESERVED');

    // 2. Buyer confirms exchange
    const buyerConfirmed = await purchasesService.confirmExchange({
      purchaseId: pending!.id,
      userId: buyerId,
    });
    expect(buyerConfirmed.status).toBe('EXCHANGE_PENDING');

    // 3. Seller confirms exchange
    const sellerConfirmed = await purchasesService.confirmExchange({
      purchaseId: pending!.id,
      userId: sellerId,
    });
    expect(sellerConfirmed.status).toBe('COMPLETED');

    // Listing should now be marked SOLD
    const listingFinal = await prisma.listing.findUnique({ where: { id: fixedListingId } });
    expect(listingFinal?.status).toBe('SOLD');
  });
});
