import { PageContainer } from '~/components/page-container';
import { DataManagement } from '~/components/admin/data-management';

export default function AdminDataPage() {
  // Auth check is handled by parent admin layout

  return (
    <PageContainer>
      <div className="max-w-4xl">
        <DataManagement />
      </div>
    </PageContainer>
  );
}