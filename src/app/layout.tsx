import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { type ReactNode } from "react";

import { SessionProviderWrapper } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";
import { APP_CONFIG } from "@/config/app-config";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: APP_CONFIG.meta.title,
  description: APP_CONFIG.meta.description,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html suppressHydrationWarning className="light" lang="en">
      <body className={`${inter.className} min-h-screen antialiased`}>
        <SessionProviderWrapper>
          <ThemeProvider disableTransitionOnChange attribute="class" defaultTheme="light" enableSystem={false}>
            {children}
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
