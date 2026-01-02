import { useState } from 'react';
import { useAddHoliday, useUpdateHoliday, type Holiday } from '@/hooks/useHolidays';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface HolidayFormProps {
  onClose: () => void;
  editHoliday?: Holiday | null;
}

export function HolidayForm({ onClose, editHoliday }: HolidayFormProps) {
  const addHoliday = useAddHoliday();
  const updateHoliday = useUpdateHoliday();
  const [formData, setFormData] = useState({
    date: editHoliday?.date || '',
    end_date: editHoliday?.end_date || editHoliday?.date || '',
    name: editHoliday?.name || '',
    is_recurring: editHoliday?.is_recurring || false
  });

  const isLoading = addHoliday.isPending || updateHoliday.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.name) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const data = {
      date: formData.date,
      end_date: formData.end_date || formData.date,
      name: formData.name,
      is_recurring: formData.is_recurring
    };

    if (editHoliday) {
      await updateHoliday.mutateAsync({ id: editHoliday.id, data });
    } else {
      await addHoliday.mutateAsync(data);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-sm p-4 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">
            {editHoliday ? 'Sửa ngày nghỉ' : 'Thêm ngày nghỉ'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date" className="text-xs">Ngày bắt đầu</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="mt-1 h-8 text-sm"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="end_date" className="text-xs">Ngày kết thúc</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="mt-1 h-8 text-sm"
                disabled={isLoading}
                min={formData.date}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="name" className="text-xs">Tên ngày nghỉ</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="VD: Tết Dương lịch"
              className="mt-1 h-8 text-sm"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_recurring"
              checked={formData.is_recurring}
              onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
              className="w-3.5 h-3.5 rounded border-input"
              disabled={isLoading}
            />
            <Label htmlFor="is_recurring" className="cursor-pointer text-xs">
              Lặp lại hàng năm
            </Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="flex-1 h-8" disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" size="sm" className="flex-1 h-8" disabled={isLoading}>
              {isLoading && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
              {editHoliday ? 'Cập nhật' : 'Thêm'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
