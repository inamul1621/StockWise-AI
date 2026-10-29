export interface InventoryReportItem {
  product_id: number;
  name: string;
  sku: string;
  category: string | null;
  supplier_name: string | null;
  current_stock: number;
  reorder_level: number;
  cost_price: string;
  unit_price: string;
  total_cost_value: string;
  total_retail_value: string;
  potential_profit: string;
  stock_status: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK';
}

export interface InventoryReport {
  total_products: number;
  total_units_in_stock: number;
  total_inventory_cost_value: string;
  total_inventory_retail_value: string;
  total_potential_profit: string;
  items: InventoryReportItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ProductMovementSummary {
  product_id: number;
  product_name: string;
  product_sku: string;
  units_in: number;
  units_out: number;
  net_movement: number;
  transaction_count: number;
}

export interface InventoryMovementsReport {
  start_date: string | null;
  end_date: string | null;
  total_in_transactions: number;
  total_out_transactions: number;
  total_units_in: number;
  total_units_out: number;
  net_units_change: number;
  product_breakdowns: ProductMovementSummary[];
}
