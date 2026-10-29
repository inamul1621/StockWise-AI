import React from 'react';
import { Package, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onQuickStockIn?: () => void;
  onQuickStockOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onQuickStockIn, onQuickStockOut }) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-tight text-gray-950">StockWise</span>
              <span className="text-xs font-bold px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded-md">
                v0.1.0
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Inventory & Operations Hub</p>
          </div>
        </div>

        {/* Action Buttons & Status */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-2 text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span>FastAPI + PostgreSQL</span>
          </div>

          {onQuickStockIn && (
            <button
              onClick={onQuickStockIn}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
            >
              + Stock In
            </button>
          )}

          {onQuickStockOut && (
            <button
              onClick={onQuickStockOut}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              - Stock Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
