import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/store/auth';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'LMS',
    template: '%s | LMS',
  },
  description: 'A modern learning management system',
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast: 'font-sans text-sm rounded-xl border border-neutral-200 shadow-lg',
                title: 'font-semibold',
                description: 'text-neutral-500',
                success: 'border-success-200 bg-success-50 text-success-800',
                error: 'border-danger-200 bg-danger-50 text-danger-800',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
