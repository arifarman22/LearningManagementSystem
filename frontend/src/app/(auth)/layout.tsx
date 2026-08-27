import * as React from 'react';
import { BookMarked } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-neutral-50 flex flex-col">
      <header className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
          <BookMarked size={16} className="text-white" />
        </div>
        <span className="text-base font-bold text-neutral-900">LearnHub</span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="py-4 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} LearnHub. All rights reserved.
      </footer>
    </div>
  );
}
