import { apiClient } from './client';
import { InventoryReport, InventoryMovementsReport } from '../types/reports';

export const reportsApi = {
  getInventoryReport: (params: { page?: number; size?: number; category?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.size) query.set('size', params.size.toString());
    if (params.category) query.set('category', params.category);

    const qs = query.toString();
    return apiClient<InventoryReport>(`/reports/inventory${qs ? `?${qs}` : ''}`);
  },

  getInventoryMovements: (params: { start_date?: string; end_date?: string; product_id?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.start_date) query.set('start_date', params.start_date);
    if (params.end_date) query.set('end_date', params.end_date);
    if (params.product_id) query.set('product_id', params.product_id.toString());

    const qs = query.toString();
    return apiClient<InventoryMovementsReport>(`/reports/inventory-movements${qs ? `?${qs}` : ''}`);
  },
};
