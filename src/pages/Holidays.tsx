import { useState } from 'react';
import { useHolidays, useDeleteHoliday, type Holiday } from '@/hooks/useHolidays';
import { MainLayout } from '@/components/layout/MainLayout';
import { HolidayForm } from '@/components/holidays/HolidayForm';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, RotateCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
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

export default function Holidays() {
  const { data: holidays = [], isLoading } = useHolidays();
  const deleteHoliday = useDeleteHoliday();
  const [showForm, setShowForm] = useState(false);
  const [editHoliday, setEditHoliday] = useState<Holiday | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleEdit = (holiday: Holiday) => {
    setEditHoliday(holiday);
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    setHolidayToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (holidayToDelete) {
      deleteHoliday.mutate(holidayToDelete.id);
    }
    setDeleteDialogOpen(false);
    setHolidayToDelete(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditHoliday(null);
  };

  const formatDateRange = (startDate: string, endDate?: string | null) => {
    const start = format(new Date(startDate), 'dd/MM/yyyy', { locale: vi });
    if (!endDate || endDate === startDate) return start;
    const end = format(new Date(endDate), 'dd/MM/yyyy', { locale: vi });
    return `${start} - ${end}`;
  };

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Quản lý ngày nghỉ lễ</h1>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm
          </Button>
        </div>

        <div className="bg-card rounded-lg border border-border">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2">Thời gian</TableHead>
                  <TableHead className="py-2">Tên ngày nghỉ</TableHead>
                  <TableHead className="py-2">Lặp lại</TableHead>
                  <TableHead className="py-2 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((holiday) => (
                  <TableRow key={holiday.id} className="text-sm">
                    <TableCell className="py-1.5 text-muted-foreground">
                      {formatDateRange(holiday.date, holiday.end_date)}
                    </TableCell>
                    <TableCell className="py-1.5 font-medium">{holiday.name}</TableCell>
                    <TableCell className="py-1.5">
                      {holiday.is_recurring ? (
                        <span className="inline-flex items-center gap-1 text-xs text-primary">
                          <RotateCw className="w-3 h-3" />
                          Hàng năm
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Một lần</span>
                      )}
                    </TableCell>
                    <TableCell className="py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(holiday)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(holiday.id, holiday.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {holidays.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                      Chưa có ngày nghỉ nào được cấu hình
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {showForm && (
        <HolidayForm onClose={handleCloseForm} editHoliday={editHoliday} />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa ngày nghỉ</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa ngày nghỉ "{holidayToDelete?.name}"? Hành động này không thể hoàn tác.
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
