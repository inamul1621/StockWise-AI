import React, { useState, useEffect } from 'react';
import { productsApi } from '../api/products';
import { suppliersApi } from '../api/suppliers';
import { Product } from '../types/product';
import { Supplier } from '../types/supplier';
import { Pagination } from '../components/common/Pagination';
import { Spinner } from '../components/common/Spinner';
import { Alert } from '../components/common/Alert';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { ApiClientError } from '../api/client';

interface ProductsPageProps {
  onOpenCreateModal: () => void;
  onEditProduct: (product: Product) => void;
  onStockMovement: (product: Product, type: 'IN' | 'OUT') => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  onOpenCreateModal,
  onEditProduct,
  onStockMovement,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const size = 15;

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<number | ''>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      const res = await suppliersApi.list({ size: 100 });
      setSuppliers(res.items);
    } catch {}
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productsApi.list({
        page,
        size,
        search: searchTerm.trim() || undefined,
        category: categoryFilter.trim() || undefined,
        supplier_id: supplierFilter === '' ? undefined : Number(supplierFilter),
      });
      setProducts(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err: any) {
      setError(err?.detail || 'Failed to fetch product catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, supplierFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to delete product '${product.name}' (SKU: ${product.sku})?`)) {
      return;
    }
    try {
      await productsApi.delete(product.id);
      setActionSuccess(`Deleted product '${product.name}'.`);
      fetchProducts();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.detail);
      } else {
        setError('Failed to delete product.');
      }
    }
  };

  const formatPrice = (val: string) => {
    const num = parseFloat(val);
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-950 dark:text-white">Products Catalog</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Create, update, and manage inventory items and prices
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Product
        </button>
      </div>

      {actionSuccess && (
        <Alert
          type="success"
          message={actionSuccess}
          onClose={() => setActionSuccess(null)}
        />
      )}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-900 p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 sm:flex-initial px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-black dark:bg-brand-600 dark:hover:bg-brand-700 rounded-lg transition-colors text-center"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setSupplierFilter('');
                setPage(1);
                fetchProducts();
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
          <div className="flex items-center space-x-1.5 text-gray-500 dark:text-gray-400 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Filter:</span>
          </div>

          <input
            type="text"
            placeholder="Category..."
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="flex-1 sm:flex-initial min-w-[120px] px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:ring-1 focus:ring-brand-500"
          />

          <select
            value={supplierFilter}
            onChange={(e) => {
              setSupplierFilter(e.target.value ? Number(e.target.value) : '');
              setPage(1);
            }}
            className="flex-1 sm:flex-initial min-w-[130px] px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <Spinner size="md" label="Loading products..." className="py-16" />
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No products found.</p>
            <p className="text-xs mt-1">Try adjusting your search criteria or register a new product.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/60 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4 text-right">Cost</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-center">Current Stock</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Quick Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  {products.map((p) => {
                    const isOut = p.current_stock === 0;
                    const isLow = p.current_stock <= p.reorder_level && !isOut;

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900 dark:text-white">{p.name}</p>
                          {p.category && (
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">{p.category}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">{p.sku}</td>
                        <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-300">
                          {p.supplier_name || <span className="text-gray-400 dark:text-gray-500">None</span>}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-600 dark:text-gray-400">
                          {formatPrice(p.cost_price)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                          {formatPrice(p.unit_price)}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-gray-950 dark:text-white">
                          {p.current_stock}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isOut ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-transparent dark:border-red-900/50 rounded-full">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-transparent dark:border-amber-900/50 rounded-full">
                              Low Stock ({p.reorder_level})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400 border border-transparent dark:border-green-900/50 rounded-full">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center space-x-1">
                            <button
                              onClick={() => onStockMovement(p, 'IN')}
                              className="p-1 rounded bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/50 dark:text-green-400 dark:hover:bg-green-900/60 transition-colors"
                              title="Stock In"
                            >
                              <ArrowDownLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onStockMovement(p, 'OUT')}
                              className="p-1 rounded bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-900/60 transition-colors"
                              title="Stock Out"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center space-x-2">
                            <button
                              onClick={() => onEditProduct(p)}
                              className="p-1 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 rounded transition-colors"
                              title="Edit product details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 rounded transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
