import { DashboardClient } from './dashboard-client';
import { ProtectedLayout } from '~/components/protected-layout';

export default function DashboardPage() {
  return (
    <ProtectedLayout>
      <DashboardClient />
    </ProtectedLayout>
  );
}