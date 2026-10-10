import { api } from './client';

export interface ListingImage {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

export interface ListingSeller {
  id: string;
  name: string;
  profileImageUrl?: string | null;
  averageRating?: number | null;
  reviewCount?: number;
  college?: { name: string };
  createdAt?: string;
}

export interface AuctionSummary {
  id: string;
  startingBid: string;
  currentHighestBid: string | null;
  reservePrice?: string | null;
  bidIncrement: string;
  startsAt: string;
  endsAt: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  bidsCount?: number;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  listingType: 'FIXED_PRICE' | 'AUCTION';
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
  fixedPrice: string | null;
  status: 'ACTIVE' | 'RESERVED' | 'SOLD' | 'PAUSED' | 'DELETED';
  collegeId: string;
  college?: { id: string; name: string };
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  sellerId: string;
  seller: ListingSeller;
  images: ListingImage[];
  auction?: AuctionSummary | null;
  isFavourited?: boolean;
  favouriteCount?: number;
  createdAt: string;
}

export interface ListingsQuery {
  page?: number;
  pageSize?: number;
  collegeId?: string;
  categoryId?: string;
  listingType?: 'FIXED_PRICE' | 'AUCTION';
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'ending_soonest';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const listingsApi = {
  getListings: (query?: ListingsQuery) =>
    api.get<PaginatedResult<Listing>>('/listings', query),

  getListing: (id: string) =>
    api.get<Listing>(`/listings/${id}`),

  createListing: (formData: FormData) =>
    api.upload<Listing>('/listings', formData, 'POST'),

  updateListing: (id: string, formData: FormData) =>
    api.upload<Listing>(`/listings/${id}`, formData, 'PATCH'),

  deleteListing: (id: string) =>
    api.delete<{ message: string }>(`/listings/${id}`),

  getMyListings: (page = 1, pageSize = 20) =>
    api.get<PaginatedResult<Listing>>('/users/me/listings', { page, pageSize }),

  toggleFavourite: async (listingId: string, currentFavourited: boolean) => {
    if (currentFavourited) {
      return api.delete<{ favourited: boolean }>(`/listings/${listingId}/favourite`);
    } else {
      return api.post<{ favourited: boolean }>(`/listings/${listingId}/favourite`);
    }
  },

  getMyFavourites: (page = 1, pageSize = 20) =>
    api.get<PaginatedResult<Listing & { favouritedAt: string }>>('/users/me/favourites', {
      page,
      pageSize,
    }),
};
