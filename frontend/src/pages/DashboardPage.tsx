import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../api/dashboard';
import { DashboardSummary, LowStockItem } from '../types/dashboard';
import { Product } from '../types/product';
import { StatCard } from '../components/common/StatCard';
import { Spinner } from '../components/common/Spinner';
import { Alert } from '../components/common/Alert';
import {
  Boxes,
  Layers,
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  Truck,
  RefreshCw,
  PlusCircle,
  XOctagon,
} from 'lucide-react';

interface DashboardPageProps {
  onRestockProduct: (product: Product) => void;
  onNavigateToProducts: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onRestockProduct,
  onNavigateToProducts,
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, lowRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getLowStock({ size: 10 }),
      ]);
      setSummary(sumRes);
      setLowStockItems(lowRes.items);
    } catch (err: any) {
      setError(err?.detail || 'Failed to load dashboard data from StockWise API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num)
      ? '₹0.00'
      : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);
  };

  if (loading && !summary) {
    return <Spinner size="lg" label="Loading real-time inventory statistics..." className="py-20" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-950 dark:text-white">Operations Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Live inventory valuation and restocking alerts</p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Primary KPI Grid */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Catalog Products"
            value={summary.total_products}
            subtitle="Registered SKU items"
            icon={<Boxes className="w-5 h-5" />}
            variant="default"
          />

          <StatCard
            title="Total Stock On-Hand"
            value={`${summary.total_units_in_stock} Units`}
            subtitle="Physical inventory units"
            icon={<Layers className="w-5 h-5" />}
            variant="info"
          />

          <StatCard
            title="Inventory Valuation"
            value={formatCurrency(summary.total_inventory_cost_value)}
            subtitle="Valued at cost price"
            icon={<IndianRupee className="w-5 h-5" />}
            variant="default"
          />

          <StatCard
            title="Potential Profit"
            value={formatCurrency(summary.potential_profit)}
            subtitle={`Retail: ${formatCurrency(summary.total_inventory_retail_value)}`}
            icon={<TrendingUp className="w-5 h-5" />}
            variant="success"
          />
        </div>
      )}

      {/* Secondary KPI Bar */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-4 rounded-xl border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 sm:p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-amber-800 dark:text-amber-300">Low Stock Alerts</p>
                <p className="text-base sm:text-lg font-black text-amber-950 dark:text-amber-100">
                  {summary.low_stock_products_count} Products
                </p>
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400">Below Reorder Level</span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl border bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50 flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 sm:p-2.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 shrink-0">
                <XOctagon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-red-800 dark:text-red-300">Out of Stock</p>
                <p className="text-base sm:text-lg font-black text-red-950 dark:text-red-100">
                  {summary.out_of_stock_products_count} Products
                </p>
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-red-700 dark:text-red-400">Zero Inventory</span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 sm:p-2.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Active Suppliers</p>
                <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white">{summary.total_suppliers}</p>
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">Supply Chain Partners</span>
          </div>
        </div>
      )}

      {/* Critical Replenishment Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              Low Stock Replenishment Priority
            </h2>
          </div>
          <button
            onClick={onNavigateToProducts}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
          >
            View All Products &rarr;
          </button>
        </div>

        {lowStockItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">All products are healthy!</p>
            <p className="text-xs mt-1">No items currently below their reorder threshold.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-gray-800/60 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Reorder Level</th>
                  <th className="py-3 px-4 text-center">Deficit</th>
                  <th className="py-3 px-4 text-right">Quick Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {lowStockItems.map((item) => {
                  const isOut = item.current_stock === 0;
                  return (
                    <tr key={item.product_id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{item.name}</td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">{item.sku}</td>
                      <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400">
                        {item.category || <span className="text-gray-400 dark:text-gray-600">—</span>}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400">
                        {item.supplier_name || <span className="text-gray-400 dark:text-gray-600">Unassigned</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            isOut
                              ? 'bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300'
                              : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {item.current_stock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {item.reorder_level}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">
                          +{item.reorder_deficit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            onRestockProduct({
                              id: item.product_id,
                              name: item.name,
                              sku: item.sku,
                              supplier_id: item.supplier_id,
                              supplier_name: item.supplier_name,
                              category: item.category,
                              description: null,
                              cost_price: item.cost_price,
                              unit_price: item.unit_price,
                              current_stock: item.current_stock,
                              reorder_level: item.reorder_level,
                              created_at: '',
                              updated_at: '',
                            })
                          }
                          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
                        >
                          <PlusCircle className="w-3.5 h-3.5 mr-1" />
                          Stock In
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
