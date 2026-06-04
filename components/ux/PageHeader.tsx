import React from 'react';

/**
 * PageHeader — consistent responsive page title block.
 *
 * Mobile: stacks title and action buttons vertically with horizontal
 * scroll for the action bar.
 * Desktop: title on the left, actions on the right.
 *
 * Usage:
 *   <PageHeader
 *     title="Inventory"
 *     subtitle="Manage your products"
 *     actions={<Button>+ Add product</Button>}
 *   />
 */
interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Optional icon rendered to the left of the title */
  icon?: React.ReactNode;
  /** Action buttons / controls. Wraps and scrolls horizontally on mobile. */
  actions?: React.ReactNode;
  /** Tighter bottom margin (e.g. for content directly under the header) */
  compact?: boolean;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  compact = false,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 ${
        compact ? 'mb-3 md:mb-4' : 'mb-4 md:mb-6'
      } ${className}`}
    >
      <div className="min-w-0 flex items-start md:items-center gap-3">
        {icon && (
          <div className="shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 -mx-1 px-1 scrollbar-hide shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
