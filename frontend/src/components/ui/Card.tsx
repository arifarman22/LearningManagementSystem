import * as React from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, padding = 'md', className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'card',
        hover && 'transition-shadow duration-200 hover:shadow-md cursor-pointer',
        padding === 'none' && 'p-0',
        padding === 'sm'  && 'p-4',
        padding === 'md'  && 'p-6',
        padding === 'lg'  && 'p-8',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-start justify-between gap-4 mb-4', className)} {...props}>
      {children}
    </div>
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-base font-semibold text-neutral-900', className)} {...props}>
      {children}
    </h3>
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props}>{children}</div>
  ),
);
CardBody.displayName = 'CardBody';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-3 mt-4 pt-4 border-t border-neutral-100', className)} {...props}>
      {children}
    </div>
  ),
);
CardFooter.displayName = 'CardFooter';
