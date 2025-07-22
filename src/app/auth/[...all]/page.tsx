import { AuthCard } from '@daveyplate/better-auth-ui';

interface AuthPageProps {
  params: Promise<{ all: string[] }>;
}

export default async function AuthPage({ params }: AuthPageProps) {
  const { all } = await params;
  const pathname = all.join('/');

  return (
    <main className="container flex min-h-screen grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6">
      <AuthCard pathname={pathname} />
    </main>
  );
}