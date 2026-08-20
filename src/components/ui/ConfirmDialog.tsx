import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  type = 'danger',
  isLoading = false,
}) => {
  const icons = {
    danger: <AlertTriangle className="h-6 w-6 text-rose-600" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-600" />,
    info: <Info className="h-6 w-6 text-blue-600" />,
    success: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
  };

  const buttonVariants: Record<string, 'danger' | 'primary' | 'success'> = {
    danger: 'danger',
    warning: 'primary',
    info: 'primary',
    success: 'success',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 shrink-0">{icons[type]}</div>
          <span>{title}</span>
        </div>
      }
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={buttonVariants[type]}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
    </Modal>
  );
};
