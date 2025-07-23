import { PreferencesForm } from '~/components/preferences-form';
import { ProtectedLayout } from '~/components/protected-layout';
import { Separator } from '~/components/ui/separator';

export default function GeneralSettingsPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">General Settings</h1>
          <p className="text-muted-foreground">
            Customize your theme, display preferences, and interface settings.
          </p>
        </div>
        
        <Separator />
        
        <div className="max-w-2xl">
          <PreferencesForm />
        </div>
      </div>
    </ProtectedLayout>
  );
}