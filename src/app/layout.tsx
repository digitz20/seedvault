import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'SeedVault - Secure Your Seed Phrases',
  description: 'Securely store and manage your cryptocurrency seed phrases.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          GeistSans.variable
        )}
      >
        <main className="flex min-h-screen flex-col items-center">
          {children}
        </main>
        <Toaster /> {/* Add Toaster component here */}
      </body>
    </html>
  );
}
