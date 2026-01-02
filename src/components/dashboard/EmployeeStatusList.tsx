import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { useEmployees } from '@/hooks/useEmployees';
import { useProjects } from '@/hooks/useProjects';
import { useAllocations } from '@/hooks/useAllocations';

interface EmployeeStatusItemProps {
  name: string;
  position: string | null;
  effort: number;
  projects: string[];
  status: 'available' | 'busy' | 'full';
}

function EmployeeStatusItem({ name, position, effort, projects, status }: EmployeeStatusItemProps) {
  const statusLabels = {
    available: 'Trống',
    busy: 'Đang bận',
    full: 'Full'
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">{position || 'Chưa có vị trí'}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{(effort * 100).toFixed(0)}% effort</p>
          <p className="text-xs text-muted-foreground">
            {projects.length > 0 ? projects.join(', ') : 'Không có dự án'}
          </p>
        </div>
        <span className={cn(
          'status-badge',
          status === 'available' && 'status-available',
          status === 'busy' && 'status-busy',
          status === 'full' && 'status-full'
        )}>
          {statusLabels[status]}
        </span>
      </div>
    </div>
  );
}

export function EmployeeStatusList() {
  const { data: employees = [] } = useEmployees();
  const { data: projects = [] } = useProjects();
  const { data: allocations = [] } = useAllocations();

  const employeeStatuses = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return employees.map(employee => {
      const employeeAllocations = allocations.filter(a => a.employee_id === employee.id);
      
      const weeklyEffort = daysInWeek.reduce((total, day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayAllocations = employeeAllocations.filter(a => a.date === dateStr);
        const dayEffort = dayAllocations.reduce((sum, a) => sum + Number(a.effort), 0);
        return total + dayEffort;
      }, 0);

      const avgEffort = weeklyEffort / 5; // 5 working days
      
      const employeeProjects = [...new Set(employeeAllocations.map(a => a.project_id))]
        .map(pid => projects.find(p => p.id === pid)?.name || '')
        .filter(Boolean);

      let status: 'available' | 'busy' | 'full' = 'available';
      if (avgEffort >= 1) status = 'full';
      else if (avgEffort >= 0.5) status = 'busy';

      return {
        employee,
        effort: Math.min(avgEffort, 1),
        projects: employeeProjects,
        status
      };
    });
  }, [employees, projects, allocations]);

  return (
    <div className="space-y-3">
      {employeeStatuses.map(({ employee, effort, projects: prjs, status }) => (
        <EmployeeStatusItem
          key={employee.id}
          name={employee.name}
          position={employee.position}
          effort={effort}
          projects={prjs}
          status={status}
        />
      ))}
    </div>
  );
}
