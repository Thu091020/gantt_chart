import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, useDeleteProject, type Project } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil, Trash2, Calendar, Users, Loader2, UserCircle, Clock, BarChart3, GanttChart, UsersRound, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Projects() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useProjects();
  const { data: users = [] } = useUsers();
  const deleteProject = useDeleteProject();
  
  // Fetch project members count
  const { data: projectMembers = [] } = useQuery({
    queryKey: ['project_members_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select('project_id, is_active');
      if (error) throw error;
      return data;
    }
  });

  // Fetch total efforts per project with employee and date info for conflict detection
  const { data: allocations = [] } = useQuery({
    queryKey: ['allocations_summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('allocations')
        .select('project_id, employee_id, date, effort');
      if (error) throw error;
      return data;
    }
  });

  // Calculate member counts per project
  const memberCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    projectMembers.forEach(pm => {
      if (pm.is_active) {
        map[pm.project_id] = (map[pm.project_id] || 0) + 1;
      }
    });
    return map;
  }, [projectMembers]);

  // Calculate total efforts per project
  const effortMap = useMemo(() => {
    const map: Record<string, number> = {};
    allocations.forEach(a => {
      map[a.project_id] = (map[a.project_id] || 0) + Number(a.effort);
    });
    return map;
  }, [allocations]);

  // Calculate conflict info per project (count unique dates with overloaded employees)
  const conflictMap = useMemo(() => {
    // Group allocations by employee+date to find total daily effort
    const dailyEffortMap: Record<string, { total: number; allocations: { projectId: string; date: string }[] }> = {};
    
    allocations.forEach(a => {
      const key = `${a.employee_id}_${a.date}`;
      if (!dailyEffortMap[key]) {
        dailyEffortMap[key] = { total: 0, allocations: [] };
      }
      dailyEffortMap[key].total += Number(a.effort);
      dailyEffortMap[key].allocations.push({ projectId: a.project_id, date: a.date });
    });

    // Find unique conflict dates per project
    const projectConflictDates: Record<string, Set<string>> = {};
    
    Object.values(dailyEffortMap).forEach(({ total, allocations: allocs }) => {
      if (total > 1) {
        allocs.forEach(({ projectId, date }) => {
          if (!projectConflictDates[projectId]) {
            projectConflictDates[projectId] = new Set();
          }
          projectConflictDates[projectId].add(date);
        });
      }
    });

    // Convert to count
    const result: Record<string, number> = {};
    Object.entries(projectConflictDates).forEach(([projectId, dates]) => {
      result[projectId] = dates.size;
    });

    return result;
  }, [allocations]);

  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [search, setSearch] = useState('');
  const [pmFilter, setPmFilter] = useState<string>('all');
  const [sortByPm, setSortByPm] = useState<'asc' | 'desc' | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

  const getPmName = (pmId: string | null) => {
    if (!pmId) return null;
    const pm = users.find(u => u.id === pmId);
    return pm ? (pm.full_name || pm.email) : null;
  };

  const getUpdaterName = (id: string | null) => {
    if (!id) return null;
    const user = users.find(u => u.user_id === id || u.id === id);
    return user ? (user.full_name || user.email) : null;
  };

  // Get unique PMs for filter dropdown
  const uniquePms = useMemo(() => {
    const pms = projects
      .filter(p => p.pm_id)
      .map(p => ({ id: p.pm_id!, name: getPmName(p.pm_id) }))
      .filter((pm, index, self) => self.findIndex(t => t.id === pm.id) === index);
    return pms;
  }, [projects, users]);

  const filteredProjects = useMemo(() => {
    let result = projects.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
    );

    // Filter by PM
    if (pmFilter !== 'all') {
      if (pmFilter === 'none') {
        result = result.filter(p => !p.pm_id);
      } else {
        result = result.filter(p => p.pm_id === pmFilter);
      }
    }

    // Sort by PM
    if (sortByPm) {
      result = [...result].sort((a, b) => {
        const pmA = getPmName(a.pm_id) || '';
        const pmB = getPmName(b.pm_id) || '';
        return sortByPm === 'asc' 
          ? pmA.localeCompare(pmB, 'vi')
          : pmB.localeCompare(pmA, 'vi');
      });
    }

    return result;
  }, [projects, search, pmFilter, sortByPm, users]);

  const handleEdit = (project: Project) => {
    setEditProject(project);
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    setProjectToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProject.mutate(projectToDelete.id);
    }
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditProject(null);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Đang thực hiện';
      case 'completed': return 'Hoàn thành';
      case 'on-hold': return 'Tạm dừng';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'status-busy';
      case 'completed': return 'status-available';
      case 'on-hold': return 'status-full';
      default: return '';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý dự án</h1>
            <p className="text-muted-foreground mt-1">
              Thêm, sửa, xóa thông tin dự án
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm dự án
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border">
          <div className="px-3 py-2 border-b border-border flex items-center gap-3">
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm dự án..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-7 text-xs"
              />
            </div>
            <Select value={pmFilter} onValueChange={setPmFilter}>
              <SelectTrigger className="w-[160px] h-7 text-xs">
                <UserCircle className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Lọc theo PM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả PM</SelectItem>
                <SelectItem value="none">Chưa có PM</SelectItem>
                {uniquePms.map(pm => (
                  <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setSortByPm(prev => prev === null ? 'asc' : prev === 'asc' ? 'desc' : null)}
            >
              {sortByPm === null && <ArrowUpDown className="w-3 h-3" />}
              {sortByPm === 'asc' && <ArrowUp className="w-3 h-3" />}
              {sortByPm === 'desc' && <ArrowDown className="w-3 h-3" />}
              Sắp xếp PM
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã dự án</TableHead>
                  <TableHead>Tên dự án</TableHead>
                  <TableHead>PM</TableHead>
                  <TableHead>Thành viên</TableHead>
                  <TableHead>Efforts</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Cập nhật lần cuối</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => {
                  const memberCount = memberCountMap[project.id] || 0;
                  const totalEffort = effortMap[project.id] || 0;
                  const conflictCount = conflictMap[project.id] || 0;
                  const pmName = getPmName(project.pm_id);
                  const updaterId = project.updated_by ?? project.last_sync_by;
                  const updaterName = getUpdaterName(updaterId);
                    return (
                    <TableRow key={project.id} className="h-8">
                      <TableCell className="font-medium py-1 text-xs">{project.code}</TableCell>
                      <TableCell className="py-1">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="text-xs">{project.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1">
                        {pmName ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <UserCircle className="w-3 h-3 text-muted-foreground" />
                            <span>{pmName}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell className="py-1">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{memberCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <BarChart3 className="w-3 h-3" />
                          <span>{totalEffort.toFixed(1)}</span>
                          {conflictCount > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="w-3 h-3 text-amber-500 cursor-help" />
                                </TooltipTrigger>
                              <TooltipContent>
                                  <p>{conflictCount} ngày có xung đột nguồn lực</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-1">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(project.start_date), 'dd/MM/yy', { locale: vi })} - {format(new Date(project.end_date), 'dd/MM/yy', { locale: vi })}
                        </div>
                      </TableCell>
                      <TableCell className="py-1">
                        <span className={cn('status-badge text-[11px]', getStatusClass(project.status))}>
                          {getStatusLabel(project.status)}
                        </span>
                      </TableCell>
                      <TableCell className="py-1">
                        {project.updated_at ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-default">
                                  <Clock className="w-3 h-3 text-muted-foreground" />
                                  <div className="flex flex-col leading-tight">
                                    <span className="text-[11px]">{updaterName || 'N/A'}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: vi })}
                                    </span>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {format(new Date(project.updated_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right py-1">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[11px] px-2"
                            onClick={() => navigate(`/projects/${project.id}?view=gantt`)}
                          >
                            <GanttChart className="w-3 h-3 mr-1" />
                            Tiến độ
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[11px] px-2"
                            onClick={() => navigate(`/projects/${project.id}?view=resources`)}
                          >
                            <UsersRound className="w-3 h-3 mr-1" />
                            Nguồn lực
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEdit(project)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(project.id, project.name)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredProjects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Không tìm thấy dự án nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {showForm && (
        <ProjectForm onClose={handleCloseForm} editProject={editProject} />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa dự án</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa dự án "{projectToDelete?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
