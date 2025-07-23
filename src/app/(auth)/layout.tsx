import { PieChart } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Logo at top-left */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <PieChart className="size-4" />
          </div>
          <span className="text-xl font-semibold">Traffboard</span>
        </div>
      </div>
      
      {/* Content centered */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}