import { ReactNode } from 'react';
import { TopNavbar } from './TopNavbar';
import { TooltipProvider } from '@/components/ui/tooltip';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <TopNavbar />
        <main className="pt-12 p-6">
          {children}
        </main>
      </div>
    </TooltipProvider>
  );
}
