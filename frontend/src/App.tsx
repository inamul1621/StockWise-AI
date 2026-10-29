import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProductFormModal } from './components/products/ProductFormModal';
import { StockMovementModal } from './components/inventory/StockMovementModal';
import { SupplierFormModal } from './components/suppliers/SupplierFormModal';
import { Product } from './types/product';
import { Supplier } from './types/supplier';
import { TransactionType } from './types/inventory';
import { dashboardApi } from './api/dashboard';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  // Modal States
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockModalType, setStockModalType] = useState<TransactionType>('IN');
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);

  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Key to force refresh page data on updates
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh low stock badge counter
  const fetchBadgeCounter = async () => {
    try {
      const summary = await dashboardApi.getSummary();
      setLowStockCount(summary.low_stock_products_count);
    } catch {}
  };

  useEffect(() => {
    fetchBadgeCounter();
  }, [refreshKey]);

  // Handlers
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductModalOpen(true);
  };

  const handleOpenStockMovement = (
    type: TransactionType = 'IN',
    product: Product | null = null
  ) => {
    setStockModalType(type);
    setStockModalProduct(product);
    setStockModalOpen(true);
  };

  const handleOpenCreateSupplier = () => {
    setEditingSupplier(null);
    setSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierModalOpen(true);
  };

  const handleMutationSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900 font-sans">
      {/* Top Bar */}
      <Navbar
        onQuickStockIn={() => handleOpenStockMovement('IN')}
        onQuickStockOut={() => handleOpenStockMovement('OUT')}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          lowStockCount={lowStockCount}
        />

        {/* Main Content View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardPage
                key={refreshKey}
                onRestockProduct={(p) => handleOpenStockMovement('IN', p)}
                onNavigateToProducts={() => setActiveTab('products')}
              />
            )}

            {activeTab === 'products' && (
              <ProductsPage
                key={refreshKey}
                onOpenCreateModal={handleOpenCreateProduct}
                onEditProduct={handleOpenEditProduct}
                onStockMovement={(p, type) => handleOpenStockMovement(type, p)}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryPage
                key={refreshKey}
                onOpenStockMovement={(type) => handleOpenStockMovement(type)}
              />
            )}

            {activeTab === 'suppliers' && (
              <SuppliersPage
                key={refreshKey}
                onOpenCreateModal={handleOpenCreateSupplier}
                onEditSupplier={handleOpenEditSupplier}
              />
            )}

            {activeTab === 'reports' && <ReportsPage key={refreshKey} />}
          </div>
        </main>
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        product={editingProduct}
        onSuccess={handleMutationSuccess}
      />

      {/* Stock Movement Modal */}
      <StockMovementModal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        defaultType={stockModalType}
        selectedProduct={stockModalProduct}
        onSuccess={handleMutationSuccess}
      />

      {/* Supplier Form Modal */}
      <SupplierFormModal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        supplier={editingSupplier}
        onSuccess={handleMutationSuccess}
      />
    </div>
  );
};
