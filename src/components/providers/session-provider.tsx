"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

interface SessionProviderWrapperProps {
  readonly children: ReactNode;
}

export function SessionProviderWrapper({ children }: SessionProviderWrapperProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
