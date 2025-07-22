import '~/styles/globals.css';
import './theme.css';

import { type Metadata } from 'next';
import { Geist } from 'next/font/google';
import { cn } from '~/lib/utils';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '~/components/auth-provider';

export const metadata: Metadata = {
  title: 'Traffboard Analytics',
  description: 'Analytics dashboard for traffic analysis',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
};

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(geist.variable)}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Apply color theme immediately
                  const colorTheme = localStorage.getItem('color-theme') || 'tangerine';
                  if (['tangerine', 'vercel', 'claude'].includes(colorTheme)) {
                    document.documentElement.classList.remove('tangerine', 'vercel', 'claude');
                    document.documentElement.classList.add(colorTheme);
                  }
                  
                  // Apply scaling immediately
                  const isScaled = localStorage.getItem('theme-scaled') === 'true';
                  document.documentElement.classList.toggle('theme-scaled', isScaled);
                  
                  // Apply content centering immediately
                  const isContentCentered = localStorage.getItem('content-layout-centered');
                  const validIsContentCentered = isContentCentered !== null 
                    ? isContentCentered === 'true' 
                    : true; // Default to centered
                  document.documentElement.classList.toggle('content-centered', validIsContentCentered);
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          themes={['light', 'dark', 'system']}
          disableTransitionOnChange={false}
          storageKey="theme"
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}