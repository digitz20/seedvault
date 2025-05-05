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
    <html lang="en" suppressHydrationWarning className="flex flex-col min-h-screen">
      <body
        className={cn(
          'flex-1 flex flex-col bg-background font-sans antialiased', // Make body flex-1 and flex-col
          GeistSans.variable
        )}
      >
        <main className="flex-1 flex flex-col items-center"> {/* Make main flex-1 */}
          {children}
        </main>
        {/* Updated footer with accent background and text color */}
        <footer className="py-4 mt-auto text-center text-xs bg-accent text-accent-foreground">
          © {new Date().getFullYear()} SeedVault. All rights reserved.
        </footer>
        <Toaster /> {/* Add Toaster component here */}
      </body>
    </html>
  );
}
