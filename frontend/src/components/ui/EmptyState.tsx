import * as React from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
    {icon && (
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
        {icon}
      </div>
    )}
    <h3 className="text-base font-semibold text-neutral-700">{title}</h3>
    {description && (
      <p className="mt-1.5 text-sm text-neutral-500 max-w-sm">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
