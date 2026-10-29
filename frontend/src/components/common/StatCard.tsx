import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'bg-white border-gray-200 text-gray-900',
    success: 'bg-green-50/60 border-green-200 text-green-950',
    warning: 'bg-amber-50/60 border-amber-200 text-amber-950',
    danger: 'bg-red-50/60 border-red-200 text-red-950',
    info: 'bg-blue-50/60 border-blue-200 text-blue-950',
  }[variant];

  const iconStyles = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  }[variant];

  return (
    <div className={`p-5 rounded-xl border shadow-sm transition-all hover:shadow-md ${variantStyles}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
          <p className="text-2xl font-black">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${iconStyles}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
