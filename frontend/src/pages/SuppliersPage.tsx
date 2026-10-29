import React, { useState, useEffect } from 'react';
import { suppliersApi } from '../api/suppliers';
import { Supplier } from '../types/supplier';
import { Pagination } from '../components/common/Pagination';
import { Spinner } from '../components/common/Spinner';
import { Alert } from '../components/common/Alert';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Search,
  Mail,
  Phone,
  MapPin,
  Package,
} from 'lucide-react';
import { ApiClientError } from '../api/client';

interface SuppliersPageProps {
  onOpenCreateModal: () => void;
  onEditSupplier: (supplier: Supplier) => void;
}

export const SuppliersPage: React.FC<SuppliersPageProps> = ({
  onOpenCreateModal,
  onEditSupplier,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const size = 15;

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await suppliersApi.list({
        page,
        size,
        search: searchTerm.trim() || undefined,
      });
      setSuppliers(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err: any) {
      setError(err?.detail || 'Failed to fetch supplier list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSuppliers();
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!window.confirm(`Are you sure you want to delete supplier '${supplier.name}'?`)) {
      return;
    }
    setError(null);
    try {
      await suppliersApi.delete(supplier.id);
      setActionSuccess(`Successfully deleted supplier '${supplier.name}'.`);
      fetchSuppliers();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.detail);
      } else {
        setError('Failed to delete supplier.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-950 dark:text-white">Supplier Directory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage vendors, procurement contacts, and product distribution sources
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Supplier
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

      {/* Search */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by supplier name or contact person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-black dark:bg-brand-600 dark:hover:bg-brand-700 rounded-lg transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Suppliers Grid */}
      {loading ? (
        <Spinner size="md" label="Loading suppliers..." className="py-16" />
      ) : suppliers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No suppliers found.</p>
          <p className="text-xs mt-1">Register a vendor to connect your product inventory.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{s.name}</h3>
                        {s.contact_person && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.contact_person}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEditSupplier(s)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 rounded transition-colors"
                        title="Edit supplier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 rounded transition-colors"
                        title="Delete supplier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                    {s.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{s.email}</span>
                      </div>
                    )}
                    {s.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{s.phone}</span>
                      </div>
                    )}
                    {s.address && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{s.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <span className="flex items-center text-gray-500 dark:text-gray-400 font-medium">
                    <Package className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    Supplied Products
                  </span>
                  <span className="font-bold text-brand-700 dark:text-brand-300 px-2 py-0.5 bg-brand-50 dark:bg-brand-950/50 rounded-full">
                    {s.products_count} Items
                  </span>
                </div>
              </div>
            ))}
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
  );
};
