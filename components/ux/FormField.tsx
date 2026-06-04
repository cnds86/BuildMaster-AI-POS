import React from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Accessible form field wrapper.
 * - Links label via htmlFor to its child input id
 * - Announces errors via aria-describedby
 * - Renders hint and error messages with consistent typography
 *
 * Usage:
 *   <FormField id="email" label="Email" required error={errors.email}>
 *     <input id="email" type="email" ... />
 *   </FormField>
 */
export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required = false,
  error,
  hint,
  children,
  className = '',
}) => {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-700 mb-1.5"
      >
        {label}
        {required && (
          <span className="text-red-600 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement, {
            id,
            'aria-invalid': error ? 'true' : undefined,
            'aria-describedby': describedBy,
            'aria-required': required || undefined,
          })
        : children}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1 text-xs text-red-600 flex items-start gap-1"
        >
          <span aria-hidden="true" className="font-bold leading-tight">
            ⚠
          </span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
