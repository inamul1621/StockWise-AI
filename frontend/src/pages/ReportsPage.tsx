import React, { useState, useEffect } from 'react';
import { reportsApi } from '../api/reports';
import { productsApi } from '../api/products';
import { InventoryReport, InventoryMovementsReport } from '../types/reports';
import { Product } from '../types/product';
import { StatCard } from '../components/common/StatCard';
import { Pagination } from '../components/common/Pagination';
import { Spinner } from '../components/common/Spinner';
import { Alert } from '../components/common/Alert';
import {
  BarChart3,
  ArrowLeftRight,
  DollarSign,
  TrendingUp,
  Boxes,
  Layers,
  Calendar,
  Filter,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'valuation' | 'movements'>('valuation');

  // Valuation Report State
  const [valuationData, setValuationData] = useState<InventoryReport | null>(null);
  const [valCategory, setValCategory] = useState('');
  const [valPage, setValPage] = useState(1);
  const valSize = 15;
  const [valLoading, setValLoading] = useState(false);
  const [valError, setValError] = useState<string | null>(null);

  // Movements Report State
  const [movementsData, setMovementsData] = useState<InventoryMovementsReport | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [movLoading, setMovLoading] = useState(false);
  const [movError, setMovError] = useState<string | null>(null);

  const [productsList, setProductsList] = useState<Product[]>([]);

  // Fetch product list for movements filter dropdown
  useEffect(() => {
    productsApi
      .list({ size: 100 })
      .then((res) => setProductsList(res.items))
      .catch(() => {});
  }, []);

  // Fetch Valuation Report
  const fetchValuationReport = async () => {
    setValLoading(true);
    setValError(null);
    try {
      const res = await reportsApi.getInventoryReport({
        page: valPage,
        size: valSize,
        category: valCategory.trim() || undefined,
      });
      setValuationData(res);
    } catch (err: any) {
      setValError(err?.detail || 'Failed to generate inventory valuation report.');
    } finally {
      setValLoading(false);
    }
  };

  // Fetch Movements Report
  const fetchMovementsReport = async () => {
    setMovLoading(true);
    setMovError(null);
    try {
      const res = await reportsApi.getInventoryMovements({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        product_id: selectedProductId === '' ? undefined : Number(selectedProductId),
      });
      setMovementsData(res);
    } catch (err: any) {
      setMovError(err?.detail || 'Failed to generate inventory movements report.');
    } finally {
      setMovLoading(false);
    }
  };

  useEffect(() => {
    if (activeReport === 'valuation') {
      fetchValuationReport();
    } else {
      fetchMovementsReport();
    }
  }, [activeReport, valPage]);

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num)
      ? '$0.00'
      : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-950">Inventory Reports & Analytics</h1>
          <p className="text-sm text-gray-500">
            Financial valuation breakdowns and movement volume tracking
          </p>
        </div>

        {/* Report Tab Selector */}
        <div className="inline-flex rounded-xl bg-gray-200 p-1">
          <button
            onClick={() => setActiveReport('valuation')}
            className={`flex items-center px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeReport === 'valuation'
                ? 'bg-white text-gray-950 shadow-sm'
                : 'text-gray-600 hover:text-gray-950'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-1.5 text-brand-600" />
            Stock Valuation
          </button>
          <button
            onClick={() => setActiveReport('movements')}
            className={`flex items-center px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeReport === 'movements'
                ? 'bg-white text-gray-950 shadow-sm'
                : 'text-gray-600 hover:text-gray-950'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 mr-1.5 text-brand-600" />
            Movements Summary
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: VALUATION REPORT */}
      {/* ========================================================================= */}
      {activeReport === 'valuation' && (
        <div className="space-y-6">
          {valError && <Alert type="error" message={valError} onClose={() => setValError(null)} />}

          {/* KPI Cards */}
          {valuationData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Matching Products"
                value={valuationData.total_products}
                subtitle={`${valuationData.total_units_in_stock} total units`}
                icon={<Boxes className="w-5 h-5" />}
              />
              <StatCard
                title="Total Cost Valuation"
                value={formatCurrency(valuationData.total_inventory_cost_value)}
                subtitle="Calculated: stock * cost price"
                icon={<DollarSign className="w-5 h-5" />}
              />
              <StatCard
                title="Total Retail Valuation"
                value={formatCurrency(valuationData.total_inventory_retail_value)}
                subtitle="Calculated: stock * selling price"
                icon={<Layers className="w-5 h-5" />}
              />
              <StatCard
                title="Potential Gross Profit"
                value={formatCurrency(valuationData.total_potential_profit)}
                subtitle="Retail value - Cost value"
                icon={<TrendingUp className="w-5 h-5" />}
                variant="success"
              />
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-semibold text-gray-700">Filter Category:</span>
              <input
                type="text"
                placeholder="e.g. Electronics, Tools"
                value={valCategory}
                onChange={(e) => setValCategory(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 font-medium"
              />
              <button
                onClick={() => {
                  setValPage(1);
                  fetchValuationReport();
                }}
                className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white font-semibold rounded-lg transition-colors"
              >
                Apply
              </button>
            </div>

            <button
              onClick={fetchValuationReport}
              disabled={valLoading}
              className="inline-flex items-center px-3 py-1.5 font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${valLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Itemized Valuation Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {valLoading ? (
              <Spinner size="md" label="Calculating valuation report..." className="py-16" />
            ) : !valuationData || valuationData.items.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p className="text-sm font-semibold text-gray-700">No products found.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4 text-center">Stock</th>
                        <th className="py-3 px-4 text-right">Cost Price</th>
                        <th className="py-3 px-4 text-right">Selling Price</th>
                        <th className="py-3 px-4 text-right">Total Cost Value</th>
                        <th className="py-3 px-4 text-right">Total Retail Value</th>
                        <th className="py-3 px-4 text-right">Profit Potential</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {valuationData.items.map((item) => (
                        <tr key={item.product_id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 font-semibold text-gray-900">{item.name}</td>
                          <td className="py-3 px-4 font-mono text-xs text-gray-600">{item.sku}</td>
                          <td className="py-3 px-4 text-center font-black">{item.current_stock}</td>
                          <td className="py-3 px-4 text-right font-medium text-gray-600">
                            {formatCurrency(item.cost_price)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-gray-800">
                            {formatCurrency(item.total_cost_value)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900">
                            {formatCurrency(item.total_retail_value)}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-brand-700">
                            {formatCurrency(item.potential_profit)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.stock_status === 'OUT_OF_STOCK' ? (
                              <span className="px-2 py-0.5 text-[11px] font-bold bg-red-100 text-red-700 rounded-full">
                                Out of Stock
                              </span>
                            ) : item.stock_status === 'LOW_STOCK' ? (
                              <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-700 rounded-full">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[11px] font-bold bg-green-100 text-green-700 rounded-full">
                                In Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={valPage}
                  pages={valuationData.pages}
                  total={valuationData.total}
                  size={valSize}
                  onPageChange={setValPage}
                  disabled={valLoading}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: MOVEMENTS REPORT */}
      {/* ========================================================================= */}
      {activeReport === 'movements' && (
        <div className="space-y-6">
          {movError && <Alert type="error" message={movError} onClose={() => setMovError(null)} />}

          {/* Date & Filter Controls */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center space-x-1.5 text-gray-500 font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>Date Range:</span>
            </div>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500"
            />

            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : '')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 font-medium"
            >
              <option value="">All Catalog Products</option>
              {productsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>

            <button
              onClick={fetchMovementsReport}
              disabled={movLoading}
              className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white font-semibold rounded-lg transition-colors"
            >
              Filter Movements
            </button>
          </div>

          {/* Movements Summary KPI Bar */}
          {movementsData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Units Inflow"
                value={`+${movementsData.total_units_in} Units`}
                subtitle={`${movementsData.total_in_transactions} stock-in records`}
                icon={<ArrowDownLeft className="w-5 h-5 text-green-600" />}
                variant="success"
              />
              <StatCard
                title="Units Outflow"
                value={`-${movementsData.total_units_out} Units`}
                subtitle={`${movementsData.total_out_transactions} stock-out records`}
                icon={<ArrowUpRight className="w-5 h-5 text-red-600" />}
                variant="danger"
              />
              <StatCard
                title="Net Inventory Change"
                value={`${movementsData.net_units_change > 0 ? '+' : ''}${movementsData.net_units_change} Units`}
                subtitle="Inflow minus Outflow"
                icon={<ArrowLeftRight className="w-5 h-5" />}
                variant={movementsData.net_units_change >= 0 ? 'success' : 'warning'}
              />
              <StatCard
                title="Audited Products"
                value={`${movementsData.product_breakdowns.length} Products`}
                subtitle="With movements in range"
                icon={<Boxes className="w-5 h-5" />}
              />
            </div>
          )}

          {/* Product Movement Breakdown Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Movement Breakdown by Product
              </h3>
            </div>

            {movLoading ? (
              <Spinner size="md" label="Aggregating movement records..." className="py-16" />
            ) : !movementsData || movementsData.product_breakdowns.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p className="text-sm font-semibold text-gray-700">No transactions recorded in this period.</p>
                <p className="text-xs mt-1">Try widening your date range.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4 text-center">Units In (+)</th>
                      <th className="py-3 px-4 text-center">Units Out (-)</th>
                      <th className="py-3 px-4 text-center">Net Unit Change</th>
                      <th className="py-3 px-4 text-right">Transactions Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {movementsData.product_breakdowns.map((b) => (
                      <tr key={b.product_id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-gray-900">{b.product_name}</td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-600">{b.product_sku}</td>
                        <td className="py-3 px-4 text-center font-bold text-green-700">
                          +{b.units_in}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-red-700">
                          -{b.units_out}
                        </td>
                        <td className="py-3 px-4 text-center font-black">
                          <span
                            className={
                              b.net_movement > 0
                                ? 'text-green-700'
                                : b.net_movement < 0
                                ? 'text-red-700'
                                : 'text-gray-600'
                            }
                          >
                            {b.net_movement > 0 ? `+${b.net_movement}` : b.net_movement}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-600">
                          {b.transaction_count} tx
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
