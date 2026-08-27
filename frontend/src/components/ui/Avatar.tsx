import * as React from 'react';
import { cn } from '@/lib/cn';

const sizes = {
  xs: 'w-6 h-6 text-2xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-12 h-12 text-base',
  '2xl': 'w-16 h-16 text-lg',
} as const;

const colors = [
  'bg-brand-100 text-brand-700',
  'bg-success-100 text-success-700',
  'bg-warning-100 text-warning-700',
  'bg-info-100 text-info-700',
  'bg-neutral-200 text-neutral-700',
] as const;

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % colors.length;
}

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}

export const Avatar = ({ name, src, size = 'md', className }: AvatarProps) => {
  const [imgError, setImgError] = React.useState(false);
  const showImage = src && !imgError;
  const colorClass = colors[getColorIndex(name)];

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold shrink-0 select-none overflow-hidden',
        sizes[size],
        !showImage && colorClass,
        className,
      )}
      aria-label={name}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
};
