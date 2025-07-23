import { ProtectedLayout } from '~/components/protected-layout';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import Link from 'next/link';
import { Shield, Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2 max-w-4xl">
          <Link href="/settings/security">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage 2FA, passwords, and account security
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings/general">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Theme, display preferences, and interface settings
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </ProtectedLayout>
  );
}