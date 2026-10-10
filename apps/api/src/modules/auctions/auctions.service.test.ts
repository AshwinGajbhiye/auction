import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../shared/prisma';
import * as auctionsService from './auctions.service';
import { BadRequestError } from '../../shared/errors';

describe('Auctions Service', () => {
  let auctionId: string;
  let sellerId: string;
  let bidderId: string;

  beforeAll(async () => {
    // Find seeded auction
    const auction = await prisma.auction.findFirst({
      where: { status: 'LIVE' },
      include: { listing: true },
    });
    if (!auction) throw new Error('No live auction in database');
    auctionId = auction.id;
    sellerId = auction.listing.sellerId;

    // Find buyer
    const buyer = await prisma.user.findFirst({
      where: { email: 'carol@student.demo.edu' },
    });
    if (!buyer) throw new Error('Carol test buyer not found');
    bidderId = buyer.id;
  });

  it('rejects bid placed by the seller on their own auction', async () => {
    await expect(
      auctionsService.placeBid({
        auctionId,
        bidderId: sellerId,
        amount: 2500,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('rejects bid lower than minimum required increment', async () => {
    await expect(
      auctionsService.placeBid({
        auctionId,
        bidderId,
        amount: 100, // starting bid is 2000
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('successfully places a valid bid and updates highest bid', async () => {
    const currentAuction = await prisma.auction.findUnique({ where: { id: auctionId } });
    const currentAmount = Number(currentAuction?.currentHighestBid || currentAuction?.startingBid || 2000);
    const validAmount = currentAmount + 200;

    const bid = await auctionsService.placeBid({
      auctionId,
      bidderId,
      amount: validAmount,
    });

    expect(bid).toBeDefined();
    expect(Number(bid.amount)).toBe(validAmount);

    const updated = await prisma.auction.findUnique({ where: { id: auctionId } });
    expect(Number(updated?.currentHighestBid)).toBe(validAmount);
    expect(updated?.highestBidderId).toBe(bidderId);
  });
});
