import { apiClient } from './client';
import { DashboardSummary, PaginatedLowStock } from '../types/dashboard';

export const dashboardApi = {
  getSummary: () => {
    return apiClient<DashboardSummary>('/dashboard/summary');
  },

  getLowStock: (params: { page?: number; size?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.size) query.set('size', params.size.toString());

    const qs = query.toString();
    return apiClient<PaginatedLowStock>(`/dashboard/low-stock${qs ? `?${qs}` : ''}`);
  },
};
