import { prisma } from '../../shared/prisma';
import { createAndSendNotification } from '../../shared/notifications';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../shared/errors';

function fmt(p: any) {
  return { ...p, agreedPrice: p.agreedPrice?.toString() };
}

export async function createPurchaseRequest(opts: {
  listingId: string;
  buyerId: string;
}) {
  const { listingId, buyerId } = opts;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== 'ACTIVE') throw new NotFoundError('Listing');
  if (listing.listingType !== 'FIXED_PRICE') throw new BadRequestError('Use bidding for auction listings.');
  if (listing.sellerId === buyerId) throw new ForbiddenError('You cannot buy your own listing.');

  // Prevent duplicate pending requests from the same buyer
  const existing = await prisma.purchase.findFirst({
    where: { listingId, buyerId, status: { in: ['PENDING', 'ACCEPTED'] } },
  });
  if (existing) throw new BadRequestError('You already have an active request for this listing.');

  const purchase = await prisma.$transaction(async (tx) => {
    // Re-check listing is still ACTIVE under lock
    const l = await tx.$queryRaw<any[]>`
      SELECT id, status FROM listings WHERE id = ${listingId} AND status = 'ACTIVE' FOR UPDATE
    `;
    if (!l.length) throw new BadRequestError('Listing is no longer available.');

    return tx.purchase.create({
      data: {
        listingId,
        buyerId,
        sellerId: listing.sellerId,
        agreedPrice: listing.fixedPrice!,
        status: 'PENDING',
        reservedUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
      include: {
        listing: { select: { id: true, title: true, images: { take: 1 } } },
        buyer: { select: { id: true, name: true, profileImageUrl: true } },
        seller: { select: { id: true, name: true, profileImageUrl: true } },
      },
    });
  });

  await createAndSendNotification({
    recipientId: listing.sellerId,
    type: 'PURCHASE_REQUEST',
    message: `${purchase.buyer.name} wants to buy "${listing.title}" for ₹${Number(listing.fixedPrice).toFixed(2)}.`,
    entityType: 'purchase',
    entityId: purchase.id,
  });

  return fmt(purchase);
}

export async function respondToPurchase(opts: {
  purchaseId: string;
  userId: string;
  action: 'accept' | 'reject';
}) {
  const { purchaseId, userId, action } = opts;

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { listing: true, buyer: { select: { id: true, name: true } } },
  });
  if (!purchase) throw new NotFoundError('Purchase request');
  if (purchase.sellerId !== userId) throw new ForbiddenError('Only the seller can respond.');
  if (purchase.status !== 'PENDING') throw new BadRequestError(`Purchase is already ${purchase.status}.`);

  if (action === 'accept') {
    await prisma.$transaction(async (tx) => {
      // Check listing is still available
      const listing = await tx.listing.findUnique({ where: { id: purchase.listingId } });
      if (!listing || (listing.status !== 'ACTIVE' && listing.status !== 'RESERVED')) {
        throw new BadRequestError('Listing is no longer available.');
      }

      await tx.purchase.update({ where: { id: purchaseId }, data: { status: 'ACCEPTED' } });

      // Reject all other pending purchase requests for this listing
      await tx.purchase.updateMany({
        where: { listingId: purchase.listingId, status: 'PENDING', id: { not: purchaseId } },
        data: { status: 'REJECTED' },
      });

      await tx.listing.update({ where: { id: purchase.listingId }, data: { status: 'RESERVED' } });
    });

    await createAndSendNotification({
      recipientId: purchase.buyerId,
      type: 'PURCHASE_ACCEPTED',
      message: `Your purchase request for "${purchase.listing.title}" was accepted! Arrange pickup with the seller.`,
      entityType: 'purchase',
      entityId: purchaseId,
    });
  } else {
    await prisma.purchase.update({ where: { id: purchaseId }, data: { status: 'REJECTED' } });
    await createAndSendNotification({
      recipientId: purchase.buyerId,
      type: 'PURCHASE_REJECTED',
      message: `Your purchase request for "${purchase.listing.title}" was declined.`,
      entityType: 'purchase',
      entityId: purchaseId,
    });
  }

  return fmt(purchase);
}

export async function confirmExchange(opts: {
  purchaseId: string;
  userId: string;
}) {
  const { purchaseId, userId } = opts;

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { listing: true },
  });
  if (!purchase) throw new NotFoundError('Purchase');
  if (purchase.buyerId !== userId && purchase.sellerId !== userId) throw new ForbiddenError();
  if (!['ACCEPTED', 'EXCHANGE_PENDING'].includes(purchase.status)) {
    throw new BadRequestError('Purchase cannot be confirmed in its current state.');
  }

  const isBuyer = purchase.buyerId === userId;
  const isSeller = purchase.sellerId === userId;

  const data: any = {};
  if (isBuyer && !purchase.buyerConfirmedAt) data.buyerConfirmedAt = new Date();
  if (isSeller && !purchase.sellerConfirmedAt) data.sellerConfirmedAt = new Date();
  data.status = 'EXCHANGE_PENDING';

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.purchase.update({ where: { id: purchaseId }, data });

    const bothConfirmed = p.buyerConfirmedAt && p.sellerConfirmedAt;
    if (bothConfirmed) {
      await tx.purchase.update({ where: { id: purchaseId }, data: { status: 'COMPLETED', completedAt: new Date() } });
      await tx.listing.update({ where: { id: purchase.listingId }, data: { status: 'SOLD' } });
    }

    return tx.purchase.findUnique({ where: { id: purchaseId } });
  });

  if (updated?.status === 'COMPLETED') {
    const otherParty = isBuyer ? purchase.sellerId : purchase.buyerId;
    await createAndSendNotification({
      recipientId: otherParty,
      type: 'EXCHANGE_CONFIRMED',
      message: `Exchange for "${purchase.listing.title}" is complete! You can now leave a review.`,
      entityType: 'purchase',
      entityId: purchaseId,
    });
  }

  return fmt(updated);
}

export async function getMyPurchases(userId: string, page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const where = { OR: [{ buyerId: userId }, { sellerId: userId }] };
  const [items, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: {
        listing: { select: { id: true, title: true, images: { take: 1 } } },
        buyer: { select: { id: true, name: true, profileImageUrl: true } },
        seller: { select: { id: true, name: true, profileImageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.purchase.count({ where }),
  ]);
  return { items: items.map(fmt), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getPurchase(purchaseId: string, userId: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      listing: { select: { id: true, title: true, images: { take: 1 }, pickupLocation: true } },
      buyer: { select: { id: true, name: true, profileImageUrl: true } },
      seller: { select: { id: true, name: true, profileImageUrl: true } },
    },
  });
  if (!purchase) throw new NotFoundError('Purchase');
  if (purchase.buyerId !== userId && purchase.sellerId !== userId) throw new ForbiddenError();
  return fmt(purchase);
}
