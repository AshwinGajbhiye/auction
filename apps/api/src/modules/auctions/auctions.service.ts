import { prisma } from '../../shared/prisma';
import { createAndSendNotification } from '../../shared/notifications';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '../../shared/errors';
import { getSocketServer } from '../../shared/notifications';
import { config } from '../../config';
import type { SocketBidPlacedEvent } from '@campusloop/shared';

function formatAuction(a: any) {
  return {
    ...a,
    startingBid: a.startingBid?.toString(),
    minimumBidIncrement: a.minimumBidIncrement?.toString(),
    currentHighestBid: a.currentHighestBid?.toString() ?? null,
    reservePrice: undefined, // never expose reserve
    bidCount: a._count?.bids ?? 0,
    reservePriceMet: a.reservePrice && a.currentHighestBid
      ? Number(a.currentHighestBid) >= Number(a.reservePrice)
      : null,
  };
}

export async function getAuctions(opts: {
  status?: string;
  collegeId?: string;
  page: number;
  pageSize: number;
}) {
  const where: any = {};
  if (opts.status) where.status = opts.status;
  if (opts.collegeId) where.listing = { collegeId: opts.collegeId };

  const skip = (opts.page - 1) * opts.pageSize;
  const [items, total] = await Promise.all([
    prisma.auction.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            condition: true,
            images: { take: 1, orderBy: { displayOrder: 'asc' } },
            college: { select: { id: true, name: true } },
            seller: { select: { id: true, name: true, profileImageUrl: true } },
          },
        },
        _count: { select: { bids: true } },
      },
      orderBy: { endsAt: 'asc' },
      skip,
      take: opts.pageSize,
    }),
    prisma.auction.count({ where }),
  ]);

  return {
    items: items.map(formatAuction),
    total,
    page: opts.page,
    pageSize: opts.pageSize,
    totalPages: Math.ceil(total / opts.pageSize),
  };
}

export async function getAuction(auctionId: string) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          description: true,
          condition: true,
          pickupLocation: true,
          images: { orderBy: { displayOrder: 'asc' } },
          college: { select: { id: true, name: true } },
          seller: { select: { id: true, name: true, profileImageUrl: true, emailVerifiedAt: true, createdAt: true } },
        },
      },
      _count: { select: { bids: true } },
    },
  });
  if (!auction) throw new NotFoundError('Auction');
  return formatAuction(auction);
}

/**
 * Place a bid — fully atomic with optimistic locking via version field.
 * Uses SELECT FOR UPDATE to prevent concurrent bids from creating inconsistencies.
 */
export async function placeBid(opts: {
  auctionId: string;
  bidderId: string;
  amount: number;
}) {
  const { auctionId, bidderId, amount } = opts;

  const bid = await prisma.$transaction(async (tx) => {
    // Lock the auction row
    const auction = await tx.$queryRaw<any[]>`
      SELECT * FROM auctions WHERE id = ${auctionId} FOR UPDATE
    `;
    const a = auction[0];
    if (!a) throw new NotFoundError('Auction');

    const listingId = a.listingId ?? a.listing_id;
    const endsAt = new Date(a.endsAt ?? a.ends_at);
    const currentBid = a.currentHighestBid != null ? Number(a.currentHighestBid) : (a.current_highest_bid != null ? Number(a.current_highest_bid) : 0);
    const startingBid = Number(a.startingBid ?? a.starting_bid ?? 0);
    const increment = Number(a.minimumBidIncrement ?? a.minimum_bid_increment ?? 1);

    // Validate auction state
    if (a.status !== 'LIVE') throw new BadRequestError('Auction is not currently live.');
    if (endsAt <= new Date()) {
      throw new BadRequestError('Auction has ended. No more bids accepted.');
    }

    // Fetch listing to check seller != bidder
    const listing = await tx.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundError('Listing');
    if (listing.sellerId === bidderId) {
      throw new BadRequestError('You cannot bid on your own listing.');
    }

    // Validate bid amount
    const minRequired = currentBid > 0 ? currentBid + increment : startingBid;

    if (amount < minRequired) {
      throw new BadRequestError(
        `Bid must be at least ₹${minRequired.toFixed(2)}. Current highest bid: ₹${currentBid || startingBid}.`,
      );
    }

    // Record bid
    const newBid = await tx.bid.create({
      data: { auctionId, bidderId, amount },
    });

    // Update auction's current highest bid
    await tx.auction.update({
      where: { id: auctionId },
      data: {
        currentHighestBid: amount,
        highestBidderId: bidderId,
        version: { increment: 1 },
      },
    });

    // Anti-sniping: extend auction if bid in last N seconds
    if (config.auction.snipeEnabled) {
      const timeLeft = (endsAt.getTime() - Date.now()) / 1000;
      if (timeLeft <= config.auction.snipeWindowSeconds) {
        const newEnd = new Date(Date.now() + config.auction.snipeExtensionSeconds * 1000);
        await tx.auction.update({
          where: { id: auctionId },
          data: { endsAt: newEnd },
        });
      }
    }

    return newBid;
  });

  // Fetch updated auction for broadcast
  const updatedAuction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      listing: { select: { title: true } },
      _count: { select: { bids: true } },
    },
  });

  // Notify previous highest bidder they've been outbid
  if (
    updatedAuction?.highestBidderId &&
    updatedAuction.highestBidderId !== bidderId
  ) {
    await createAndSendNotification({
      recipientId: updatedAuction.highestBidderId,
      type: 'OUTBID',
      message: `You have been outbid on "${updatedAuction.listing?.title ?? 'an item'}". Current bid: ₹${amount}`,
      entityType: 'auction',
      entityId: auctionId,
    });
  }

  // Broadcast to auction room
  const io = getSocketServer();
  if (io && updatedAuction) {
    const event: SocketBidPlacedEvent = {
      auctionId,
      currentHighestBid: updatedAuction.currentHighestBid?.toString() ?? '0',
      bidCount: (updatedAuction as any)._count.bids,
      endsAt: updatedAuction.endsAt.toISOString(),
      reservePriceMet:
        updatedAuction.reservePrice && updatedAuction.currentHighestBid
          ? Number(updatedAuction.currentHighestBid) >= Number(updatedAuction.reservePrice)
          : null,
    };
    io.to(`auction:${auctionId}`).emit('bid:placed', event);
  }

  return bid;
}

export async function getAuctionBids(auctionId: string, page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    prisma.bid.findMany({
      where: { auctionId },
      include: { bidder: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.bid.count({ where: { auctionId } }),
  ]);

  return {
    items: items.map((b) => ({
      id: b.id,
      auctionId: b.auctionId,
      amount: b.amount.toString(),
      createdAt: b.createdAt.toISOString(),
      bidder: b.bidder,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getMyBids(userId: string, page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    prisma.bid.findMany({
      where: { bidderId: userId },
      include: {
        auction: {
          include: {
            listing: { select: { id: true, title: true, images: { take: 1 } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.bid.count({ where: { bidderId: userId } }),
  ]);

  return {
    items: items.map((b) => ({ ...b, amount: b.amount.toString() })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
