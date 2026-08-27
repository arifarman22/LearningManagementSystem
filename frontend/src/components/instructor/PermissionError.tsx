import * as React from 'react';
import Link from 'next/link';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PermissionError({ message = "You don't have permission to access this resource." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mb-6">
        <ShieldX size={36} />
      </div>
      <h2 className="text-xl font-bold text-neutral-900 mb-2">Access Denied</h2>
      <p className="text-sm text-neutral-500 max-w-sm mb-6">{message}</p>
      <Button variant="secondary" asChild>
        <Link href="/instructor/courses" className="no-underline flex items-center gap-2">
          <ArrowLeft size={16} />
          Back to My Courses
        </Link>
      </Button>
    </div>
  );
}
