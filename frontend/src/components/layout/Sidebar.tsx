import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  Truck,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'products' | 'inventory' | 'suppliers' | 'reports';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  lowStockCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge: lowStockCount > 0 ? (
        <span className="flex items-center text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">
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

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isActive ? 'text-brand-600' : 'text-gray-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge}
            </button>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t border-gray-100 text-[11px] text-gray-500 space-y-1">
        <p className="font-semibold text-gray-700">StockWise Core Engine</p>
        <p>PostgreSQL 18 Atomic Ledger</p>
      </div>
    </aside>
  );
};
