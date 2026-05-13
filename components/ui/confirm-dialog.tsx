'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'default',
}: ConfirmDialogProps) {
  const isDestructive = variant === 'destructive';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[460px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_10px_26px_rgba(15,31,51,0.10)] sm:p-7"
        showCloseButton={false}
      >
        <DialogHeader className="mb-2">
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              isDestructive 
                ? 'bg-rose-50'
                : 'bg-[var(--color-accent-soft)]'
            }`}>
              {isDestructive ? (
                <Trash2 className="h-5 w-5 text-rose-700" />
              ) : (
                <AlertCircle className="h-5 w-5 text-[var(--color-accent)]" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold text-[var(--color-text)] tracking-tight text-left">
                {title}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-4 text-left leading-relaxed text-[var(--color-text-secondary)]">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="mt-7 flex-row justify-end gap-3 border-t border-[var(--color-border)] pt-4 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-xl border-[var(--color-border)] px-5 text-[var(--color-text-secondary)] transition-all active:scale-[0.99] hover:bg-[var(--color-surface-muted)]"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={`h-11 rounded-xl px-5 font-medium transition-all active:scale-[0.99] ${
              isDestructive 
                ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                : 'bg-[var(--color-accent)] hover:brightness-95 text-white'
            }`}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
