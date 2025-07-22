'use client';

import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import { authClient } from '~/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={(path) => {
        if (path === '/auth/sign-in' || path === '/sign-in') {
          router.push('/login');
        } else {
          router.push(path);
        }
      }}
      replace={(path) => {
        if (path === '/auth/sign-in' || path === '/sign-in') {
          router.replace('/login');
        } else {
          router.replace(path);
        }
      }}
      onSessionChange={() => router.refresh()}
      redirectTo="/login" // Redirect to login after sign-out
      Link={Link}
    >
      {children}
    </AuthUIProvider>
  );
}