import { useState } from 'react';
import { useAddProject, useUpdateProject, type Project } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const baseProjectSchema = z.object({
  code: z.string()
    .trim()
    .min(2, 'Mã dự án phải có ít nhất 2 ký tự')
    .max(20, 'Mã dự án không được vượt quá 20 ký tự')
    .regex(/^[A-Za-z0-9._-]+$/, 'Mã dự án chỉ được chứa chữ cái, số và ký tự . - _'),
  name: z.string()
    .trim()
    .min(2, 'Tên dự án phải có ít nhất 2 ký tự')
    .max(100, 'Tên dự án không được vượt quá 100 ký tự'),
  start_date: z.string()
    .min(1, 'Vui lòng chọn ngày bắt đầu'),
  end_date: z.string()
    .min(1, 'Vui lòng chọn ngày kết thúc'),
  status: z.enum(['active', 'completed', 'on-hold'], {
    errorMap: () => ({ message: 'Trạng thái không hợp lệ' })
  }),
  color: z.string()
    .regex(/^#[A-Fa-f0-9]{6}$/, 'Màu sắc không hợp lệ'),
  pm_id: z.string().nullable().optional()
});

const projectSchema = baseProjectSchema.refine(data => {
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date);
  }
  return true;
}, {
  message: 'Ngày kết thúc phải sau ngày bắt đầu',
  path: ['end_date']
});

interface ProjectFormProps {
  onClose: () => void;
  editProject?: Project | null;
}

const colorOptions = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export function ProjectForm({ onClose, editProject }: ProjectFormProps) {
  const addProject = useAddProject();
  const updateProject = useUpdateProject();
  const { data: users } = useUsers();
  const [formData, setFormData] = useState({
    code: editProject?.code || '',
    name: editProject?.name || '',
    start_date: editProject?.start_date || '',
    end_date: editProject?.end_date || '',
    status: editProject?.status || 'active',
    color: editProject?.color || colorOptions[0],
    pm_id: editProject?.pm_id || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLoading = addProject.isPending || updateProject.isPending;

  const validateField = (field: keyof typeof formData, value: string) => {
    const fieldSchema = baseProjectSchema.shape[field as keyof typeof baseProjectSchema.shape];
    if (fieldSchema) {
      try {
        fieldSchema.parse(value);
        setErrors(prev => ({ ...prev, [field]: '' }));
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
        }
        return false;
      }
    }
    return true;
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      validateField(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = projectSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    const sanitizedData = {
      code: result.data.code.toUpperCase(),
      name: result.data.name.trim(),
      start_date: result.data.start_date,
      end_date: result.data.end_date,
      status: result.data.status,
      color: result.data.color,
      pm_id: result.data.pm_id || null
    };

    try {
      if (editProject) {
        await updateProject.mutateAsync({ id: editProject.id, data: sanitizedData });
      } else {
        await addProject.mutateAsync(sanitizedData);
      }
      onClose();
    } catch {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {editProject ? 'Sửa dự án' : 'Thêm dự án mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="code">Mã dự án</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              onBlur={(e) => validateField('code', e.target.value)}
              placeholder="VD: PRJ001"
              className={`mt-1 ${errors.code ? 'border-destructive' : ''}`}
              disabled={isLoading}
              maxLength={20}
            />
            {errors.code && (
              <p className="text-sm text-destructive mt-1">{errors.code}</p>
            )}
          </div>

          <div>
            <Label htmlFor="name">Tên dự án</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={(e) => validateField('name', e.target.value)}
              placeholder="VD: E-Commerce Platform"
              className={`mt-1 ${errors.name ? 'border-destructive' : ''}`}
              disabled={isLoading}
              maxLength={100}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Ngày bắt đầu</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                onBlur={(e) => validateField('start_date', e.target.value)}
                className={`mt-1 ${errors.start_date ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive mt-1">{errors.start_date}</p>
              )}
            </div>
            <div>
              <Label htmlFor="end_date">Ngày kết thúc</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                onBlur={(e) => validateField('end_date', e.target.value)}
                className={`mt-1 ${errors.end_date ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
              {errors.end_date && (
                <p className="text-sm text-destructive mt-1">{errors.end_date}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className={`mt-1 w-full px-3 py-2 rounded-lg border bg-background text-sm ${errors.status ? 'border-destructive' : 'border-input'}`}
                disabled={isLoading}
              >
                <option value="active">Đang thực hiện</option>
                <option value="completed">Hoàn thành</option>
                <option value="on-hold">Tạm dừng</option>
              </select>
              {errors.status && (
                <p className="text-sm text-destructive mt-1">{errors.status}</p>
              )}
            </div>
            <div>
              <Label htmlFor="pm_id">Quản lý dự án (PM)</Label>
              <select
                id="pm_id"
                value={formData.pm_id}
                onChange={(e) => handleChange('pm_id', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border bg-background text-sm border-input"
                disabled={isLoading}
              >
                <option value="">-- Chọn PM --</option>
                {users?.filter(u => u.is_approved).map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Màu sắc</Label>
            <div className="flex gap-2 mt-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleChange('color', color)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editProject ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
