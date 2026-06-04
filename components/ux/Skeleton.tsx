import React from 'react';

interface SkeletonProps {
  className?: string;
  /** When true, the skeleton is rounded-full (good for avatars, badges) */
  rounded?: 'full' | 'md' | 'lg' | 'xl' | 'none';
}

/**
 * Base skeleton block. Use for content placeholders during loading.
 * Combines with a subtle pulse animation, respects prefers-reduced-motion.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', rounded = 'md' }) => {
  const radiusClass = {
    none: '',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      aria-hidden="true"
      className={`bg-slate-200 motion-reduce:animate-none animate-pulse ${radiusClass} ${className}`}
    />
  );
};

/** Pre-built skeleton row for table cells — lines up with standard table padding. */
export const SkeletonRow: React.FC<{ columns?: number; className?: string }> = ({
  columns = 4,
  className = '',
}) => {
  return (
    <tr className={className} aria-hidden="true">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton
            className={`h-4 ${i === 0 ? 'w-3/4' : i === columns - 1 ? 'w-1/2 ml-auto' : 'w-full'}`}
          />
        </td>
      ))}
    </tr>
  );
};

/** Skeleton block for card-style loading. */
export const SkeletonCard: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`bg-white rounded-xl border border-slate-200 p-6 shadow-sm ${className}`}
    >
      <Skeleton className="h-5 w-1/3 mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 mb-2 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
};
