import React from 'react';
import { Loader2 } from 'lucide-react';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  label?: string;
  /** Render as full-screen overlay (good for route transitions / page-level loading) */
  fullscreen?: boolean;
  /** When true, includes a polite live-region announcement for screen readers */
  announce?: boolean;
  className?: string;
}

const SIZE_CLASS: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const LABEL_SIZE: Record<SpinnerSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

/**
 * Accessible loading spinner.
 * - Uses aria-busy / role="status" for screen readers
 * - Honors prefers-reduced-motion (the CSS animation naturally does, but
 *   we also stop the icon from spinning when the user has reduced motion)
 * - Two layout modes: inline (default) and fullscreen
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  fullscreen = false,
  announce = true,
  className = '',
}) => {
  const spinner = (
    <Loader2
      className={`${SIZE_CLASS[size]} text-slate-500 motion-reduce:animate-none ${className}`}
      aria-hidden="true"
    />
  );

  if (fullscreen) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live={announce ? 'polite' : 'off'}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm"
      >
        {spinner}
        {label && (
          <p className={`mt-3 text-slate-600 font-medium ${LABEL_SIZE[size]}`}>{label}</p>
        )}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live={announce ? 'polite' : 'off'}
      className="inline-flex items-center gap-2"
    >
      {spinner}
      {label && <span className={`text-slate-600 ${LABEL_SIZE[size]}`}>{label}</span>}
    </div>
  );
};
