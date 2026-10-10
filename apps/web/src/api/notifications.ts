import { api } from './client';

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const notificationsApi = {
  getNotifications: (page = 1, pageSize = 20) =>
    api.get<NotificationsResponse>('/notifications', { page, pageSize }),

  markAsRead: (id: string) =>
    api.patch<{ message: string }>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch<{ message: string }>('/notifications/read-all'),
};
