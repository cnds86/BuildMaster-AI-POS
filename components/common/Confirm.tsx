import React, { useState, useCallback, createContext, useContext, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────
export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success'

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  details?: string
}

interface ConfirmContextType {
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

// ─── Context ─────────────────────────────────────────────────────────────
const ConfirmContext = createContext<ConfirmContextType | null>(null)

export const useConfirm = (): ConfirmContextType['confirm'] => {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    // Fallback: use window.confirm so we don't crash in environments
    // where the provider is missing (tests, storybook, etc.)
    return async (opts: ConfirmOptions) => {
      return window.confirm(`${opts.title}\n\n${opts.message}`)
    }
  }
  return ctx.confirm
}

// ─── Provider ────────────────────────────────────────────────────────────
export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ ...opts, resolve })
    })
  }, [])

  const handleClose = useCallback(
    (result: boolean) => {
      if (!state) return
      state.resolve(result)
      setState(null)
    },
    [state]
  )

  // Close on ESC
  useEffect(() => {
    if (!state) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, handleClose])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <ConfirmDialog
          title={state.title}
          message={state.message}
          confirmText={state.confirmText}
          cancelText={state.cancelText}
          variant={state.variant}
          details={state.details}
          onConfirm={() => handleClose(true)}
          onCancel={() => handleClose(false)}
        />
      )}
    </ConfirmContext.Provider>
  )
}

// ─── Dialog Component ───────────────────────────────────────────────────
interface ConfirmDialogProps extends ConfirmOptions {
  onConfirm: () => void
  onCancel: () => void
}

const VARIANT_STYLES: Record<ConfirmVariant, { bg: string; text: string; btn: string; icon: typeof AlertTriangle }> = {
  danger: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    btn: 'bg-red-600 hover:bg-red-700 text-white',
    icon: AlertTriangle,
  },
  warning: {
    bg: 'bg-amber-100',
    text: 'text-amber-600',
    btn: 'bg-amber-600 hover:bg-amber-700 text-white',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    btn: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: AlertTriangle,
  },
  success: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-600',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    icon: AlertTriangle,
  },
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  variant = 'danger',
  details,
  onConfirm,
  onCancel,
}) => {
  const styles = VARIANT_STYLES[variant]
  const Icon = styles.icon

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 text-center">
          <div className={`w-16 h-16 ${styles.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-8 h-8 ${styles.text}`} />
          </div>
          <h3 id="confirm-dialog-title" className="text-xl font-bold text-slate-900 mb-2">
            {title}
          </h3>
          <p className="text-slate-600 text-sm mb-1 whitespace-pre-line">{message}</p>
          {details && (
            <p className="text-slate-900 font-semibold text-base mb-3 break-words">{details}</p>
          )}
        </div>
        <div className="flex border-t border-slate-100 bg-slate-50">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-4 text-slate-700 font-bold hover:bg-slate-100 transition-colors border-r border-slate-100"
            data-testid="confirm-dialog-cancel"
            autoFocus
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-4 font-bold transition-colors ${styles.btn}`}
            data-testid="confirm-dialog-confirm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
