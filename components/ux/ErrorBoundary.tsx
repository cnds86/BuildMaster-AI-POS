import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional fallback render — receives the error and a reset fn */
  fallback?: (err: Error, reset: () => void) => React.ReactNode;
  /** Wrap a small subtree; otherwise the boundary fills the screen */
  inline?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches uncaught render errors so a single broken component
 * doesn't white-screen the whole POS app. Critical for a 24/7
 * cash-register system — a crash during a sale is unacceptable.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production this would ship to Sentry / similar.
    // For now we log so the operator sees it in the console.
    console.error('[ErrorBoundary] Uncaught render error:', error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children;
    }
    if (this.props.fallback) {
      return this.props.fallback(this.state.error, this.reset);
    }

    if (this.props.inline) {
      return (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 text-sm">
              This section failed to load
            </h3>
            <p className="text-red-700 text-xs mt-0.5 break-words">
              {this.state.error.message}
            </p>
            <button
              type="button"
              onClick={this.reset}
              className="mt-2 inline-flex items-center gap-1 text-xs text-red-700 hover:text-red-900 font-medium"
            >
              <RefreshCw className="w-3 h-3" aria-hidden="true" /> Try again
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-[9999] bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-slate-600 text-sm mb-4">
            The app hit an unexpected error. Reload to recover, or try the
            button below to retry the failed section.
          </p>
          <p className="text-xs text-slate-500 bg-slate-50 rounded p-2 mb-6 font-mono break-words">
            {this.state.error.message}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors"
            >
              Reload app
            </button>
            <button
              type="button"
              onClick={this.reset}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
}
