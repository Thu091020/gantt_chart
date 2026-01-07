import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../internal/ui"; // Đảm bảo đường dẫn import đúng với project của bạn
import { Loader2 } from "lucide-react";
import { cn } from "../internal/utils";

interface ConfirmModalProps {
  /** Trạng thái mở/đóng modal */
  open: boolean;
  /** Hàm set trạng thái mở/đóng */
  onOpenChange: (open: boolean) => void;
  /** Tiêu đề modal */
  title: string;
  /** Nội dung mô tả chi tiết */
  description?: React.ReactNode;
  /** Text nút xác nhận (Mặc định: Xác nhận) */
  confirmText?: string;
  /** Text nút hủy (Mặc định: Hủy) */
  cancelText?: string;
  /** Hàm chạy khi bấm xác nhận */
  onConfirm: () => void | Promise<void>;
  /** Loại hành động để đổi màu nút (default = xanh/đen, destructive = đỏ) */
  variant?: "default" | "destructive";
  /** Trạng thái đang xử lý (hiện loading spinner) */
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  variant = "default",
  isLoading = false,
}) => {
  
  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault(); // ngăn chặn đóng modal ngay lập tức nếu cần xử lý async
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-muted-foreground">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmModal;