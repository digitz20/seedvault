
import React from 'react';

// This layout can be used to wrap authentication pages (login, signup)
// It currently doesn't add any specific UI, but provides a grouping mechanism
// and could be used for shared elements like a specific auth header/footer if needed.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
