import "~/styles/globals.css";
import "./theme.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { cookies } from "next/headers";
import { cn } from "~/lib/utils";
import ThemeProvider from "~/components/layout/ThemeToggle/theme-provider";
import { ActiveThemeProvider } from "~/components/active-theme";

export const metadata: Metadata = {
  title: "Traffboard Analytics",
  description: "Analytics dashboard for traffic analysis",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('active_theme')?.value;
  const isScaled = activeThemeValue?.endsWith('-scaled');

  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <body className={cn(
        'bg-background overflow-hidden overscroll-none font-sans antialiased',
        activeThemeValue ? `theme-${activeThemeValue}` : '',
        isScaled ? 'theme-scaled' : ''
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ActiveThemeProvider initialTheme={activeThemeValue as string}>
            {children}
          </ActiveThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
