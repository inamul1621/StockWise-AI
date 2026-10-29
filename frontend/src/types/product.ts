export interface Product {
  id: number;
  supplier_id: number | null;
  supplier_name: string | null;
  name: string;
  sku: string;
  category: string | null;
  description: string | null;
  cost_price: string;
  unit_price: string;
  current_stock: number;
  reorder_level: number;
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  name: string;
  sku: string;
  supplier_id?: number | null;
  category?: string | null;
  description?: string | null;
  cost_price?: string;
  unit_price: string;
  reorder_level?: number;
}

export interface ProductUpdate {
  name?: string;
  supplier_id?: number | null;
  category?: string | null;
  description?: string | null;
  cost_price?: string;
  unit_price?: string;
  reorder_level?: number;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
