import * as React from 'react';
import { cn } from '@/lib/cn';

// ── Label ─────────────────────────────────────────────────────────────────────
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ required, className, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('block text-sm font-medium text-neutral-700 mb-1.5', className)}
      {...props}
    >
      {children}
      {required && <span className="text-danger-500 ml-0.5">*</span>}
    </label>
  ),
);
Label.displayName = 'Label';

// ── HelperText ────────────────────────────────────────────────────────────────
export const HelperText = ({
  error,
  children,
  className,
  id,
}: {
  error?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) => (
  <p id={id} className={cn('mt-1.5 text-xs', error ? 'text-danger-600' : 'text-neutral-500', className)}>
    {children}
  </p>
);

// ── Input ─────────────────────────────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftElement, rightElement, required, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && <Label htmlFor={inputId} required={required}>{label}</Label>}
        <div className="relative">
          {leftElement && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
              {leftElement}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'input-base',
              leftElement && 'pl-9',
              rightElement && 'pr-9',
              error && 'border-danger-500 focus:ring-danger-500 focus:border-danger-500',
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400">
              {rightElement}
            </div>
          )}
        </div>
        {error && <HelperText error id={`${inputId}-error`}>{error}</HelperText>}
        {!error && helperText && <HelperText id={`${inputId}-helper`}>{helperText}</HelperText>}
      </div>
    );
  },
);
Input.displayName = 'Input';

// ── Textarea ──────────────────────────────────────────────────────────────────
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, required, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && <Label htmlFor={inputId} required={required}>{label}</Label>}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'input-base resize-y min-h-[100px]',
            error && 'border-danger-500 focus:ring-danger-500 focus:border-danger-500',
            className,
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && <HelperText error>{error}</HelperText>}
        {!error && helperText && <HelperText>{helperText}</HelperText>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

// ── Select ────────────────────────────────────────────────────────────────────
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, required, options, placeholder, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && <Label htmlFor={inputId} required={required}>{label}</Label>}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'input-base appearance-none cursor-pointer',
            error && 'border-danger-500 focus:ring-danger-500 focus:border-danger-500',
            className,
          )}
          aria-invalid={!!error}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <HelperText error>{error}</HelperText>}
        {!error && helperText && <HelperText>{helperText}</HelperText>}
      </div>
    );
  },
);
Select.displayName = 'Select';
