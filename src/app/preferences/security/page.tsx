import { SecurityClient } from './security-client';
import { ProtectedLayout } from '~/components/protected-layout';

export default function SecurityPage() {
  return (
    <ProtectedLayout>
      <SecurityClient />
    </ProtectedLayout>
  );
}