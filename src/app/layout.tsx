// Root layout wrapper with ErrorBoundary
// Update this in /src/app/layout.tsx

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Esh7rni - Social Media Marketing Services',
  description: 'Get the best social media marketing services with Esh7rni',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
