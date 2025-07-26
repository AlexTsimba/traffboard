import { UsersTable } from '../../administration/users/users-table';
import { PageContainer } from '~/components/page-container';

export default function AdminUsersPage() {
  // Auth check is handled by parent admin layout

  return (
    <PageContainer>
      <UsersTable />
    </PageContainer>
  );
}