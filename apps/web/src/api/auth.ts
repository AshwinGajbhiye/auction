import { api } from './client';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'MODERATOR' | 'ADMIN';
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  emailVerified: boolean;
  profileImageUrl?: string | null;
  course?: string | null;
  graduationYear?: number | null;
  college?: { id: string; name: string; slug: string } | null;
  memberSince?: string;
  activeListingsCount?: number;
  completedTransactionsCount?: number;
  averageRating?: number | null;
  reviewCount?: number;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
}

export const authApi = {
  getMe: () => api.get<UserSession>('/auth/me'),

  login: (data: { email: string; password: string }) =>
    api.post<UserSession>('/auth/login', data),

  register: (data: {
    name: string;
    email: string;
    password: string;
    collegeId: string;
  }) => api.post<{ message: string; userId: string }>('/auth/register', data),

  logout: () => api.post<{ message: string }>('/auth/logout'),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post<{ message: string }>('/auth/reset-password', data),

  verifyEmail: (token: string) =>
    api.post<{ message: string }>('/auth/verify-email', { token }),
};
