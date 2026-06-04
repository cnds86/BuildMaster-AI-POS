import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
  /** When true, renders with a smaller footprint (useful inside table rows) */
  compact?: boolean;
}

/**
 * Empty-state placeholder.
 * Use whenever a list/grid is empty: "No sales yet", "No products found", etc.
 * Replaces the ad-hoc "no data" <div> that was duplicated across pages.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = '',
  compact = false,
}) => {
  const buttonClass =
    action?.variant === 'secondary'
      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      : 'bg-slate-900 text-white hover:bg-slate-800';

  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-8' : 'py-16 px-4'
      } ${className}`}
    >
      <div
        className={`${
          compact ? 'w-12 h-12' : 'w-16 h-16'
        } bg-slate-100 rounded-full flex items-center justify-center mb-4`}
        aria-hidden="true"
      >
        <Icon
          className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-slate-400`}
        />
      </div>
      <h3
        className={`font-semibold text-slate-700 ${
          compact ? 'text-sm' : 'text-base'
        }`}
      >
        {title}
      </h3>
      {description && (
        <p
          className={`text-slate-500 mt-1 max-w-sm ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={`mt-4 px-4 py-2 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${buttonClass}`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
