import * as React from 'react';
import { cn } from '@/lib/cn';

const colorVariants = {
  brand:   'bg-brand-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger:  'bg-danger-500',
} as const;

const sizeVariants = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
} as const;

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;          // 0–100
  max?: number;
  color?: keyof typeof colorVariants;
  size?: keyof typeof sizeVariants;
  label?: string;
  showValue?: boolean;
  animated?: boolean;
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      max = 100,
      color = 'brand',
      size = 'md',
      label,
      showValue = false,
      animated = false,
      className,
      ...props
    },
    ref,
  ) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {(label || showValue) && (
          <div className="flex items-center justify-between mb-1.5">
            {label && <span className="text-xs font-medium text-neutral-600">{label}</span>}
            {showValue && (
              <span className="text-xs font-semibold text-neutral-700">{Math.round(pct)}%</span>
            )}
          </div>
        )}
        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
          className={cn('w-full bg-neutral-100 rounded-full overflow-hidden', sizeVariants[size])}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-smooth',
              colorVariants[color],
              animated && 'animate-pulse',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  },
);
ProgressBar.displayName = 'ProgressBar';
