
import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  // This layout can be simple or include shared elements for auth pages
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      {children}
    </div>
  );
}
