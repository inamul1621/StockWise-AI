import React from 'react';
import { Package, ShieldCheck, Sun, Moon, Menu, X, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  onQuickStockIn?: () => void;
  onQuickStockOut?: () => void;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onQuickStockIn,
  onQuickStockOut,
  isMobileMenuOpen,
  onToggleMobileMenu,
}) => {
  const { isDark, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors duration-150">
      <div className="px-3 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Mobile hamburger toggle */}
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo icon */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0">
            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-base sm:text-lg font-black tracking-tight text-gray-950 dark:text-white">
                StockWise
              </span>
              <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 rounded-md">
                v0.1.0
              </span>
            </div>
            <p className="hidden xs:block text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              Inventory & Operations Hub
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          {/* System status pill */}
          <div className="hidden lg:flex items-center space-x-2 text-xs font-semibold px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>FastAPI + PostgreSQL 18</span>
          </div>

          {/* Quick Stock In */}
          {onQuickStockIn && (
            <button
              onClick={onQuickStockIn}
              className="inline-flex items-center px-2 sm:px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
              title="Quick Stock In"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">+ Stock In</span>
              <span className="sm:hidden text-[11px]">In</span>
            </button>
          )}

          {/* Quick Stock Out */}
          {onQuickStockOut && (
            <button
              onClick={onQuickStockOut}
              className="inline-flex items-center px-2 sm:px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Quick Stock Out"
            >
              <ArrowUpRight className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">- Stock Out</span>
              <span className="sm:hidden text-[11px]">Out</span>
            </button>
          )}

          {/* Theme Switcher (Light / Dark) */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 sm:p-1 rounded-xl border border-gray-200 dark:border-gray-700/60 transition-colors">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                !isDark
                  ? 'bg-white text-gray-950 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
              title="Switch to Light mode"
              aria-label="Light mode"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                isDark
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
              title="Switch to Dark mode"
              aria-label="Dark mode"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Dark</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
