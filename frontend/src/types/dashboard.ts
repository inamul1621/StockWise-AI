export interface DashboardSummary {
  total_products: number;
  total_units_in_stock: number;
  low_stock_products_count: number;
  out_of_stock_products_count: number;
  total_inventory_cost_value: string;
  total_inventory_retail_value: string;
  potential_profit: string;
  total_suppliers: number;
}

export interface LowStockItem {
  product_id: number;
  name: string;
  sku: string;
  category: string | null;
  current_stock: number;
  reorder_level: number;
  reorder_deficit: number;
  cost_price: string;
  unit_price: string;
  supplier_id: number | null;
  supplier_name: string | null;
}

export interface PaginatedLowStock {
  items: LowStockItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
