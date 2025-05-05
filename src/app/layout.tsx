
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { cn } from '@/lib/utils';
import Header from '@/components/layout/header'; // Import the Header component

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
    <html lang="en" suppressHydrationWarning className="min-h-screen">
      <body
        className={cn(
          'flex flex-col min-h-screen bg-background font-sans antialiased', // Ensure body takes full height and uses flex column
          GeistSans.variable
        )}
      >
        <Header /> {/* Always show the Header */}
        <main className="flex-1 flex flex-col items-center"> {/* main content takes remaining space */}
          {children}
        </main>
        {/* Footer sticks to the bottom */}
        <footer className="py-4 mt-auto text-center text-xs bg-accent text-accent-foreground">
          © {new Date().getFullYear()} SeedVault. All rights reserved.
        </footer>
        <Toaster /> {/* Add Toaster component here */}
      </body>
    </html>
  );
}
