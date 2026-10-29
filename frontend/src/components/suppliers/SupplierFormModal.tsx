import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Alert } from '../common/Alert';
import { suppliersApi } from '../../api/suppliers';
import { Supplier, SupplierCreate, SupplierUpdate } from '../../types/supplier';
import { ApiClientError } from '../../api/client';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
  onSuccess: () => void;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onSuccess,
}) => {
  const isEditing = Boolean(supplier);

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supplier) {
      setName(supplier.name);
      setContactPerson(supplier.contact_person || '');
      setEmail(supplier.email || '');
      setPhone(supplier.phone || '');
      setAddress(supplier.address || '');
    } else {
      setName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setAddress('');
    }
    setError(null);
  }, [supplier, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEditing && supplier) {
        const updatePayload: SupplierUpdate = {
          name: name.trim(),
          contact_person: contactPerson.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
        };
        await suppliersApi.update(supplier.id, updatePayload);
      } else {
        const createPayload: SupplierCreate = {
          name: name.trim(),
          contact_person: contactPerson.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
        };
        await suppliersApi.create(createPayload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.detail);
      } else {
        setError('Failed to save supplier.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Supplier: ${supplier?.name}` : 'Add New Supplier'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <div>
          <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">
            Supplier / Company Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Apex Industrial Supplies"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">
            Contact Person
          </label>
          <input
            type="text"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="e.g. John Doe (Account Manager)"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="orders@apexsupplies.com"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1-555-0199"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1">
            Office / Warehouse Address
          </label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Logistics Way, Suite 400..."
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
            {loading ? 'Saving...' : isEditing ? 'Update Supplier' : 'Create Supplier'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
