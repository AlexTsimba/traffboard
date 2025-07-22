'use client';

import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { IconAlertCircle } from '@tabler/icons-react';

interface ChartErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ChartErrorFallbackProps>;
}

interface ChartErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function DefaultErrorFallback({ error, resetError }: ChartErrorFallbackProps) {
  return (
    <Card className='border-red-500'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6'>
          <Alert variant='destructive' className='border-none'>
            <IconAlertCircle className='h-4 w-4' />
            <AlertTitle>Chart Error</AlertTitle>
            <AlertDescription className='mt-2'>
              Failed to load chart: {error.message}
            </AlertDescription>
          </Alert>
        </div>
      </CardHeader>
      <CardContent className='flex h-[316px] items-center justify-center p-6'>
        <div className='text-center'>
          <p className='text-muted-foreground mb-4 text-sm'>
            Unable to display chart at this time
          </p>
          <Button
            onClick={resetError}
            variant='outline'
            className='min-w-[120px]'
          >
            Try again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

class ChartErrorBoundary extends React.Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart Error Boundary caught an error:', error, errorInfo);
    
    // You could integrate with error tracking services here:
    // trackError(error, { component: 'Chart', ...errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const ErrorComponent = this.props.fallback ?? DefaultErrorFallback;
      return (
        <ErrorComponent
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

export { ChartErrorBoundary, type ChartErrorFallbackProps };