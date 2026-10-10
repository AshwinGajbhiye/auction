import cron from 'node-cron';
import { prisma } from '../shared/prisma';
import { createAndSendNotification } from '../shared/notifications';
import { config } from '../config';
import { logger } from '../shared/logger';

/**
 * Close all auctions whose end time has passed and are still LIVE.
 * Idempotent: running this twice for the same auction is safe.
 */
export async function closeExpiredAuctions(): Promise<void> {
  const now = new Date();

  // Find all auctions that should be closed
  const expiredAuctions = await prisma.auction.findMany({
    where: {
      status: 'LIVE',
      endsAt: { lte: now },
    },
    include: {
      listing: { select: { id: true, title: true, sellerId: true } },
      bids: {
        orderBy: { amount: 'desc' },
        take: 1,
        include: { bidder: { select: { id: true, name: true } } },
      },
    },
  });

  if (expiredAuctions.length > 0) {
    logger.info(`[AuctionWorker] Processing ${expiredAuctions.length} expired auction(s).`);
  }

  for (const auction of expiredAuctions) {
    await closeAuction(auction);
  }
}

async function closeAuction(auction: any): Promise<void> {
  const { id: auctionId, listing, bids, reservePrice } = auction;

  try {
    await prisma.$transaction(async (tx) => {
      // Re-lock auction and verify it's still LIVE (idempotency check)
      const locked = await tx.$queryRaw<any[]>`
        SELECT * FROM auctions WHERE id = ${auctionId} AND status = 'LIVE' FOR UPDATE
      `;
      if (!locked.length) {
        logger.debug(`[AuctionWorker] Auction ${auctionId} already closed, skipping.`);
        return;
      }

      const winningBid = bids[0] ?? null;
      const hasWinner =
        winningBid &&
        (!reservePrice || Number(winningBid.amount) >= Number(reservePrice));

      // Mark auction ENDED
      await tx.auction.update({
        where: { id: auctionId },
        data: {
          status: 'ENDED',
          closedAt: new Date(),
        },
      });

      if (hasWinner) {
        // Create purchase record
        const purchase = await tx.purchase.create({
          data: {
            listingId: listing.id,
            buyerId: winningBid.bidder.id,
            sellerId: listing.sellerId,
            winningBidId: winningBid.id,
            agreedPrice: winningBid.amount,
            status: 'ACCEPTED',
            reservedUntil: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72h to complete
          },
        });

        // Mark listing as RESERVED
        await tx.listing.update({
          where: { id: listing.id },
          data: { status: 'RESERVED' },
        });

        // Notify winner
        await createAndSendNotification({
          recipientId: winningBid.bidder.id,
          type: 'AUCTION_WON',
          message: `Congratulations! You won the auction for "${listing.title}" with a bid of ₹${Number(winningBid.amount).toFixed(2)}.`,
          entityType: 'purchase',
          entityId: purchase.id,
        });

        // Notify seller
        await createAndSendNotification({
          recipientId: listing.sellerId,
          type: 'EXCHANGE_CONFIRMED',
          message: `Your auction for "${listing.title}" ended. Winner: ${winningBid.bidder.name}. Agreed price: ₹${Number(winningBid.amount).toFixed(2)}.`,
          entityType: 'purchase',
          entityId: purchase.id,
        });

        logger.info(`[AuctionWorker] Auction ${auctionId} closed with winner ${winningBid.bidder.id}.`);
      } else {
        // No valid winner
        await tx.listing.update({
          where: { id: listing.id },
          data: { status: 'ACTIVE' },
        });

        // Notify seller
        await createAndSendNotification({
          recipientId: listing.sellerId,
          type: 'AUCTION_LOST',
          message: `Your auction for "${listing.title}" ended with no qualifying bids.`,
          entityType: 'auction',
          entityId: auctionId,
        });

        logger.info(`[AuctionWorker] Auction ${auctionId} closed with no winner.`);
      }
    });
  } catch (err) {
    logger.error(`[AuctionWorker] Failed to close auction ${auctionId}`, { err });
  }
}

/**
 * Start the cron job that transitions SCHEDULED auctions to LIVE.
 */
export async function activateScheduledAuctions(): Promise<void> {
  const now = new Date();
  await prisma.auction.updateMany({
    where: { status: 'SCHEDULED', startsAt: { lte: now } },
    data: { status: 'LIVE' },
  });
}

export function startAuctionWorker(): void {
  logger.info(`[AuctionWorker] Starting with cron: ${config.auction.closeCron}`);
  cron.schedule(config.auction.closeCron, async () => {
    try {
      await activateScheduledAuctions();
      await closeExpiredAuctions();
    } catch (err) {
      logger.error('[AuctionWorker] Cron job error', { err });
    }
  });
}
