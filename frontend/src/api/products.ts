import { apiClient } from './client';
import { Product, ProductCreate, ProductUpdate, PaginatedProducts } from '../types/product';

export const productsApi = {
  list: (params: { page?: number; size?: number; search?: string; category?: string; supplier_id?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.size) query.set('size', params.size.toString());
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.supplier_id) query.set('supplier_id', params.supplier_id.toString());

    const qs = query.toString();
    return apiClient<PaginatedProducts>(`/products${qs ? `?${qs}` : ''}`);
  },

  getById: (id: number) => {
    return apiClient<Product>(`/products/${id}`);
  },

  create: (data: ProductCreate) => {
    return apiClient<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: number, data: ProductUpdate) => {
    return apiClient<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: (id: number) => {
    return apiClient<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};
