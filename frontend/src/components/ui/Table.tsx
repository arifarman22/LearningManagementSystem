import * as React from 'react';
import { cn } from '@/lib/cn';
import { SkeletonTableRow } from './Skeleton';

// ── Table wrapper ─────────────────────────────────────────────────────────────
export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto rounded-xl border border-neutral-200">
      <table
        ref={ref}
        className={cn('w-full text-sm text-left', className)}
        {...props}
      />
    </div>
  ),
);
Table.displayName = 'Table';

// ── Head ──────────────────────────────────────────────────────────────────────
export const TableHead = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('bg-neutral-50 border-b border-neutral-200', className)} {...props} />
  ),
);
TableHead.displayName = 'TableHead';

// ── Body ──────────────────────────────────────────────────────────────────────
export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('divide-y divide-neutral-100 bg-white', className)} {...props} />
  ),
);
TableBody.displayName = 'TableBody';

// ── Row ───────────────────────────────────────────────────────────────────────
export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement> & { clickable?: boolean }>(
  ({ className, clickable, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'transition-colors duration-100',
        clickable && 'cursor-pointer hover:bg-neutral-50',
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = 'TableRow';

// ── Header Cell ───────────────────────────────────────────────────────────────
export const TableHeaderCell = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap',
        className,
      )}
      {...props}
    />
  ),
);
TableHeaderCell.displayName = 'TableHeaderCell';

// ── Cell ──────────────────────────────────────────────────────────────────────
export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('px-4 py-3 text-neutral-700 align-middle', className)}
      {...props}
    />
  ),
);
TableCell.displayName = 'TableCell';

// ── Loading state ─────────────────────────────────────────────────────────────
export const TableLoading = ({ cols = 4, rows = 5 }: { cols?: number; rows?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonTableRow key={i} cols={cols} />
    ))}
  </>
);

// ── Empty state ───────────────────────────────────────────────────────────────
export const TableEmpty = ({
  cols,
  icon,
  title,
  description,
}: {
  cols: number;
  icon?: React.ReactNode;
  title: string;
  description?: string;
}) => (
  <tr>
    <td colSpan={cols} className="px-4 py-16 text-center">
      {icon && <div className="flex justify-center mb-3 text-neutral-300">{icon}</div>}
      <p className="text-sm font-medium text-neutral-500">{title}</p>
      {description && <p className="text-xs text-neutral-400 mt-1">{description}</p>}
    </td>
  </tr>
);
