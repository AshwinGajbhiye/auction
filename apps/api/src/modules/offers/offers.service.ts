import { prisma } from '../../shared/prisma';
import { createAndSendNotification } from '../../shared/notifications';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../../shared/errors';

function formatOffer(o: any) {
  return { ...o, amount: o.amount?.toString() };
}

export async function createOffer(opts: {
  listingId: string;
  buyerId: string;
  amount: number;
  parentOfferId?: string;
}) {
  const { listingId, buyerId, amount, parentOfferId } = opts;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== 'ACTIVE') throw new NotFoundError('Listing');
  if (!listing.negotiationEnabled) throw new BadRequestError('Seller has not enabled offers on this listing.');
  if (listing.sellerId === buyerId) throw new ForbiddenError('You cannot make an offer on your own listing.');
  if (amount <= 0) throw new BadRequestError('Offer amount must be positive.');

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  const offer = await prisma.offer.create({
    data: {
      listingId,
      buyerId,
      sellerId: listing.sellerId,
      amount,
      parentOfferId: parentOfferId ?? null,
      expiresAt,
    },
    include: {
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
  });

  await createAndSendNotification({
    recipientId: listing.sellerId,
    type: parentOfferId ? 'COUNTER_OFFER' : 'OFFER_RECEIVED',
    message: `${offer.buyer.name} sent an offer of ₹${amount} on "${listing.title}".`,
    entityType: 'offer',
    entityId: offer.id,
  });

  return formatOffer(offer);
}

export async function respondToOffer(opts: {
  offerId: string;
  userId: string;
  action: 'accept' | 'reject' | 'counter';
  counterAmount?: number;
}) {
  const { offerId, userId, action, counterAmount } = opts;

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      listing: true,
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
  });

  if (!offer) throw new NotFoundError('Offer');
  if (offer.sellerId !== userId && offer.buyerId !== userId) throw new ForbiddenError();
  if (offer.status !== 'PENDING') throw new BadRequestError(`Offer is already ${offer.status}.`);
  if (offer.expiresAt < new Date()) throw new BadRequestError('Offer has expired.');

  if (action === 'accept') {
    // Only seller can accept a buyer's offer
    if (offer.sellerId !== userId) throw new ForbiddenError('Only the seller can accept an offer.');

    const purchase = await prisma.$transaction(async (tx) => {
      // Check listing is still available
      const listing = await tx.listing.findUnique({ where: { id: offer.listingId } });
      if (!listing || listing.status !== 'ACTIVE') {
        throw new BadRequestError('This listing is no longer available.');
      }

      await tx.offer.update({ where: { id: offerId }, data: { status: 'ACCEPTED' } });

      // Cancel other pending offers on this listing
      await tx.offer.updateMany({
        where: { listingId: offer.listingId, status: 'PENDING', id: { not: offerId } },
        data: { status: 'REJECTED' },
      });

      const p = await tx.purchase.create({
        data: {
          listingId: offer.listingId,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
          acceptedOfferId: offerId,
          agreedPrice: offer.amount,
          status: 'ACCEPTED',
          reservedUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      await tx.listing.update({ where: { id: offer.listingId }, data: { status: 'RESERVED' } });
      return p;
    });

    await createAndSendNotification({
      recipientId: offer.buyerId,
      type: 'OFFER_ACCEPTED',
      message: `Your offer of ₹${offer.amount} on "${offer.listing.title}" was accepted!`,
      entityType: 'purchase',
      entityId: purchase.id,
    });

    return formatOffer(offer);
  }

  if (action === 'reject') {
    await prisma.offer.update({ where: { id: offerId }, data: { status: 'REJECTED' } });
    const recipient = offer.sellerId === userId ? offer.buyerId : offer.sellerId;
    await createAndSendNotification({
      recipientId: recipient,
      type: 'OFFER_REJECTED',
      message: `Your offer on "${offer.listing.title}" was declined.`,
      entityType: 'offer',
      entityId: offerId,
    });
    return formatOffer({ ...offer, status: 'REJECTED' });
  }

  if (action === 'counter') {
    if (!counterAmount || counterAmount <= 0) throw new BadRequestError('Counter offer amount is required.');
    await prisma.offer.update({ where: { id: offerId }, data: { status: 'COUNTERED' } });
    const counter = await createOffer({
      listingId: offer.listingId,
      buyerId: offer.sellerId === userId ? offer.buyerId : offer.sellerId,
      amount: counterAmount,
      parentOfferId: offerId,
    });
    return counter;
  }

  throw new BadRequestError('Invalid action.');
}

export async function getMyOffers(userId: string, page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    prisma.offer.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: {
        listing: { select: { id: true, title: true, images: { take: 1 } } },
        buyer: { select: { id: true, name: true, profileImageUrl: true } },
        seller: { select: { id: true, name: true, profileImageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.offer.count({ where: { OR: [{ buyerId: userId }, { sellerId: userId }] } }),
  ]);
  return {
    items: items.map(formatOffer),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
