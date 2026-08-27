import * as React from 'react';
import { cn } from '@/lib/cn';

// ── Base Skeleton ─────────────────────────────────────────────────────────────
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ width, height, className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('skeleton', className)}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...props}
    />
  ),
);
Skeleton.displayName = 'Skeleton';

// ── Skeleton Text ─────────────────────────────────────────────────────────────
export const SkeletonText = ({ lines = 3, className }: { lines?: number; className?: string }) => (
  <div className={cn('space-y-2', className)} aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className="h-4 rounded"
        style={{ width: i === lines - 1 ? '60%' : '100%' }}
      />
    ))}
  </div>
);

// ── Skeleton Card ─────────────────────────────────────────────────────────────
export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('card p-6 space-y-4', className)} aria-hidden="true">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
    </div>
    <SkeletonText lines={3} />
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-8 w-20 rounded-lg" />
      <Skeleton className="h-8 w-16 rounded-lg" />
    </div>
  </div>
);

// ── Skeleton Table Row ────────────────────────────────────────────────────────
export const SkeletonTableRow = ({ cols = 4 }: { cols?: number }) => (
  <tr aria-hidden="true">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-4 rounded" style={{ width: i === 0 ? '80%' : '60%' }} />
      </td>
    ))}
  </tr>
);

// ── Skeleton Avatar ───────────────────────────────────────────────────────────
export const SkeletonAvatar = ({ size = 40 }: { size?: number }) => (
  <Skeleton
    className="rounded-full shrink-0"
    style={{ width: size, height: size }}
    aria-hidden="true"
  />
);
