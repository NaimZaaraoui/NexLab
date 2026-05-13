import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import type { AuditItem } from '@/components/audit/types';

interface AuditLogDetailsModalProps {
  selectedLog: AuditItem | null;
  detailsContent: React.ReactNode;
  onClose: () => void;
}

export function AuditLogDetailsModal({ selectedLog, detailsContent, onClose }: AuditLogDetailsModalProps) {
  return (
    <Dialog open={!!selectedLog} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-3xl flex-col p-6 overflow-hidden">
        <DialogHeader className="mb-4 flex items-start justify-between gap-3">
          <div>
            <DialogTitle className="text-base font-semibold text-[var(--color-text)]">Details du log</DialogTitle>
            <p className="mt-1 text-xs text-[var(--color-text-soft)]">
              {selectedLog ? `${new Date(selectedLog.createdAt).toLocaleString('fr-FR')} • ${selectedLog.action}` : ''}
            </p>
          </div>
        </DialogHeader>
        <div className="rounded-xl border bg-[var(--color-surface-muted)] p-4 overflow-hidden">
          <pre className="max-h-[50vh] overflow-auto custom-scrollbar whitespace-pre-wrap break-words text-xs text-[var(--color-text-secondary)]">{detailsContent}</pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
