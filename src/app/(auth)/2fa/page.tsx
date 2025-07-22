'use client';

import { TwoFactorForm } from '@daveyplate/better-auth-ui';
import { Card, CardHeader, CardTitle } from '~/components/ui/card';

export default function TwoFactorPage() {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
        <p className="text-muted-foreground">
          Complete your authentication
        </p>
      </CardHeader>
      <TwoFactorForm
        redirectTo="/dashboard"
        classNames={{
          button: "w-full transition-all duration-200",
          primaryButton: "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          input: "w-full px-3 py-2 border border-input bg-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          label: "text-sm font-medium leading-none",
          error: "text-sm font-medium text-destructive",
          description: "text-sm text-muted-foreground"
        }}
      />
    </Card>
  );
}