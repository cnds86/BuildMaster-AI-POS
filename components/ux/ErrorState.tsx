import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  /** Optional: error details to display in a collapsible block (e.g. stack trace) */
  details?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

/**
 * Generic error-state placeholder.
 * Use when a data fetch fails, a query errors out, or an async op throws.
 * Replaces the ad-hoc "red box" errors that were scattered across pages.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We could not load this data. Please try again.',
  details,
  onRetry,
  className = '',
  compact = false,
}) => {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-6 px-3' : 'py-12 px-4'
      } bg-red-50/50 border border-red-100 rounded-xl ${
        compact ? 'my-2' : 'my-4'
      } ${className}`}
    >
      <div
        className={`${
          compact ? 'w-10 h-10' : 'w-14 h-14'
        } bg-red-100 rounded-full flex items-center justify-center mb-3`}
        aria-hidden="true"
      >
        <AlertTriangle
          className={`${compact ? 'w-5 h-5' : 'w-7 h-7'} text-red-600`}
        />
      </div>
      <h3
        className={`font-semibold text-red-900 ${
          compact ? 'text-sm' : 'text-base'
        }`}
      >
        {title}
      </h3>
      {message && (
        <p
          className={`text-red-700 mt-1 max-w-md ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          {message}
        </p>
      )}
      {details && (
        <details className="mt-3 text-left w-full max-w-md">
          <summary className="text-xs text-red-600 cursor-pointer hover:underline">
            Show details
          </summary>
          <pre className="mt-2 p-3 bg-white border border-red-100 rounded text-xs text-red-800 overflow-auto max-h-40">
            {details}
          </pre>
        </details>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
};
