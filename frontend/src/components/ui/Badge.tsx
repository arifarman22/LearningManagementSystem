import * as React from 'react';
import { cn } from '@/lib/cn';

const variants = {
  default:   'bg-neutral-100 text-neutral-700',
  brand:     'bg-brand-100 text-brand-700',
  success:   'bg-success-100 text-success-700',
  warning:   'bg-warning-100 text-warning-700',
  danger:    'bg-danger-100 text-danger-700',
  info:      'bg-info-100 text-info-700',
  draft:     'bg-neutral-100 text-neutral-600',
  published: 'bg-success-100 text-success-700',
} as const;

const sizes = {
  sm: 'px-2 py-0.5 text-2xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', dot = false, className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            variant === 'success' || variant === 'published' ? 'bg-success-500' :
            variant === 'warning' ? 'bg-warning-500' :
            variant === 'danger'  ? 'bg-danger-500' :
            variant === 'brand'   ? 'bg-brand-500' :
            variant === 'info'    ? 'bg-info-500' :
            'bg-neutral-400',
          )}
        />
      )}
      {children}
    </span>
  ),
);
Badge.displayName = 'Badge';
