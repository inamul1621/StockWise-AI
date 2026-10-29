import { apiClient } from './client';
import {
  StockMovementRequest,
  InventoryTransaction,
  PaginatedTransactions,
} from '../types/inventory';

export const inventoryApi = {
  stockIn: (data: StockMovementRequest) => {
    return apiClient<InventoryTransaction>('/inventory/stock-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  stockOut: (data: StockMovementRequest) => {
    return apiClient<InventoryTransaction>('/inventory/stock-out', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  listTransactions: (params: { page?: number; size?: number; product_id?: number; transaction_type?: 'IN' | 'OUT' } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.size) query.set('size', params.size.toString());
    if (params.product_id) query.set('product_id', params.product_id.toString());
    if (params.transaction_type) query.set('transaction_type', params.transaction_type);

    const qs = query.toString();
    return apiClient<PaginatedTransactions>(`/inventory/transactions${qs ? `?${qs}` : ''}`);
  },

  getTransactionById: (id: number) => {
    return apiClient<InventoryTransaction>(`/inventory/transactions/${id}`);
  },
};
