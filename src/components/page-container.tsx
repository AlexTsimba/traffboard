import { cn } from '~/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'dashboard' | 'content';
}

export function PageContainer({ 
  children, 
  className,
  variant = 'content'
}: PageContainerProps) {
  return (
    <div 
      className={cn(
        // Apply content-centered class to enable centering on large screens
        'content-centered',
        // Variant-specific styling
        variant === 'dashboard' 
          ? 'flex flex-1 flex-col gap-4 p-4 md:px-6 page-centered'
          : 'space-y-4 p-4 page-centered',
        className
      )}
    >
      {children}
    </div>
  );
}