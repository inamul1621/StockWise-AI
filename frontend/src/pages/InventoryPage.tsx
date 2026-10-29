import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../api/inventory';
import { productsApi } from '../api/products';
import { InventoryTransaction, TransactionType } from '../types/inventory';
import { Product } from '../types/product';
import { Pagination } from '../components/common/Pagination';
import { Spinner } from '../components/common/Spinner';
import { Alert } from '../components/common/Alert';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Plus,
  Minus,
} from 'lucide-react';

interface InventoryPageProps {
  onOpenStockMovement: (type: TransactionType) => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  onOpenStockMovement,
}) => {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const size = 15;

  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');
  const [productFilter, setProductFilter] = useState<number | ''>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      const res = await productsApi.list({ size: 100 });
      setProducts(res.items);
    } catch {}
  };

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryApi.listTransactions({
        page,
        size,
        transaction_type: typeFilter || undefined,
        product_id: productFilter === '' ? undefined : Number(productFilter),
      });
      setTransactions(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err: any) {
      setError(err?.detail || 'Failed to fetch inventory transactions ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [page, typeFilter, productFilter]);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-950 dark:text-white">Inventory Audit Ledger</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Immutable physical stock transaction history & movement records
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onOpenStockMovement('IN')}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Stock In
          </button>
          <button
            onClick={() => onOpenStockMovement('OUT')}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
          >
            <Minus className="w-4 h-4 mr-1" />
            Stock Out
          </button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-gray-500 dark:text-gray-400 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Movements:</span>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as TransactionType | '');
              setPage(1);
            }}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-1 focus:ring-brand-500 font-medium"
          >
            <option value="">All Types (IN & OUT)</option>
            <option value="IN">Only Stock In (+)</option>
            <option value="OUT">Only Stock Out (-)</option>
          </select>

          <select
            value={productFilter}
            onChange={(e) => {
              setProductFilter(e.target.value ? Number(e.target.value) : '');
              setPage(1);
            }}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-1 focus:ring-brand-500 font-medium"
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh Ledger
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <Spinner size="md" label="Loading transaction ledger..." className="py-16" />
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No stock movements found.</p>
            <p className="text-xs mt-1">Record a Stock In or Stock Out action to start the audit ledger.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/60 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4 text-center">Type</th>
                    <th className="py-3 px-4 text-center">Quantity</th>
                    <th className="py-3 px-4 text-center">Balance After</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  {transactions.map((tx) => {
                    const isIn = tx.transaction_type === 'IN';
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                          {formatDate(tx.created_at)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                          {tx.product_name}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                          {tx.product_sku}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              isIn
                                ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400 border border-transparent dark:border-green-900/50'
                                : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-transparent dark:border-red-900/50'
                            }`}
                          >
                            {isIn ? (
                              <ArrowDownLeft className="w-3.5 h-3.5 mr-0.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                            )}
                            {isIn ? 'STOCK IN' : 'STOCK OUT'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-black">
                          <span className={isIn ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                            {isIn ? `+${tx.quantity}` : `-${tx.quantity}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-gray-800 dark:text-gray-100">
                          {tx.current_stock_after}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-gray-600 dark:text-gray-400">
                          {tx.reference || <span className="text-gray-400 dark:text-gray-600">—</span>}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-300">
                          {tx.reason || tx.notes || <span className="text-gray-400 dark:text-gray-600">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              pages={pages}
              total={total}
              size={size}
              onPageChange={setPage}
              disabled={loading}
            />
          </>
        )}
      </div>
    </div>
  );
};
