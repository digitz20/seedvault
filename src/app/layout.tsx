
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { cn } from '@/lib/utils';
import Header from '@/components/layout/header'; // Import the Header component
// import { getUserAuth } from '@/lib/auth/utils'; // REMOVED auth import

export const metadata: Metadata = {
  title: 'SeedVault - Secure Your Seed Phrases',
  description: 'Securely store and manage your cryptocurrency seed phrases.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Removed getUserAuth call
  // const { session } = await getUserAuth(); // REMOVED

  return (
    <html lang="en" suppressHydrationWarning className="min-h-screen">
      <body
        className={cn(
          'flex flex-col min-h-screen bg-background font-sans antialiased', // Ensure body takes full height and uses flex column
          GeistSans.variable
        )}
      >
        {/* Pass null to Header as session is not available */}
        <Header session={null} />
        <main className="flex-1 flex flex-col items-center pt-4 pb-8"> {/* main content takes remaining space, added padding */}
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
