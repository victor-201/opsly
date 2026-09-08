import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [armed, setArmed] = useState(false);

  if (!open) return null;

  const handleClick = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    onConfirm();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={tone}
            onClick={handleClick}
            loading={loading}
            disabled={loading}
          >
            {armed ? 'Click again to confirm' : confirmLabel}
          </Button>
        </>
      }
    />
  );
}