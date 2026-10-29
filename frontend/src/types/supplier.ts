import { Product } from './product';

export interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  products_count: number;
  created_at: string;
  updated_at: string;
}

export interface SupplierCreate {
  name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface SupplierUpdate {
  name?: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface SupplierDetail extends Supplier {
  products: Product[];
}

export interface PaginatedSuppliers {
  items: Supplier[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
