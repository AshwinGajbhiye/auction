import { api } from './client';
import { PaginatedResult } from './listings';

export interface BidItem {
  id: string;
  amount: string;
  createdAt: string;
  bidder: {
    id: string;
    name: string;
    profileImageUrl?: string | null;
  };
}

export interface AuctionDetail {
  id: string;
  listingId: string;
  startingBid: string;
  currentHighestBid: string | null;
  reservePrice?: string | null;
  bidIncrement: string;
  startsAt: string;
  endsAt: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  closedAt?: string | null;
  bidsCount: number;
  highestBidder?: { id: string; name: string } | null;
  listing: {
    id: string;
    title: string;
    description: string;
    condition: string;
    status: string;
    images: { id: string; imageUrl: string }[];
    seller: {
      id: string;
      name: string;
      profileImageUrl?: string | null;
      averageRating?: number | null;
    };
    college?: { id: string; name: string };
  };
}

export const auctionsApi = {
  getAuctions: (params?: { status?: string; page?: number; pageSize?: number }) =>
    api.get<PaginatedResult<any>>('/auctions', params),

  getAuction: (id: string) =>
    api.get<AuctionDetail>(`/auctions/${id}`),

  placeBid: (auctionId: string, amount: number) =>
    api.post<{ id: string; amount: string }>(`/auctions/${auctionId}/bids`, { amount }),

  getBids: (auctionId: string, page = 1, pageSize = 20) =>
    api.get<PaginatedResult<BidItem>>(`/auctions/${auctionId}/bids`, { page, pageSize }),

  getMyBids: (page = 1, pageSize = 20) =>
    api.get<PaginatedResult<any>>('/users/me/bids', { page, pageSize }),
};
