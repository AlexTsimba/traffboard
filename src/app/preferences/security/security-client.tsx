'use client';

import { TwoFactorManager } from '~/components/auth/two-factor-manager';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';

export function SecurityClient() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Settings</h1>
        <p className="text-muted-foreground">
          Manage your account security and two-factor authentication
        </p>
      </div>

      <Separator />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account by requiring a code from your authenticator app.
            </p>
          </CardHeader>
          <CardContent>
            <TwoFactorManager />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Account Security</CardTitle>
            <p className="text-sm text-muted-foreground">
              Additional security settings for your account.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Password</h3>
                <p className="text-sm text-muted-foreground">
                  Last changed: Never
                </p>
              </div>
              {/* Change password functionality can be added later */}
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Active Sessions</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your active login sessions
                </p>
              </div>
              {/* Session management can be added later */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}