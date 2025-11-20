"use client";

import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
