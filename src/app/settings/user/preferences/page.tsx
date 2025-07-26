import { PreferencesClient } from './preferences-client';
import { PageContainer } from '~/components/page-container';

export default function UserPreferencesPage() {
  return (
    <PageContainer>
      <PreferencesClient />
    </PageContainer>
  );
}