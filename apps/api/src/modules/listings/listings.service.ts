import { prisma } from '../../shared/prisma';
import { storeImage } from '../../shared/storage';
import { createAndSendNotification } from '../../shared/notifications';
import { ForbiddenError, NotFoundError, BadRequestError, ConflictError } from '../../shared/errors';
import { ListingStatus } from '@prisma/client';

const LISTING_SELECT = {
  id: true,
  title: true,
  description: true,
  condition: true,
  listingType: true,
  fixedPrice: true,
  minimumAcceptablePrice: true,
  negotiationEnabled: true,
  pickupLocation: true,
  status: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
  seller: {
    select: {
      id: true,
      name: true,
      profileImageUrl: true,
      course: true,
      graduationYear: true,
      emailVerifiedAt: true,
      createdAt: true,
      college: { select: { id: true, name: true } },
    },
  },
  college: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, slug: true, parentId: true, active: true } },
  images: { orderBy: { displayOrder: 'asc' as const } },
  auction: {
    select: {
      id: true,
      listingId: true,
      startsAt: true,
      endsAt: true,
      startingBid: true,
      minimumBidIncrement: true,
      currentHighestBid: true,
      highestBidderId: true,
      status: true,
      closedAt: true,
      _count: { select: { bids: true } },
    },
  },
} as const;

function formatListing(l: any, userId?: string) {
  return {
    ...l,
    fixedPrice: l.fixedPrice?.toString() ?? null,
    minimumAcceptablePrice: l.minimumAcceptablePrice?.toString() ?? null,
    seller: {
      ...l.seller,
      emailVerified: !!l.seller.emailVerifiedAt,
      memberSince: l.seller.createdAt,
    },
    auction: l.auction
      ? {
          ...l.auction,
          startingBid: l.auction.startingBid?.toString(),
          minimumBidIncrement: l.auction.minimumBidIncrement?.toString(),
          currentHighestBid: l.auction.currentHighestBid?.toString() ?? null,
          bidCount: l.auction._count?.bids ?? 0,
          reservePriceMet: null, // don't expose private reserve
        }
      : null,
  };
}

export async function getListings(opts: {
  collegeId?: string;
  categoryId?: string;
  listingType?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
  sortBy?: string;
  page: number;
  pageSize: number;
  userId?: string;
}) {
  const {
    collegeId,
    categoryId,
    listingType,
    condition,
    minPrice,
    maxPrice,
    query,
    sortBy = 'newest',
    page,
    pageSize,
    userId,
  } = opts;

  const where: any = { status: 'ACTIVE' };
  if (collegeId) where.collegeId = collegeId;
  if (categoryId) where.categoryId = categoryId;
  if (listingType) where.listingType = listingType;
  if (condition) where.condition = condition;
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.fixedPrice = {};
    if (minPrice !== undefined) where.fixedPrice.gte = minPrice;
    if (maxPrice !== undefined) where.fixedPrice.lte = maxPrice;
  }
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }

  const orderBy: any[] = [];
  if (sortBy === 'newest') orderBy.push({ createdAt: 'desc' });
  else if (sortBy === 'oldest') orderBy.push({ createdAt: 'asc' });
  else if (sortBy === 'price_asc') orderBy.push({ fixedPrice: 'asc' });
  else if (sortBy === 'price_desc') orderBy.push({ fixedPrice: 'desc' });
  else orderBy.push({ createdAt: 'desc' });

  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.listing.findMany({ where, select: LISTING_SELECT, orderBy, skip, take: pageSize }),
    prisma.listing.count({ where }),
  ]);

  // Check favourites if user logged in
  let favouritedIds = new Set<string>();
  if (userId) {
    const favs = await prisma.favourite.findMany({
      where: { userId, listingId: { in: items.map((i) => i.id) } },
      select: { listingId: true },
    });
    favouritedIds = new Set(favs.map((f) => f.listingId));
  }

  return {
    items: items.map((l) => ({ ...formatListing(l, userId), isFavourited: favouritedIds.has(l.id) })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getListing(id: string, userId?: string) {
  const listing = await prisma.listing.findUnique({ where: { id }, select: LISTING_SELECT });
  if (!listing || listing.status === 'DELETED') throw new NotFoundError('Listing');

  // Increment view count
  await prisma.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  let isFavourited = false;
  if (userId) {
    const fav = await prisma.favourite.findUnique({ where: { userId_listingId: { userId, listingId: id } } });
    isFavourited = !!fav;
  }

  return { ...formatListing(listing, userId), isFavourited };
}

export async function createListing(
  sellerId: string,
  collegeId: string,
  data: any,
  imageFiles: Express.Multer.File[],
) {
  if (!data.categoryId) throw new BadRequestError('Category is required.');
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category?.active) throw new BadRequestError('Invalid category.');

  if (data.listingType === 'FIXED_PRICE' && !data.fixedPrice) {
    throw new BadRequestError('Fixed price is required for fixed-price listings.');
  }
  if (data.listingType === 'AUCTION' && !data.startingBid) {
    throw new BadRequestError('Starting bid is required for auction listings.');
  }

  // Upload images
  const storedImages: { url: string; order: number }[] = [];
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const stored = await storeImage(file.buffer, file.mimetype, `listings/${sellerId}`);
    storedImages.push({ url: stored.url, order: i });
  }

  const listing = await prisma.$transaction(async (tx) => {
    const l = await tx.listing.create({
      data: {
        sellerId,
        collegeId,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        condition: data.condition,
        listingType: data.listingType,
        fixedPrice: data.fixedPrice ? parseFloat(data.fixedPrice) : null,
        minimumAcceptablePrice: data.minimumAcceptablePrice
          ? parseFloat(data.minimumAcceptablePrice)
          : null,
        negotiationEnabled: data.negotiationEnabled === 'true' || data.negotiationEnabled === true,
        pickupLocation: data.pickupLocation,
        status: 'ACTIVE',
        images: {
          create: storedImages.map((img) => ({ imageUrl: img.url, displayOrder: img.order })),
        },
      },
      select: LISTING_SELECT,
    });

    if (data.listingType === 'AUCTION') {
      const startsAt = data.startsAt ? new Date(data.startsAt) : new Date();
      const endsAt = new Date(data.endsAt);
      if (endsAt <= startsAt) throw new BadRequestError('Auction end time must be after start time.');

      await tx.auction.create({
        data: {
          listingId: l.id,
          startsAt,
          endsAt,
          startingBid: parseFloat(data.startingBid),
          minimumBidIncrement: data.minimumBidIncrement ? parseFloat(data.minimumBidIncrement) : 1,
          reservePrice: data.reservePrice ? parseFloat(data.reservePrice) : null,
          status: startsAt <= new Date() ? 'LIVE' : 'SCHEDULED',
        },
      });
    }

    return l;
  });

  return formatListing(listing);
}

export async function updateListing(
  id: string,
  userId: string,
  userRole: string,
  data: any,
  imageFiles?: Express.Multer.File[],
) {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.status === 'DELETED') throw new NotFoundError('Listing');

  if (listing.sellerId !== userId && userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
    throw new ForbiddenError();
  }

  if (listing.status === 'SOLD') throw new BadRequestError('Cannot edit a sold listing.');

  // If auction listing has live bids, restrict price changes
  if (listing.listingType === 'AUCTION') {
    const auction = await prisma.auction.findUnique({ where: { listingId: id } });
    if (auction?.status === 'LIVE') {
      const bidCount = await prisma.bid.count({ where: { auctionId: auction.id } });
      if (bidCount > 0 && data.startingBid) {
        throw new BadRequestError('Cannot change starting bid once bidding has started.');
      }
    }
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.condition && { condition: data.condition }),
      ...(data.pickupLocation && { pickupLocation: data.pickupLocation }),
      ...(data.status && { status: data.status }),
      ...(data.fixedPrice !== undefined && { fixedPrice: data.fixedPrice ? parseFloat(data.fixedPrice) : null }),
      ...(data.negotiationEnabled !== undefined && { negotiationEnabled: Boolean(data.negotiationEnabled) }),
    },
    select: LISTING_SELECT,
  });

  return formatListing(updated);
}

export async function deleteListing(id: string, userId: string, userRole: string) {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.status === 'DELETED') throw new NotFoundError('Listing');
  if (listing.sellerId !== userId && userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
    throw new ForbiddenError();
  }
  if (listing.status === 'SOLD' || listing.status === 'RESERVED') {
    throw new BadRequestError('Cannot delete a listing with an active transaction.');
  }
  await prisma.listing.update({ where: { id }, data: { status: 'DELETED' } });
}

export async function getMyListings(userId: string, page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: userId, status: { not: 'DELETED' } },
      select: LISTING_SELECT,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.listing.count({ where: { sellerId: userId, status: { not: 'DELETED' } } }),
  ]);
  return { items: items.map((l) => formatListing(l, userId)), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
