export type TransactionType = 'IN' | 'OUT';

export interface StockMovementRequest {
  product_id: number;
  quantity: number;
  reference?: string | null;
  reason?: string | null;
  notes?: string | null;
}

export interface InventoryTransaction {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  transaction_type: TransactionType;
  quantity: number;
  reference: string | null;
  reason: string | null;
  notes: string | null;
  created_at: string;
  current_stock_after: number;
}

export interface PaginatedTransactions {
  items: InventoryTransaction[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
