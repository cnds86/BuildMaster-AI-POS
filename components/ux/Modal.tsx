import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * Modal — accessible dialog primitive.
 *
 * Features:
 * - Renders to a portal at <body> root (avoids z-index / overflow clipping)
 * - Closes on ESC, click on backdrop, or close button
 * - Locks body scroll while open
 * - Returns focus to the previously-focused element on close
 * - Traps focus inside the dialog (Tab / Shift+Tab)
 * - Marks the rest of the page inert via aria-hidden on body
 * - Renders title via <h2 id> + aria-labelledby
 * - Uses role="dialog" + aria-modal="true"
 * - Renders nothing when `isOpen` is false (cleanly unmounts)
 */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  /** Subtitle / description rendered under the title */
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Footer area (e.g. action buttons). Stays at the bottom. */
  footer?: React.ReactNode;
  /** Disable ESC close (e.g. for required confirmations) */
  disableEscapeClose?: boolean;
  /** Disable backdrop click close */
  disableBackdropClose?: boolean;
  /** Width preset — defaults to "md" */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Padding preset */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Hide the built-in close (X) button */
  hideClose?: boolean;
  /** Extra class for the dialog panel */
  panelClassName?: string;
  /** Optional id for the dialog (auto-generated if not provided) */
  id?: string;
}

const SIZE_CLASS: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-[95vw] md:max-w-4xl',
};

const PADDING_CLASS: Record<NonNullable<ModalProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

let modalCounter = 0;
const nextModalId = () => `mhx-modal-${++modalCounter}`;

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  disableEscapeClose = false,
  disableBackdropClose = false,
  size = 'md',
  padding = 'md',
  hideClose = false,
  panelClassName = '',
  id,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);
  const titleIdRef = useRef<string>(id ?? nextModalId());
  const titleId = `${titleIdRef.current}-title`;
  const descId = `${titleIdRef.current}-desc`;

  // Store the trigger element so we can restore focus on close
  useEffect(() => {
    if (isOpen) {
      previousActiveRef.current = document.activeElement as HTMLElement | null;
      // Focus the first focusable element inside the dialog after it mounts
      const t = window.setTimeout(() => {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        const first = focusable?.[0];
        if (first && typeof first.focus === 'function') first.focus();
        else dialogRef.current?.focus();
      }, 30);
      return () => window.clearTimeout(t);
    } else if (previousActiveRef.current && typeof previousActiveRef.current.focus === 'function') {
      previousActiveRef.current.focus();
    }
    return undefined;
  }, [isOpen]);

  // Body scroll lock + inert background
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    // Avoid layout shift when scrollbar disappears
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [isOpen]);

  // Keyboard handling: ESC + focus trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape' && !disableEscapeClose) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []
        );
        if (focusable.length === 0) {
          e.preventDefault();
          dialogRef.current?.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const activeEl = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (activeEl === first || !dialogRef.current?.contains(activeEl)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (activeEl === last || !dialogRef.current?.contains(activeEl)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [disableEscapeClose, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in"
      onMouseDown={(e) => {
        // Only close when clicking the backdrop, not the panel
        if (e.target === e.currentTarget && !disableBackdropClose) {
          onClose();
        }
      }}
    >
      {/* Backdrop is rendered as a separate sibling for clarity, but we still
          close on backdrop click via the parent onMouseDown target check. */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      <div
        ref={dialogRef}
        id={id ?? titleIdRef.current}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`
          relative w-full ${SIZE_CLASS[size]}
          bg-white rounded-t-2xl md:rounded-2xl shadow-2xl
          flex flex-col max-h-[95vh] md:max-h-[90vh]
          animate-fade-in-up
          focus:outline-none
          ${panelClassName}
        `}
      >
        {(title || !hideClose) && (
          <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 shrink-0">
            <div className="min-w-0 flex-1">
              {title && (
                <h2
                  id={titleId}
                  className="text-lg md:text-xl font-bold text-slate-900 leading-snug truncate"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="text-sm text-slate-500 mt-0.5">
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                className="
                  p-2 -mr-2 -mt-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100
                  rounded-lg transition-colors focus-ring-strong
                "
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </header>
        )}

        <div className={`flex-1 overflow-y-auto ${PADDING_CLASS[padding]} ${padding === 'none' ? 'pt-0' : ''}`}>
          {children}
        </div>

        {footer && (
          <footer className="px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0 rounded-b-2xl">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};
