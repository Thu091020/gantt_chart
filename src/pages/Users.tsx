import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useUsers, useApproveUser, useUpdateUserRole, useCreateUser, useUpdateUser, useResetPassword, useDeleteUser } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Shield, User, Check, X, Pencil, Key, Trash2 } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

export default function Users() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { data: users = [], isLoading } = useUsers();
  const approveUser = useApproveUser();
  const updateRole = useUpdateUserRole();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const resetPassword = useResetPassword();
  const deleteUser = useDeleteUser();
  
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingUser, setEditingUser] = useState<typeof users[0] | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', role: 'user' as 'user' | 'admin' });
  const [editFormData, setEditFormData] = useState({ email: '', fullName: '', role: 'user' as 'user' | 'admin' });
  const [newPassword, setNewPassword] = useState('');

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Vui lòng điền email và mật khẩu');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    await createUser.mutateAsync({ ...formData });
    setShowForm(false);
    setFormData({ email: '', password: '', fullName: '', role: 'user' });
  };

  const handleOpenEdit = (user: typeof users[0]) => {
    setEditingUser(user);
    setEditFormData({
      email: user.email,
      fullName: user.full_name || '',
      role: user.roles.includes('admin') ? 'admin' : 'user'
    });
    setShowEditForm(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    // Update user info
    await updateUser.mutateAsync({
      userId: editingUser.user_id,
      email: editFormData.email !== editingUser.email ? editFormData.email : undefined,
      fullName: editFormData.fullName
    });
    
    // Update role if changed
    const currentIsAdmin = editingUser.roles.includes('admin');
    const newIsAdmin = editFormData.role === 'admin';
    
    if (currentIsAdmin !== newIsAdmin) {
      if (newIsAdmin) {
        await updateRole.mutateAsync({ userId: editingUser.user_id, role: 'admin', add: true });
      } else {
        await updateRole.mutateAsync({ userId: editingUser.user_id, role: 'admin', add: false });
      }
    }
    
    setShowEditForm(false);
    setEditingUser(null);
  };

  const handleOpenPasswordReset = (user: typeof users[0]) => {
    setEditingUser(user);
    setNewPassword('');
    setShowPasswordForm(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    await resetPassword.mutateAsync({ userId: editingUser.user_id, newPassword });
    setShowPasswordForm(false);
    setEditingUser(null);
    setNewPassword('');
  };

  const handleOpenDelete = (user: typeof users[0]) => {
    setEditingUser(user);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!editingUser) return;
    await deleteUser.mutateAsync({ userId: editingUser.user_id });
    setShowDeleteConfirm(false);
    setEditingUser(null);
  };

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Quản lý tài khoản</h1>
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
                  <TableHead className="py-2">Email</TableHead>
                  <TableHead className="py-2">Họ tên</TableHead>
                  <TableHead className="py-2">Quyền</TableHead>
                  <TableHead className="py-2">Trạng thái</TableHead>
                  <TableHead className="py-2">Ngày tạo</TableHead>
                  <TableHead className="py-2">Duyệt</TableHead>
                  <TableHead className="py-2 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="text-sm">
                    <TableCell className="py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          {user.roles.includes('admin') ? (
                            <Shield className="w-3 h-3 text-primary" />
                          ) : (
                            <User className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-1.5 text-muted-foreground">
                      {user.full_name || '-'}
                    </TableCell>
                    <TableCell className="py-1.5">
                      {user.roles.includes('admin') ? (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">Admin</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">User</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-1.5">
                      {user.is_approved ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <Check className="w-3 h-3" />
                          Đã duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-orange-500">
                          <X className="w-3 h-3" />
                          Chờ duyệt
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-1.5 text-muted-foreground text-xs">
                      {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: vi })}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Switch
                        checked={user.is_approved}
                        onCheckedChange={(checked) => 
                          approveUser.mutate({ userId: user.user_id, approved: checked })
                        }
                        disabled={approveUser.isPending}
                      />
                    </TableCell>
                    <TableCell className="py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleOpenEdit(user)}
                          title="Sửa thông tin"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleOpenPasswordReset(user)}
                          title="Đặt lại mật khẩu"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleOpenDelete(user)}
                          title="Xóa tài khoản"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground text-sm">
                      Chưa có tài khoản nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Thêm tài khoản mới</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 h-8 text-sm"
                placeholder="user@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-xs">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="mt-1 h-8 text-sm"
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>
            
            <div>
              <Label htmlFor="fullName" className="text-xs">Họ tên</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="mt-1 h-8 text-sm"
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <Label htmlFor="role" className="text-xs">Quyền</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'user' | 'admin') => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="mt-1 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="flex-1 h-8"
                onClick={() => setShowForm(false)}
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                className="flex-1 h-8"
                disabled={createUser.isPending}
              >
                {createUser.isPending && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                Tạo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Sửa thông tin tài khoản</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSaveEdit} className="space-y-3">
            <div>
              <Label htmlFor="editEmail" className="text-xs">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 h-8 text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="editFullName" className="text-xs">Họ tên</Label>
              <Input
                id="editFullName"
                value={editFormData.fullName}
                onChange={(e) => setEditFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="mt-1 h-8 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="editRole" className="text-xs">Quyền</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value: 'user' | 'admin') => setEditFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="mt-1 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="flex-1 h-8"
                onClick={() => setShowEditForm(false)}
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                className="flex-1 h-8"
                disabled={updateUser.isPending || updateRole.isPending}
              >
                {(updateUser.isPending || updateRole.isPending) && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                Lưu
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showPasswordForm} onOpenChange={setShowPasswordForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Đặt lại mật khẩu</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleResetPassword} className="space-y-3">
            <p className="text-sm text-muted-foreground">{editingUser?.email}</p>
            
            <div>
              <Label htmlFor="newPassword" className="text-xs">Mật khẩu mới</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 h-8 text-sm"
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="flex-1 h-8"
                onClick={() => setShowPasswordForm(false)}
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                className="flex-1 h-8"
                disabled={resetPassword.isPending}
              >
                {resetPassword.isPending && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                Đặt lại
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa tài khoản?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa tài khoản <strong>{editingUser?.email}</strong>? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}