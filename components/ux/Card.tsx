import React from 'react';

/**
 * Card — consistent white surface container.
 *
 * Used as the standard "panel" wrapping tables, lists, forms, etc.
 * Provides consistent padding, border, radius and shadow.
 */
interface CardProps {
  children: React.ReactNode;
  /** Padding preset — default "md" (p-4 md:p-6) */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Removes the default background and shadow (transparent card) */
  bare?: boolean;
  /** Renders the card with reduced vertical padding */
  compact?: boolean;
  className?: string;
  /** ARIA role — e.g. "region" for a landmark */
  role?: string;
  /** Aria-label when role is region */
  'aria-label'?: string;
  id?: string;
}

const PADDING_CLASS = {
  none: '',
  sm: 'p-3 md:p-4',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
} as const;

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  bare = false,
  className = '',
  role,
  ...aria
}) => {
  const baseClass = bare
    ? ''
    : 'bg-white rounded-2xl shadow-sm border border-slate-100';
  return (
    <div
      className={`${baseClass} ${PADDING_CLASS[padding]} ${className}`}
      role={role}
      {...aria}
    >
      {children}
    </div>
  );
};

/** Sub-header inside a Card. */
export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, actions, className = '' }) => (
  <div
    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 ${className}`}
  >
    <div className="min-w-0">
      <h2 className="text-base md:text-lg font-bold text-slate-900 leading-tight truncate">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs md:text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);
