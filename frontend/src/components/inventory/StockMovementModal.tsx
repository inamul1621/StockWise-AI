import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Alert } from '../common/Alert';
import { inventoryApi } from '../../api/inventory';
import { productsApi } from '../../api/products';
import { Product } from '../../types/product';
import { TransactionType, InventoryTransaction } from '../../types/inventory';
import { ApiClientError } from '../../api/client';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  selectedProduct?: Product | null;
  onSuccess: (transaction: InventoryTransaction) => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'IN',
  selectedProduct,
  onSuccess,
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [productId, setProductId] = useState<number | ''>(selectedProduct?.id || '');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [activeProduct, setActiveProduct] = useState<Product | null>(selectedProduct || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setType(defaultType);
    if (selectedProduct) {
      setProductId(selectedProduct.id);
      setActiveProduct(selectedProduct);
    } else {
      setProductId('');
      setActiveProduct(null);
    }
    setQuantity(1);
    setReference('');
    setReason('');
    setNotes('');
    setError(null);
    setSuccessMsg(null);
  }, [isOpen, defaultType, selectedProduct]);

  // Load products list if not pre-selected
  useEffect(() => {
    if (isOpen && !selectedProduct) {
      productsApi
        .list({ size: 100 })
        .then((res) => setProducts(res.items))
        .catch(() => {});
    }
  }, [isOpen, selectedProduct]);

  // When productId changes, update activeProduct to show current stock
  const handleProductSelect = (idStr: string) => {
    if (!idStr) {
      setProductId('');
      setActiveProduct(null);
      return;
    }
    const id = Number(idStr);
    setProductId(id);
    const found = products.find((p) => p.id === id);
    if (found) {
      setActiveProduct(found);
    } else {
      productsApi.getById(id).then(setActiveProduct).catch(() => {});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!productId) {
      setError('Please select a product.');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (type === 'OUT' && activeProduct && activeProduct.current_stock < Number(quantity)) {
      setError(
        `Insufficient stock! Product '${activeProduct.name}' currently has ${activeProduct.current_stock} units available, but you requested to remove ${quantity} units.`
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        product_id: Number(productId),
        quantity: Number(quantity),
        reference: reference.trim() || null,
        reason: reason.trim() || null,
        notes: notes.trim() || null,
      };

      const tx =
        type === 'IN'
          ? await inventoryApi.stockIn(payload)
          : await inventoryApi.stockOut(payload);

      setSuccessMsg(
        `Successfully recorded stock ${type === 'IN' ? 'addition' : 'reduction'} for ${tx.product_name}. New balance: ${tx.current_stock_after} units.`
      );

      setTimeout(() => {
        onSuccess(tx);
        onClose();
      }, 1200);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.detail);
      } else {
        setError('Failed to record stock movement.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'IN' ? 'Stock In (Receive Inventory)' : 'Stock Out (Dispatch Inventory)'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle Type buttons */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setType('IN')}
            className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-md transition-all ${
              type === 'IN'
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 mr-1 text-green-600" />
            Stock In (+)
          </button>
          <button
            type="button"
            onClick={() => setType('OUT')}
            className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-md transition-all ${
              type === 'OUT'
                ? 'bg-white text-red-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 mr-1 text-red-600" />
            Stock Out (-)
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {successMsg && <Alert type="success" message={successMsg} />}

        {/* Product selector */}
        <div>
          <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
            Target Product *
          </label>
          {selectedProduct ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="font-semibold text-sm text-gray-900">{selectedProduct.name}</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">SKU: {selectedProduct.sku}</p>
            </div>
          ) : (
            <select
              required
              value={productId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="">-- Select a product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (SKU: {p.sku}) — Stock: {p.current_stock}
                </option>
              ))}
            </select>
          )}

          {activeProduct && (
            <div className="mt-2 text-xs flex items-center justify-between px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-md">
              <span className="text-brand-900 font-medium">Current Stock Balance:</span>
              <span className="font-black text-brand-700">{activeProduct.current_stock} units</span>
            </div>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
            Quantity (Units) *
          </label>
          <input
            type="number"
            min="1"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
            placeholder="e.g. 25"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
              Reference
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PO-9988, INV-201"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={type === 'IN' ? 'e.g. Supplier delivery' : 'e.g. Retail sale, damage'}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
            Internal Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes for audit tracking..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 ${
              type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? 'Processing...' : type === 'IN' ? 'Confirm Stock In' : 'Confirm Stock Out'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
