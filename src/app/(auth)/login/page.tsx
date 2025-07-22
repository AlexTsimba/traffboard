'use client';

import { SignInForm } from '@daveyplate/better-auth-ui';
import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import { authClient } from '~/lib/auth-client';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import { useState } from 'react';

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <AuthUIProvider authClient={authClient}>
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <p className="text-muted-foreground">Sign in to your account</p>
          </CardHeader>
          <CardContent>
            <SignInForm 
              redirectTo="/dashboard"
              localization={{}}
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
              classNames={{
                button: "w-full transition-all duration-200",
                primaryButton: "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                input: "w-full px-3 py-2 border border-input bg-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                label: "text-sm font-medium leading-none",
                error: "text-sm font-medium text-destructive"
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AuthUIProvider>
  );
}