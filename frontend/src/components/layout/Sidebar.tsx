import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  Truck,
  BarChart3,
  AlertTriangle,
  X,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'products' | 'inventory' | 'suppliers' | 'reports';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  lowStockCount?: number;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  lowStockCount = 0,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge: lowStockCount > 0 ? (
        <span className="flex items-center text-[10px] font-bold px-1.5 py-0.5 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 rounded-full">
          <AlertTriangle className="w-3 h-3 mr-0.5" />
          {lowStockCount}
        </span>
      ) : null,
    },
    {
      id: 'products' as NavTab,
      label: 'Products',
      icon: <Boxes className="w-5 h-5" />,
    },
    {
      id: 'inventory' as NavTab,
      label: 'Stock Movements',
      icon: <ArrowLeftRight className="w-5 h-5" />,
    },
    {
      id: 'suppliers' as NavTab,
      label: 'Suppliers',
      icon: <Truck className="w-5 h-5" />,
    },
    {
      id: 'reports' as NavTab,
      label: 'Reports & Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
    },
  ];

  const handleItemClick = (id: NavTab) => {
    onTabChange(id);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="p-4 space-y-1">
        <div className="flex items-center justify-between md:hidden pb-3 mb-2 border-b border-gray-100 dark:border-gray-800">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Navigation Menu
          </span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="hidden md:block px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
          Navigation
        </p>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={
                    isActive
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400 space-y-1">
        <p className="font-semibold text-gray-700 dark:text-gray-300">StockWise Core Engine</p>
        <p>PostgreSQL 18 Atomic Ledger</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col shrink-0 min-h-[calc(100vh-4rem)] transition-colors duration-150">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sliding Drawer */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </div>
    </>
  );
};
