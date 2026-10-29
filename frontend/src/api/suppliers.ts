import { apiClient } from './client';
import { Supplier, SupplierCreate, SupplierUpdate, SupplierDetail, PaginatedSuppliers } from '../types/supplier';

export const suppliersApi = {
  list: (params: { page?: number; size?: number; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.size) query.set('size', params.size.toString());
    if (params.search) query.set('search', params.search);

    const qs = query.toString();
    return apiClient<PaginatedSuppliers>(`/suppliers${qs ? `?${qs}` : ''}`);
  },

  getById: (id: number) => {
    return apiClient<SupplierDetail>(`/suppliers/${id}`);
  },

  create: (data: SupplierCreate) => {
    return apiClient<Supplier>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: number, data: SupplierUpdate) => {
    return apiClient<Supplier>(`/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: (id: number) => {
    return apiClient<void>(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  },
};
