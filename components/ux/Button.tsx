import React from 'react';

/**
 * Button — consistent, accessible button primitive.
 *
 * Variants:
 *  - primary  : dark slate (the "Add" / main action color)
 *  - secondary: white with border
 *  - danger   : red (destructive)
 *  - ghost    : transparent (for icon buttons / tertiary actions)
 *  - success  : emerald (for positive confirmations)
 *
 * Sizes: sm, md, lg, icon (square)
 *
 * Accessibility:
 *  - Renders <button> by default, <a> if `href` is provided
 *  - Always shows a focus-visible ring
 *  - Disables itself correctly with `disabled` / `aria-busy`
 */
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  /** Full-width button (e.g. login submit) */
  fullWidth?: boolean;
  /** Show a leading spinner and mark the button busy */
  loading?: boolean;
  /** Loading text to show alongside the spinner (defaults to children) */
  loadingText?: string;
  /** Icon rendered on the left */
  leftIcon?: React.ReactNode;
  /** Icon rendered on the right */
  rightIcon?: React.ReactNode;
  /** Optional aria-label for icon-only buttons */
  'aria-label'?: string;
  className?: string;
  children?: React.ReactNode;
}

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const BASE =
  'inline-flex items-center justify-center gap-2 font-bold rounded-xl ' +
  'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ' +
  'focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ' +
  'active:scale-[0.98] select-none';

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    'bg-slate-900 text-white hover:bg-slate-800 shadow-sm ' +
    'disabled:hover:bg-slate-900',
  secondary:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 ' +
    'disabled:hover:bg-white',
  danger:
    'bg-red-600 text-white hover:bg-red-700 shadow-sm ' +
    'disabled:hover:bg-red-600',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm ' +
    'disabled:hover:bg-emerald-600',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 ' +
    'disabled:hover:bg-transparent',
};

const SIZE_CLASS: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 h-8',
  md: 'text-sm px-4 py-2 h-10',
  lg: 'text-base px-5 py-2.5 h-12',
  icon: 'p-0 h-10 w-10',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const {
      variant = 'primary',
      size = 'md',
      fullWidth,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      className = '',
      children,
      disabled,
      ...rest
    } = props;

    const sizeClass = size === 'icon' ? SIZE_CLASS.icon : SIZE_CLASS[size];
    const widthClass = fullWidth ? 'w-full' : '';
    const stateClass = loading ? 'cursor-wait' : '';

    const cls = [
      BASE,
      VARIANT_CLASS[variant],
      sizeClass,
      widthClass,
      stateClass,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const content = (
      <>
        {loading ? (
          <span
            className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
        ) : leftIcon ? (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}
        <span>{loading && loadingText ? loadingText : children}</span>
        {!loading && rightIcon ? (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        ) : null}
      </>
    );

    if ('href' in props && props.href !== undefined) {
      const { href, ...anchorRest } = rest as ButtonAsLink;
      return (
        <a
          {...anchorRest}
          href={href}
          className={cls}
          aria-busy={loading || undefined}
          aria-disabled={disabled || loading || undefined}
          ref={ref as unknown as React.Ref<HTMLAnchorElement>}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        {...(rest as ButtonAsButton)}
        ref={ref}
        className={cls}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        type={rest.type ?? 'button'}
      >
        {content}
      </button>
    );
  }
);
Button.displayName = 'Button';
