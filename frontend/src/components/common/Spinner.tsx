import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', label = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <div
        className={`${sizeClasses} border-brand-500 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label={label}
      />
      {label && <span className="mt-2 text-sm text-gray-500 dark:text-gray-400">{label}</span>}
    </div>
  );
};
