import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // Redirect non-admin users to user settings
  if (session?.user?.role !== 'admin') {
    redirect('/settings/user/account');
  }

  // Don't wrap in ProtectedLayout since parent settings layout already does
  return <>{children}</>;
}