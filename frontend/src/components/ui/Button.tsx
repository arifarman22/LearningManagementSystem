import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/cn';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:        'bg-brand-600 text-white hover:bg-brand-700 hover:text-white active:bg-brand-800 shadow-sm',
  secondary:      'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:text-neutral-700 active:bg-neutral-100 shadow-sm',
  ghost:          'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 active:bg-neutral-200',
  danger:         'bg-danger-600 text-white hover:bg-danger-700 hover:text-white active:bg-danger-800 shadow-sm',
  'danger-ghost': 'text-danger-600 hover:bg-danger-50 hover:text-danger-600 active:bg-danger-100',
  link:           'text-brand-600 underline-offset-4 hover:underline hover:text-brand-600 p-0 h-auto',
} as const;

const sizes = {
  xs: 'h-7 px-2.5 text-xs gap-1.5',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-5 text-base gap-2',
  xl: 'h-11 px-6 text-base gap-2',
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      asChild = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    const cls = cn(
      'inline-flex items-center justify-center font-medium rounded-lg',
      'transition-colors duration-150 select-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      variants[variant],
      sizes[size],
      fullWidth && 'w-full',
      className,
    );

    // When used as a slot (asChild), pass children through directly — Slot
    // merges props onto the single child element. No extra wrappers.
    if (asChild) {
      return (
        <Comp ref={ref as React.Ref<HTMLButtonElement>} className={cls} {...props}>
          {children}
        </Comp>
      );
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cls}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={size === 'xs' || size === 'sm' ? 14 : 16} />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';
