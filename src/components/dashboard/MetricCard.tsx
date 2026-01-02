import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function MetricCard({ title, value, subtitle, icon, trend, className }: MetricCardProps) {
  return (
    <div className={cn('bg-card rounded-lg border border-border p-2', className)}>
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground truncate">{title}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-lg font-bold">{value}</p>
            {subtitle && (
              <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      {trend && (
        <p className={cn(
          'text-[10px] font-medium mt-1',
          trend.isPositive ? 'text-success' : 'text-destructive'
        )}>
          {trend.isPositive ? '+' : ''}{trend.value}%
        </p>
      )}
    </div>
  );
}
