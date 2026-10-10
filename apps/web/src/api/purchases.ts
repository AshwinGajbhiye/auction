import { api } from './client';
import { PaginatedResult } from './listings';

export interface Purchase {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  agreedPrice: string;
  status:
    | 'PENDING'
    | 'ACCEPTED'
    | 'DECLINED'
    | 'EXCHANGE_ARRANGED'
    | 'BUYER_CONFIRMED'
    | 'SELLER_CONFIRMED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'DISPUTED';
  buyerConfirmedAt?: string | null;
  sellerConfirmedAt?: string | null;
  completedAt?: string | null;
  reservedUntil?: string | null;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    images: { id: string; imageUrl: string }[];
  };
  buyer: {
    id: string;
    name: string;
    profileImageUrl?: string | null;
  };
  seller: {
    id: string;
    name: string;
    profileImageUrl?: string | null;
  };
  review?: {
    id: string;
    rating: number;
    comment?: string | null;
  } | null;
}

export const purchasesApi = {
  createPurchaseRequest: (listingId: string) =>
    api.post<Purchase>(`/listings/${listingId}/purchase-requests`),

  respondToPurchase: (purchaseId: string, action: 'ACCEPT' | 'DECLINE') =>
    api.post<Purchase>(`/purchases/${purchaseId}/respond`, { action }),

  confirmExchange: (purchaseId: string) =>
    api.post<Purchase>(`/purchases/${purchaseId}/confirm-exchange`),

  getPurchase: (id: string) =>
    api.get<Purchase>(`/purchases/${id}`),

  getMyPurchases: (page = 1, pageSize = 20) =>
    api.get<PaginatedResult<Purchase>>('/users/me/purchases', { page, pageSize }),
};
