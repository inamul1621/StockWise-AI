import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white',
    success: 'bg-green-50/60 dark:bg-green-950/20 border-green-200 dark:border-green-800/50 text-green-950 dark:text-green-300',
    warning: 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 text-amber-950 dark:text-amber-300',
    danger: 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-800/50 text-red-950 dark:text-red-300',
    info: 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50 text-blue-950 dark:text-blue-300',
  }[variant];

  const iconStyles = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
    success: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
    warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
    danger: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
    info: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  }[variant];

  return (
    <div className={`p-4 sm:p-5 rounded-xl border shadow-xs transition-all hover:shadow-md ${variantStyles}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1 min-w-0 pr-2">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
            {title}
          </p>
          <p className="text-xl sm:text-2xl font-black tracking-tight truncate">{value}</p>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${iconStyles}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
