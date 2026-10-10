import { api } from './client';
import { PaginatedResult } from './listings';

export interface ReviewItem {
  id: string;
  purchaseId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    profileImageUrl?: string | null;
  };
}

export const reviewsApi = {
  createReview: (purchaseId: string, data: { rating: number; comment?: string }) =>
    api.post<ReviewItem>(`/purchases/${purchaseId}/reviews`, data),

  getUserReviews: (userId: string, page = 1, pageSize = 10) =>
    api.get<PaginatedResult<ReviewItem> & { averageRating?: number | null }>(
      `/users/${userId}/reviews`,
      { page, pageSize },
    ),
};
