import { api } from './client';
import { PaginatedResult } from './listings';

export interface ReportItem {
  id: string;
  category: string;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  resolutionNotes?: string | null;
  createdAt: string;
  reporter: { id: string; name: string };
  reportedUser?: { id: string; name: string } | null;
  listing?: { id: string; title: string } | null;
  assignedModerator?: { id: string; name: string } | null;
}

export const reportsApi = {
  submitReport: (data: {
    category: string;
    description: string;
    reportedUserId?: string;
    listingId?: string;
  }) => api.post<{ id: string; message: string }>('/reports', data),

  getReports: (page = 1, pageSize = 20, status?: string) =>
    api.get<PaginatedResult<ReportItem>>('/reports', { page, pageSize, status }),

  updateReport: (
    id: string,
    data: { status?: string; resolutionNotes?: string; assignedModeratorId?: string },
  ) => api.patch<ReportItem>(`/reports/${id}`, data),
};
