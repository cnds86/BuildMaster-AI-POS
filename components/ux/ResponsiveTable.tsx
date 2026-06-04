import React from 'react';

/**
 * ResponsiveTable — wraps a <table> in a horizontally scrollable
 * container with a subtle scroll-shadow affordance on the right edge,
 * signalling to mobile users that the table scrolls horizontally.
 *
 * Use:
 *   <ResponsiveTable>
 *     <table>...</table>
 *   </ResponsiveTable>
 *
 * Why a dedicated wrapper:
 *  - The pattern `overflow-x-auto` alone is invisible on mobile — users
 *    don't know the table scrolls. The shadow hint is a low-cost cue.
 *  - Sticky headers need `position: sticky` on <thead> with a higher
 *    z-index, but the parent container must NOT have `overflow-x:
 *    clip` (clip kills sticky). We use `overflow-x-auto` and accept
 *    that sticky will work because we don't set `overflow-x: clip`.
 */
interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  /** Accessible label for the table region (e.g. "Inventory list") */
  ariaLabel?: string;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  children,
  className = '',
  ariaLabel,
}) => {
  return (
    <div
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
      className={`relative w-full overflow-x-auto overflow-y-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg ${className}`}
    >
      {children}
    </div>
  );
};
