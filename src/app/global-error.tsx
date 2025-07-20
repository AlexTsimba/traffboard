'use client';

import * as React from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    // Log the error to console (in production, you'd send to error tracking service)
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <IconAlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertTitle>Application Error</AlertTitle>
                <AlertDescription>
                  {error.message || 'An unexpected error occurred'}
                  {error.digest && (
                    <div className="mt-2 text-xs opacity-75">
                      Error ID: {error.digest}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col space-y-2">
                <Button onClick={reset} className="w-full">
                  <IconRefresh className="mr-2 h-4 w-4" />
                  Try again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                >
                  Go to Homepage
                </Button>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                If this problem persists, please contact support.
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}