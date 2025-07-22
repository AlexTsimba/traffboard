'use client';

import * as React from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { IconAlertCircle, IconRefresh, IconHome } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  const handleRetry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <IconAlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Dashboard Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <IconAlertCircle className="h-4 w-4" />
            <AlertTitle>Failed to Load Dashboard</AlertTitle>
            <AlertDescription>
              {error.message || 'An error occurred while loading the dashboard'}
              {error.digest && (
                <div className="mt-2 text-xs opacity-75">
                  Error ID: {error.digest}
                </div>
              )}
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleRetry} 
              className="w-full"
              disabled={isPending}
            >
              <IconRefresh className="mr-2 h-4 w-4" />
              {isPending ? 'Retrying...' : 'Try Again'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              <IconHome className="mr-2 h-4 w-4" />
              Go to Homepage
            </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            If this error persists, try refreshing the page or contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}