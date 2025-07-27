import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { ProtectedLayout } from '~/components/protected-layout';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch session once at settings root level
  const session = await auth.api.getSession({
    headers: await headers()
  });

  return (
    <ProtectedLayout sessionProp={session ?? undefined}>
      {children}
    </ProtectedLayout>
  );
}