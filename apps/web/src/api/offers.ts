import { api } from './client';
import { PaginatedResult } from './listings';

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  amount: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'COUNTERED';
  expiresAt: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    fixedPrice: string | null;
    sellerId: string;
    images: { id: string; imageUrl: string }[];
  };
  buyer: {
    id: string;
    name: string;
    profileImageUrl?: string | null;
  };
}

export const offersApi = {
  createOffer: (listingId: string, amount: number, parentOfferId?: string) =>
    api.post<Offer>(`/listings/${listingId}/offers`, { amount, parentOfferId }),

  respondToOffer: (
    offerId: string,
    action: 'ACCEPT' | 'REJECT' | 'COUNTER',
    counterAmount?: number,
  ) => api.post(`/offers/${offerId}/respond`, { action, counterAmount }),

  getMyOffers: (page = 1, pageSize = 20) =>
    api.get<PaginatedResult<Offer>>('/users/me/offers', { page, pageSize }),
};
