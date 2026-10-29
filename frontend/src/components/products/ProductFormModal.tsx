import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Alert } from '../common/Alert';
import { productsApi } from '../../api/products';
import { suppliersApi } from '../../api/suppliers';
import { Product, ProductCreate, ProductUpdate } from '../../types/product';
import { Supplier } from '../../types/supplier';
import { ApiClientError } from '../../api/client';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSuccess: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const isEditing = Boolean(product);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState('0.00');
  const [unitPrice, setUnitPrice] = useState('0.00');
  const [reorderLevel, setReorderLevel] = useState(10);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load suppliers for dropdown
  useEffect(() => {
    if (isOpen) {
      suppliersApi
        .list({ size: 100 })
        .then((res) => setSuppliers(res.items))
        .catch(() => {});
    }
  }, [isOpen]);

  // Populate form if editing
  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setSupplierId(product.supplier_id || '');
      setCategory(product.category || '');
      setDescription(product.description || '');
      setCostPrice(product.cost_price || '0.00');
      setUnitPrice(product.unit_price || '0.00');
      setReorderLevel(product.reorder_level || 10);
    } else {
      setName('');
      setSku('');
      setSupplierId('');
      setCategory('');
      setDescription('');
      setCostPrice('0.00');
      setUnitPrice('0.00');
      setReorderLevel(10);
    }
    setError(null);
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEditing && product) {
        const updatePayload: ProductUpdate = {
          name: name.trim(),
          supplier_id: supplierId === '' ? null : Number(supplierId),
          category: category.trim() || null,
          description: description.trim() || null,
          cost_price: costPrice,
          unit_price: unitPrice,
          reorder_level: Number(reorderLevel),
        };
        await productsApi.update(product.id, updatePayload);
      } else {
        const createPayload: ProductCreate = {
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          supplier_id: supplierId === '' ? null : Number(supplierId),
          category: category.trim() || null,
          description: description.trim() || null,
          cost_price: costPrice,
          unit_price: unitPrice,
          reorder_level: Number(reorderLevel),
        };
        await productsApi.create(createPayload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.detail);
      } else {
        setError('Failed to save product. Please check your inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Product: ${product?.name}` : 'Register New Product'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ergonomic Office Chair"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">
              SKU (Stock Keeping Unit) *
            </label>
            <input
              type="text"
              required
              disabled={isEditing}
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="e.g. CHAIR-ERG-01"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 dark:disabled:bg-gray-800/60 disabled:text-gray-500 dark:disabled:text-gray-400 uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Furniture"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">
              Primary Supplier
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="">None / Unassigned</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">
              Cost Price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Acquisition unit cost</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">
              Retail Price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Selling price</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">
              Reorder Level *
            </label>
            <input
              type="number"
              min="0"
              required
              value={reorderLevel}
              onChange={(e) => setReorderLevel(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Low-stock alert threshold</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional product details or internal notes..."
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
