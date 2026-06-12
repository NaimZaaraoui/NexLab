import { Mail, PencilLine, Printer, ReceiptText, Tags } from 'lucide-react';
import { isAnalysisFinalValidated } from '@/lib/analysis/status-flow';
import { useDirectPrint } from '@/lib/hooks/useDirectPrint';
import { LabelQuantityModal } from './LabelQuantityModal';
import { useAnalysisContext } from './AnalysisContext';
import { useState } from 'react';

export function AnalysisWorkflowActions() {
  const { printUrl } = useDirectPrint();
  const {
    analysis,
    sendingEmail,
    emailConfigured,
    setEditDialogOpen,
    handlePrint,
    handleSendEmail,
    selectedIds,
  } = useAnalysisContext();

  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const { handlePrintInvoice } = useAnalysisContext();

  const isFinalValidated = isAnalysisFinalValidated(analysis?.status);
  const selectedIdsCount = selectedIds.length;
  
  const onEdit = () => setEditDialogOpen(true);
  const onPrintInvoice = handlePrintInvoice;
  const onOpenLabels = () => {
    if (analysis) {
      setLabelModalOpen(true);
    }
  };

  const handleConfirmLabels = (n: number) => {
    if (analysis) {
      printUrl(`/print/labels/${analysis.id}?autoprint=1&count=${n}&_t=${Date.now()}`);
    }
  };
  const onPrint = handlePrint;
  const onSendEmail = handleSendEmail;
  if (!analysis) return null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {!isFinalValidated ? (
        <>
          <button onClick={onEdit} className="btn-secondary h-10">
            <PencilLine size={16} /> Modifier dossier
          </button>

          <div className="ml-auto flex gap-2">
            <button onClick={onPrintInvoice} className="btn-secondary h-10 px-4">
              <ReceiptText size={16} /> Facture
            </button>
            <button onClick={onOpenLabels} className="btn-secondary h-10 px-4">
              <Tags size={16} /> Etiquettes
            </button>
            <button onClick={onPrint} className="btn-secondary h-10 px-4">
              <Printer size={16} /> {selectedIdsCount > 0 ? `Brouillon (${selectedIdsCount})` : 'Brouillon'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="ml-auto flex gap-2">
            <button onClick={onPrintInvoice} className="btn-secondary h-10 px-4">
              <ReceiptText size={16} /> Facture
            </button>
            <button onClick={onOpenLabels} className="btn-secondary h-10 px-4">
              <Tags size={16} /> Etiquettes
            </button>
            <button
              onClick={onSendEmail}
              disabled={sendingEmail || !emailConfigured}
              title={!emailConfigured ? 'Service email non configuré' : undefined}
              className="btn-secondary h-10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Mail size={16} className={sendingEmail ? 'animate-pulse' : ''} /> Email
            </button>
            <button onClick={onPrint} className="btn-primary h-10 !bg-emerald-500 hover:!bg-emerald-600">
              <Printer size={16} /> Impression Finale
            </button>
          </div>
        </>
      )}
      <LabelQuantityModal
        open={labelModalOpen}
        onOpenChange={setLabelModalOpen}
        onConfirm={handleConfirmLabels}
      />
    </div>
  );
}
