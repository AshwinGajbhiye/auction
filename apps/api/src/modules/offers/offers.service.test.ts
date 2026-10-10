import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../shared/prisma';
import * as offersService from './offers.service';
import { BadRequestError, ForbiddenError } from '../../shared/errors';

describe('Offers Service', () => {
  let sellerId: string;
  let buyerId: string;
  let testListingId: string;
  let nonNegotiableListingId: string;

  beforeAll(async () => {
    const seller = await prisma.user.findFirst({ where: { email: 'bob@student.demo.edu' } });
    const buyer = await prisma.user.findFirst({ where: { email: 'carol@student.demo.edu' } });
    const college = await prisma.college.findFirst({ where: { slug: 'demo-university' } });
    const category = await prisma.category.findFirst();

    if (!seller || !buyer || !college || !category) {
      throw new Error('Required seed data missing for offers tests');
    }

    sellerId = seller.id;
    buyerId = buyer.id;

    // Create isolated test listings for these tests
    const l1 = await prisma.listing.create({
      data: {
        sellerId,
        collegeId: college.id,
        categoryId: category.id,
        title: 'Test Negotiable Item',
        description: 'For offers testing',
        condition: 'LIKE_NEW',
        listingType: 'FIXED_PRICE',
        fixedPrice: 1000,
        negotiationEnabled: true,
        pickupLocation: 'Test Spot',
        status: 'ACTIVE',
      },
    });
    testListingId = l1.id;

    const l2 = await prisma.listing.create({
      data: {
        sellerId,
        collegeId: college.id,
        categoryId: category.id,
        title: 'Test Non-Negotiable Item',
        description: 'Fixed price only',
        condition: 'LIKE_NEW',
        listingType: 'FIXED_PRICE',
        fixedPrice: 500,
        negotiationEnabled: false,
        pickupLocation: 'Test Spot',
        status: 'ACTIVE',
      },
    });
    nonNegotiableListingId = l2.id;
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.purchase.deleteMany({ where: { listingId: { in: [testListingId, nonNegotiableListingId] } } });
    await prisma.offer.deleteMany({ where: { listingId: { in: [testListingId, nonNegotiableListingId] } } });
    await prisma.listing.deleteMany({ where: { id: { in: [testListingId, nonNegotiableListingId] } } });
  });

  it('rejects offer on listings where negotiation is disabled', async () => {
    await expect(
      offersService.createOffer({
        listingId: nonNegotiableListingId,
        buyerId,
        amount: 400,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('rejects offer made by seller on their own listing', async () => {
    await expect(
      offersService.createOffer({
        listingId: testListingId,
        buyerId: sellerId,
        amount: 800,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('creates a valid offer from buyer', async () => {
    const offer = await offersService.createOffer({
      listingId: testListingId,
      buyerId,
      amount: 850,
    });

    expect(offer).toBeDefined();
    expect(Number(offer.amount)).toBe(850);
    expect(offer.status).toBe('PENDING');
  });

  it('allows seller to counter-offer and buyer to accept', async () => {
    // 1. Buyer makes an initial offer
    const initialOffer = await offersService.createOffer({
      listingId: testListingId,
      buyerId,
      amount: 800,
    });

    // 2. Seller counters with 900
    const counter = await offersService.respondToOffer({
      offerId: initialOffer.id,
      userId: sellerId,
      action: 'counter',
      counterAmount: 900,
    });

    expect(counter).toBeDefined();
    expect(Number(counter.amount)).toBe(900);

    // Initial offer should be marked COUNTERED
    const prev = await prisma.offer.findUnique({ where: { id: initialOffer.id } });
    expect(prev?.status).toBe('COUNTERED');

    // 3. Buyer accepts seller counter-offer
    const accepted = await offersService.respondToOffer({
      offerId: counter.id,
      userId: sellerId, // Seller accepts the agreed transaction
      action: 'accept',
    });

    expect(accepted).toBeDefined();

    // Listing should transition to RESERVED
    const listing = await prisma.listing.findUnique({ where: { id: testListingId } });
    expect(listing?.status).toBe('RESERVED');
  });
});
