import { useState, useRef } from 'react';
import { useEmployees, useDeleteEmployee, useUpdateEmployee } from '@/hooks/useEmployees';
import { useBulkAddEmployees } from '@/hooks/useBulkAddEmployees';
import { MainLayout } from '@/components/layout/MainLayout';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil, Trash2, Loader2, Upload, FileSpreadsheet, Download, UserCheck, UserX } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import type { Employee } from '@/hooks/useEmployees';

export default function Employees() {
  const { data: employees = [], isLoading } = useEmployees();
  const deleteEmployee = useDeleteEmployee();
  const updateEmployee = useUpdateEmployee();
  const bulkAddEmployees = useBulkAddEmployees();
  const [showForm, setShowForm] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [search, setSearch] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [csvPreview, setCsvPreview] = useState<{ code: string; name: string; position?: string; department?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: string; name: string } | null>(null);

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase()) ||
      (e.position?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (e.department?.toLowerCase() || '').includes(search.toLowerCase());
    const matchesStatus = showInactive ? true : e.is_active;
    return matchesSearch && matchesStatus;
  });

  const handleToggleActive = (employee: Employee) => {
    updateEmployee.mutate({
      id: employee.id,
      data: { is_active: !employee.is_active }
    });
  };

  const handleEdit = (employee: Employee) => {
    setEditEmployee(employee);
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    setEmployeeToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (employeeToDelete) {
      deleteEmployee.mutate(employeeToDelete.id);
    }
    setDeleteDialogOpen(false);
    setEmployeeToDelete(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditEmployee(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('File CSV phải có ít nhất 1 dòng dữ liệu');
        return;
      }

      const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^\ufeff/, ''));
      const codeIdx = header.findIndex(h => h === 'code' || h === 'mã' || h === 'mã nv' || h === 'manv' || h === 'ma_nv' || h === 'ma nv');
      const nameIdx = header.findIndex(h => h === 'name' || h === 'tên' || h === 'ten' || h === 'họ tên' || h === 'họ và tên' || h === 'ho_ten' || h === 'hoten' || h === 'ho va ten');
      const positionIdx = header.findIndex(h => h === 'position' || h === 'vị trí' || h === 'vi_tri' || h === 'vitri' || h === 'chức vụ' || h === 'chucvu' || h === 'vi tri');
      const departmentIdx = header.findIndex(h => h === 'department' || h === 'phòng ban' || h === 'phong_ban' || h === 'phongban' || h === 'phong ban');

      if (codeIdx === -1 || nameIdx === -1) {
        toast.error('File CSV phải có cột "code" và "name" (hoặc "mã" và "tên")');
        return;
      }

      const data = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim());
        return {
          code: cols[codeIdx] || '',
          name: cols[nameIdx] || '',
          position: positionIdx !== -1 ? cols[positionIdx] : undefined,
          department: departmentIdx !== -1 ? cols[departmentIdx] : undefined
        };
      }).filter(d => d.code && d.name);

      if (data.length === 0) {
        toast.error('Không có dữ liệu hợp lệ trong file CSV');
        return;
      }

      setCsvPreview(data);
      setShowImportDialog(true);
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = () => {
    bulkAddEmployees.mutate(csvPreview, {
      onSuccess: () => {
        setShowImportDialog(false);
        setCsvPreview([]);
      }
    });
  };

  const handleExportCSV = () => {
    const headers = ['Mã NV', 'Họ và tên', 'Vị trí', 'Phòng ban'];
    const rows = employees.map(e => [e.code, e.name, e.position || '', e.department || '']);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nhan-su-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Quản lý nhân sự</h1>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border">
          <div className="p-3 border-b border-border flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-8 text-sm"
              />
            </div>
            <Button 
              variant={showInactive ? "secondary" : "outline"} 
              size="sm" 
              className="h-8 text-xs"
              onClick={() => setShowInactive(!showInactive)}
            >
              <UserX className="w-3.5 h-3.5 mr-1.5" />
              {showInactive ? 'Ẩn inactive' : 'Hiện inactive'}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2">Mã NV</TableHead>
                  <TableHead className="py-2">Họ và tên</TableHead>
                  <TableHead className="py-2">Vị trí</TableHead>
                  <TableHead className="py-2">Phòng ban</TableHead>
                  <TableHead className="py-2">Trạng thái</TableHead>
                  <TableHead className="py-2 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className={cn("text-sm", !employee.is_active && "opacity-50")}>
                    <TableCell className="py-1.5 font-medium">{employee.code}</TableCell>
                    <TableCell className="py-1.5">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                          employee.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {employee.name.charAt(0)}
                        </div>
                        {employee.name}
                      </div>
                    </TableCell>
                    <TableCell className="py-1.5 text-muted-foreground">{employee.position || '-'}</TableCell>
                    <TableCell className="py-1.5 text-muted-foreground">{employee.department || '-'}</TableCell>
                    <TableCell className="py-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-6 px-2 text-[10px] gap-1",
                          employee.is_active ? "text-green-600 hover:text-green-600" : "text-muted-foreground"
                        )}
                        onClick={() => handleToggleActive(employee)}
                      >
                        {employee.is_active ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(employee)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(employee.id, employee.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-sm">
                      Không tìm thấy nhân viên nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {showForm && (
        <EmployeeForm onClose={handleCloseForm} editEmployee={editEmployee} />
      )}

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="w-4 h-4" />
              Import nhân viên từ CSV
            </DialogTitle>
            <DialogDescription className="text-xs">
              Xem trước {csvPreview.length} nhân viên sẽ được thêm
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto scrollbar-thin border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-1.5">STT</TableHead>
                  <TableHead className="py-1.5">Mã NV</TableHead>
                  <TableHead className="py-1.5">Họ và tên</TableHead>
                  <TableHead className="py-1.5">Vị trí</TableHead>
                  <TableHead className="py-1.5">Phòng ban</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {csvPreview.map((emp, idx) => (
                  <TableRow key={idx} className="text-sm">
                    <TableCell className="py-1 text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="py-1 font-medium">{emp.code}</TableCell>
                    <TableCell className="py-1">{emp.name}</TableCell>
                    <TableCell className="py-1 text-muted-foreground">{emp.position || '-'}</TableCell>
                    <TableCell className="py-1 text-muted-foreground">{emp.department || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex gap-2 pt-3 border-t">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => { setShowImportDialog(false); setCsvPreview([]); }}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button 
              size="sm"
              onClick={handleImportConfirm}
              disabled={bulkAddEmployees.isPending}
              className="flex-1"
            >
              {bulkAddEmployees.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Thêm {csvPreview.length} nhân viên
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa nhân viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa nhân viên "{employeeToDelete?.name}"? Hành động này không thể hoàn tác.
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
