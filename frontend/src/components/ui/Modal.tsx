'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

// ── Root ──────────────────────────────────────────────────────────────────────
export const Modal = DialogPrimitive.Root;
export const ModalTrigger = DialogPrimitive.Trigger;
export const ModalClose = DialogPrimitive.Close;

// ── Portal + Overlay ──────────────────────────────────────────────────────────
export const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-neutral-950/50 backdrop-blur-sm',
      'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-in',
      className,
    )}
    {...props}
  />
));
ModalOverlay.displayName = 'ModalOverlay';

// ── Content ───────────────────────────────────────────────────────────────────
const sizes = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-xl',
  '2xl':'max-w-2xl',
  full: 'max-w-full mx-4',
} as const;

export interface ModalContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: keyof typeof sizes;
}

export const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ModalContentProps
>(({ size = 'md', className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <ModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2',
        'bg-white rounded-2xl shadow-2xl border border-neutral-200',
        'data-[state=open]:animate-fade-up',
        'focus:outline-none',
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
ModalContent.displayName = 'ModalContent';

// ── Header ────────────────────────────────────────────────────────────────────
export const ModalHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-neutral-100', className)}
    {...props}
  >
    {children}
  </div>
);

// ── Title ─────────────────────────────────────────────────────────────────────
export const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-neutral-900', className)}
    {...props}
  />
));
ModalTitle.displayName = 'ModalTitle';

// ── Description ───────────────────────────────────────────────────────────────
export const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-neutral-500 mt-1', className)}
    {...props}
  />
));
ModalDescription.displayName = 'ModalDescription';

// ── Body ──────────────────────────────────────────────────────────────────────
export const ModalBody = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-6 py-5', className)} {...props}>{children}</div>
);

// ── Footer ────────────────────────────────────────────────────────────────────
export const ModalFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex items-center justify-end gap-3 px-6 pb-6 pt-4 border-t border-neutral-100', className)}
    {...props}
  >
    {children}
  </div>
);

// ── Close Button ──────────────────────────────────────────────────────────────
export const ModalCloseButton = () => (
  <DialogPrimitive.Close
    className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    aria-label="Close"
  >
    <X size={18} />
  </DialogPrimitive.Close>
);

// ── Confirm Dialog ────────────────────────────────────────────────────────────
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
}: ConfirmDialogProps) => (
  <Modal open={open} onOpenChange={onOpenChange}>
    <ModalContent size="sm">
      <ModalHeader>
        <div>
          <ModalTitle>{title}</ModalTitle>
          {description && <ModalDescription>{description}</ModalDescription>}
        </div>
        <ModalCloseButton />
      </ModalHeader>
      <ModalFooter>
        <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);
