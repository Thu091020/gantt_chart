import { useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import { AlertTriangle, Clock, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Employee {
  id: string;
  name: string;
  code: string;
  position: string | null;
  department: string | null;
  is_active: boolean;
}

interface Project {
  id: string;
  name: string;
  code: string;
  status: string;
  start_date: string;
  end_date: string;
  color: string;
}

interface Allocation {
  id: string;
  employee_id: string;
  project_id: string;
  date: string;
  effort: number;
}

interface AlertsListProps {
  employees: Employee[];
  projects: Project[];
  allocations: Allocation[];
  daysInRange: Date[];
  className?: string;
}

interface Alert {
  id: string;
  type: 'overload' | 'deadline' | 'underload';
  severity: 'error' | 'warning' | 'info';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

export function AlertsList({ employees, projects, allocations, daysInRange, className }: AlertsListProps) {
  const alerts = useMemo(() => {
    const alertsList: Alert[] = [];
    const today = new Date();

    // Check for overloaded employees
    employees.forEach(employee => {
      const overloadDays: string[] = [];
      daysInRange.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayAllocations = allocations.filter(
          a => a.employee_id === employee.id && a.date === dateStr
        );
        const totalEffort = dayAllocations.reduce((sum, a) => sum + Number(a.effort), 0);
        if (totalEffort > 1) {
          overloadDays.push(format(day, 'dd/MM'));
        }
      });

      if (overloadDays.length > 0) {
        alertsList.push({
          id: `overload-${employee.id}`,
          type: 'overload',
          severity: 'error',
          title: employee.name,
          subtitle: `Quá tải ${overloadDays.length} ngày`,
          icon: <AlertTriangle className="w-3.5 h-3.5" />
        });
      }
    });

    // Check for projects nearing deadline
    projects
      .filter(p => p.status === 'active')
      .forEach(project => {
        const daysUntilEnd = differenceInDays(new Date(project.end_date), today);
        if (daysUntilEnd >= 0 && daysUntilEnd <= 7) {
          alertsList.push({
            id: `deadline-${project.id}`,
            type: 'deadline',
            severity: daysUntilEnd <= 3 ? 'error' : 'warning',
            title: project.name,
            subtitle: daysUntilEnd === 0 ? 'Hết hạn hôm nay' : `Còn ${daysUntilEnd} ngày`,
            icon: <Clock className="w-3.5 h-3.5" />
          });
        }
      });

    // Sort by severity
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return alertsList.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [employees, projects, allocations, daysInRange]);

  return (
    <div className={cn("bg-card rounded-lg border border-border p-3", className)}>
      <h2 className="text-sm font-semibold mb-2">Cảnh báo</h2>
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {alerts.length > 0 ? (
          <div className="space-y-1.5">
            {alerts.map(alert => (
              <div 
                key={alert.id}
                className={cn(
                  "flex items-center gap-2 py-1.5 px-2 rounded text-xs",
                  alert.severity === 'error' && "bg-destructive/10 text-destructive",
                  alert.severity === 'warning' && "bg-warning/10 text-warning",
                  alert.severity === 'info' && "bg-muted text-muted-foreground"
                )}
              >
                {alert.icon}
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{alert.title}</span>
                </div>
                <span className="text-[10px] opacity-80 whitespace-nowrap">{alert.subtitle}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
            <UserCheck className="w-8 h-8 mb-2 opacity-50" />
            <span>Không có cảnh báo</span>
          </div>
        )}
      </div>
    </div>
  );
}
