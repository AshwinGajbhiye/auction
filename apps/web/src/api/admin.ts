import { api } from './client';
import { PaginatedResult } from './listings';

export interface AdminStats {
  totalUsers: number;
  activeListings: number;
  activeAuctions: number;
  pendingReports: number;
  completedPurchases: number;
  totalColleges: number;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'MODERATOR' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  emailVerified: boolean;
  createdAt: string;
  college?: { id: string; name: string };
  _count: {
    listings: number;
    reportsFiledBy: number;
    reportsAgainst: number;
  };
}

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: any;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const adminApi = {
  getStats: () => api.get<AdminStats>('/admin/stats'),

  getUsers: (params?: { q?: string; role?: string; status?: string; page?: number; pageSize?: number }) =>
    api.get<PaginatedResult<AdminUserItem>>('/admin/users', params),

  updateUserRole: (id: string, role: string) =>
    api.patch<{ id: string; role: string }>(`/admin/users/${id}/role`, { role }),

  updateUserStatus: (id: string, status: string, reason?: string) =>
    api.patch<{ id: string; status: string }>(`/users/${id}/status`, { status, reason }),

  getAuditLogs: (page = 1, pageSize = 25) =>
    api.get<PaginatedResult<AuditLogItem>>('/admin/audit-logs', { page, pageSize }),

  createCategory: (data: { name: string; slug: string; parentId?: string }) =>
    api.post('/admin/categories', data),
};
