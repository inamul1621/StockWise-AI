import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

interface AlertProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  const styles = {
    error: {
      bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-850 dark:text-red-300',
      icon: <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50 text-green-850 dark:text-green-300',
      icon: <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-850 dark:text-amber-300',
      icon: <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />,
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-850 dark:text-blue-300',
      icon: <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />,
    },
  }[type];

  return (
    <div className={`p-3.5 sm:p-4 border rounded-xl flex items-start justify-between shadow-2xs ${styles.bg} ${className}`}>
      <div className="flex items-start space-x-3">
        {styles.icon}
        <div>
          {title && <h4 className="font-semibold text-sm mb-0.5">{title}</h4>}
          <p className="text-xs sm:text-sm leading-relaxed">{message}</p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
