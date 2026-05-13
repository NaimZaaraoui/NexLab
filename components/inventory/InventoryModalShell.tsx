'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import type { ReactNode } from 'react';

interface InventoryModalShellProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function InventoryModalShell({ open, title, onClose, children }: InventoryModalShellProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col p-0 overflow-hidden">
        <DialogHeader className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-6 py-5">
          <DialogTitle className="text-lg font-semibold text-[var(--color-text)]">{title}</DialogTitle>
        </DialogHeader>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
