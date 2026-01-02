import { useState } from 'react';
import { useAddEmployee, useUpdateEmployee, type Employee } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const employeeSchema = z.object({
  code: z.string()
    .trim()
    .min(2, 'Mã nhân viên phải có ít nhất 2 ký tự')
    .max(20, 'Mã nhân viên không được vượt quá 20 ký tự')
    .regex(/^[A-Za-z0-9.,_-]+$/, 'Mã nhân viên chỉ được chứa chữ cái, số và các ký tự . , - _'),
  name: z.string()
    .trim()
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(100, 'Tên không được vượt quá 100 ký tự'),
  position: z.string()
    .trim()
    .max(100, 'Vị trí không được vượt quá 100 ký tự')
    .optional(),
  department: z.string()
    .trim()
    .max(100, 'Phòng ban không được vượt quá 100 ký tự')
    .optional()
});

interface EmployeeFormProps {
  onClose: () => void;
  editEmployee?: Employee | null;
}

export function EmployeeForm({ onClose, editEmployee }: EmployeeFormProps) {
  const addEmployee = useAddEmployee();
  const updateEmployee = useUpdateEmployee();
  const [formData, setFormData] = useState({
    code: editEmployee?.code || '',
    name: editEmployee?.name || '',
    position: editEmployee?.position || '',
    department: editEmployee?.department || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLoading = addEmployee.isPending || updateEmployee.isPending;

  const validateField = (field: keyof typeof formData, value: string) => {
    try {
      employeeSchema.shape[field].parse(value);
      setErrors(prev => ({ ...prev, [field]: '' }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
      }
      return false;
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      validateField(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = employeeSchema.safeParse(formData);
    
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
      name: result.data.name,
      position: result.data.position || '',
      department: result.data.department || ''
    };

    try {
      if (editEmployee) {
        await updateEmployee.mutateAsync({ id: editEmployee.id, data: sanitizedData });
      } else {
        await addEmployee.mutateAsync(sanitizedData);
      }
      onClose();
    } catch {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {editEmployee ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="code" className="text-sm">Mã nhân viên</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              onBlur={(e) => validateField('code', e.target.value)}
              placeholder="VD: NV001"
              className={`mt-1 h-9 ${errors.code ? 'border-destructive' : ''}`}
              disabled={isLoading}
              maxLength={20}
            />
            {errors.code && <p className="text-xs text-destructive mt-1">{errors.code}</p>}
          </div>

          <div>
            <Label htmlFor="name" className="text-sm">Họ và tên</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={(e) => validateField('name', e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className={`mt-1 h-9 ${errors.name ? 'border-destructive' : ''}`}
              disabled={isLoading}
              maxLength={100}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="position" className="text-sm">Vị trí</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleChange('position', e.target.value)}
              placeholder="VD: Senior Developer"
              className={`mt-1 h-9 ${errors.position ? 'border-destructive' : ''}`}
              disabled={isLoading}
              maxLength={100}
            />
            {errors.position && <p className="text-xs text-destructive mt-1">{errors.position}</p>}
          </div>

          <div>
            <Label htmlFor="department" className="text-sm">Phòng ban</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              placeholder="VD: Phòng IT"
              className={`mt-1 h-9 ${errors.department ? 'border-destructive' : ''}`}
              disabled={isLoading}
              maxLength={100}
            />
            {errors.department && <p className="text-xs text-destructive mt-1">{errors.department}</p>}
          </div>

          <div className="flex gap-3 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="flex-1" disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" size="sm" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editEmployee ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
